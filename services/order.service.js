const mongoose = require("mongoose");
const Order = require("../models/order.model");
const User = require("../models/user.model");
const Payment = require("../models/payment.model");
const Shipping = require("../models/shipping.model");
const Review = require("../models/review.model");
const OrderErrors = require("../Errors/OrderErrors");

const normalizeStatuses = (statuses) => {
  if (!statuses) return null;
  if (Array.isArray(statuses)) return statuses;
  return String(statuses)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
};

const createSort = (sortBy, sortOrder) => ({ [sortBy]: sortOrder === "asc" ? 1 : -1 });

const paginate = (items, page, limit) => {
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.min(page, pages);
  const start = (currentPage - 1) * limit;
  return {
    items: items.slice(start, start + limit),
    meta: {
      total,
      page: currentPage,
      limit,
      pages,
      hasNext: currentPage < pages,
      hasPrev: currentPage > 1,
    },
  };
};

const toVendorSummary = (items) => {
  const grouped = new Map();
  for (const item of items) {
    const key = String(item.vendorId || "unknown");
    if (!grouped.has(key)) {
      grouped.set(key, { vendorId: item.vendorId || null, total: 0, quantity: 0, items: [] });
    }
    const group = grouped.get(key);
    const lineTotal = Number(item.priceAtOrder) * Number(item.quantity);
    group.total += lineTotal;
    group.quantity += Number(item.quantity);
    group.items.push({
      productId: item.productId,
      productName: item.productName,
      productImage: item.productImage,
      price: item.priceAtOrder,
      quantity: item.quantity,
      lineTotal,
    });
  }
  return Array.from(grouped.values());
};

const applyCommonFilters = async (baseFilter, request = {}) => {
  const statuses = normalizeStatuses(request.statuses);
  if (statuses?.length) baseFilter.status = { $in: statuses };

  if (request.date) {
    const d = new Date(request.date);
    const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));
    const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
    baseFilter.orderDate = { $gte: start, $lte: end };
  }

  if (request.search) {
    const searchRegex = new RegExp(request.search, "i");
    const users = await User.find({ name: searchRegex }).select("_id").lean();
    const userIds = users.map((u) => u._id);

    const idMatch = mongoose.Types.ObjectId.isValid(request.search) ? new mongoose.Types.ObjectId(request.search) : null;
    baseFilter.$or = [
      ...(idMatch ? [{ _id: idMatch }] : []),
      { userId: { $in: userIds } },
      { "items.productName": searchRegex },
    ];
  }
};

const getOrderById = async (orderId) => {
  const order = await Order.findById(orderId).populate("userId", "name email").lean();
  if (!order) throw OrderErrors.OrderNotFound;

  const payment = order.paymentId ? await Payment.findById(order.paymentId).lean() : null;
  const vendorSummaries = toVendorSummary(order.items || []);

  const vendorIds = vendorSummaries.map((v) => v.vendorId).filter(Boolean);
  const vendors = await User.find({ _id: { $in: vendorIds } }).select("_id name sellerProfile.storeName").lean();
  const vendorMap = new Map(vendors.map((v) => [String(v._id), v]));

  return {
    id: order._id,
    userId: order.userId?._id || order.userId,
    customerName: order.userId?.name,
    totalAmount: order.totalAmount,
    orderDate: order.orderDate,
    status: order.status,
    items: order.items,
    vendors: vendorSummaries.map((v) => ({
      vendorId: v.vendorId,
      vendorName: vendorMap.get(String(v.vendorId))?.sellerProfile?.storeName || vendorMap.get(String(v.vendorId))?.name || "Unknown Vendor",
      totalAmount: v.total,
      totalQuantity: v.quantity,
      items: v.items,
    })),
    payment: payment
      ? {
          totalAmount: payment.totalAmount,
          status: payment.paymentStatus,
          date: payment.date,
          paymentMethod: payment.paymentMethod,
        }
      : null,
  };
};

const getOrderDetails = async (orderId, currentUserId, isAdmin) => {
  const order = await Order.findById(orderId).populate("userId", "name email address").lean();
  if (!order) throw OrderErrors.OrderNotFound;
  if (!isAdmin && String(order.userId?._id || order.userId) !== String(currentUserId)) throw OrderErrors.AccessDenied;

  const vendorSummaries = toVendorSummary(order.items || []);
  const vendorIds = vendorSummaries.map((v) => v.vendorId).filter(Boolean);
  const [vendors, shippings] = await Promise.all([
    User.find({ _id: { $in: vendorIds } }).select("_id name phone sellerProfile.storeName").lean(),
    Shipping.find({ orderId: order._id, vendorId: { $in: vendorIds } }).lean(),
  ]);

  const vendorMap = new Map(vendors.map((v) => [String(v._id), v]));
  const shippingMap = new Map(shippings.map((s) => [String(s.vendorId), s]));

  return {
    id: order._id,
    vendors: vendorSummaries.map((v) => {
      const vendor = vendorMap.get(String(v.vendorId));
      const shipping = shippingMap.get(String(v.vendorId));
      return {
        vendorId: v.vendorId,
        vendorName: vendor?.sellerProfile?.storeName || vendor?.name || "Unknown Vendor",
        vendorPhone: vendor?.phone || null,
        totalAmount: v.total,
        totalQuantity: v.quantity,
        items: v.items,
        estimatedDeliveryDate: shipping?.estimatedDeliveryDate || null,
        shippingStatus: shipping?.status || null,
      };
    }),
  };
};

const getOrderForSpecificVendor = async (orderId, vendorId, currentUserId, isAdmin) => {
  const order = await Order.findById(orderId).populate("userId", "address").lean();
  if (!order) throw OrderErrors.OrderNotFound;
  if (!isAdmin && String(order.userId?._id || order.userId) !== String(currentUserId)) throw OrderErrors.AccessDenied;

  const vendorItems = (order.items || []).filter((item) => String(item.vendorId) === String(vendorId));
  if (!vendorItems.length) throw OrderErrors.VendorOrderNotFound;

  const [vendor, shipping, reviews] = await Promise.all([
    User.findById(vendorId).select("_id name phone sellerProfile.storeName profilePicture").lean(),
    Shipping.findOne({ orderId: order._id, vendorId }).lean(),
    Review.find({
      userId: order.userId?._id || order.userId,
      productId: { $in: vendorItems.map((i) => i.productId) },
    })
      .select("productId rating")
      .lean(),
  ]);

  const reviewMap = new Map(reviews.map((r) => [String(r.productId), r]));
  return {
    vendorOrder: {
      orderId: order._id,
      vendorId: vendor?._id || vendorId,
      vendorName: vendor?.sellerProfile?.storeName || vendor?.name || "Unknown Vendor",
      vendorProfilePicture: vendor?.profilePicture?.url || null,
      status: order.status,
      orderDate: order.orderDate,
      totalQuantity: vendorItems.reduce((a, b) => a + Number(b.quantity), 0),
      totalAmount: vendorItems.reduce((a, b) => a + Number(b.quantity) * Number(b.priceAtOrder), 0),
    },
    products: vendorItems.map((item) => ({
      productId: item.productId,
      productImage: item.productImage,
      productName: item.productName,
      price: item.priceAtOrder,
      quantity: item.quantity,
      isReviewed: reviewMap.has(String(item.productId)),
      rating: reviewMap.get(String(item.productId))?.rating || 0,
    })),
    customerAddress: order.userId?.address || null,
    vendorPhone: vendor?.phone || null,
    estimatedDeliveryDate: shipping?.estimatedDeliveryDate || null,
    shippingStatus: shipping?.status || null,
  };
};

const getUserOrders = async (requestedUserId, currentUser) => {
  const isAdmin = currentUser.role === "admin";
  const isCustomer = currentUser.role === "customer";
  let userId = requestedUserId;

  if (isCustomer) {
    if (userId && String(userId) !== String(currentUser.userId)) throw OrderErrors.AccessDenied;
    userId = currentUser.userId;
  } else if (isAdmin && !userId) {
    throw OrderErrors.UserIdRequiredForAdmin;
  }

  const page = Number(currentUser.page || 1);
  const limit = Number(currentUser.limit || 10);
  const sort = createSort(currentUser.sortBy || "orderDate", currentUser.sortOrder || "desc");

  const query = Order.find({ userId }).sort(sort).lean();
  const allOrders = await query;
  const flattened = allOrders.flatMap((order) => {
    const groups = toVendorSummary(order.items || []);
    return groups.map((g) => ({
      orderId: order._id,
      vendorId: g.vendorId,
      vendorName: "Unknown Vendor",
      status: order.status,
      orderDate: order.orderDate,
      totalQuantity: g.quantity,
      totalAmount: g.total,
    }));
  });

  const vendorIds = [...new Set(flattened.map((x) => String(x.vendorId)).filter((v) => v && v !== "null"))];
  const vendors = await User.find({ _id: { $in: vendorIds } }).select("_id name sellerProfile.storeName profilePicture").lean();
  const vendorMap = new Map(vendors.map((v) => [String(v._id), v]));
  const enriched = flattened.map((x) => ({
    ...x,
    vendorName: vendorMap.get(String(x.vendorId))?.sellerProfile?.storeName || vendorMap.get(String(x.vendorId))?.name || "Unknown Vendor",
    vendorProfilePicture: vendorMap.get(String(x.vendorId))?.profilePicture?.url || null,
  }));

  return paginate(enriched, page, limit);
};

const getAllOrders = async (request) => {
  const page = Number(request.page || 1);
  const limit = Number(request.limit || 10);
  const filter = {};
  await applyCommonFilters(filter, request);
  const sort = createSort(request.sortBy || "orderDate", request.sortOrder || "desc");

  const orders = await Order.find(filter).sort(sort).populate("userId", "name").lean();
  const data = orders.map((o) => ({
    id: o._id,
    userId: o.userId?._id || o.userId,
    userName: o.userId?.name,
    vendors: toVendorSummary(o.items || []).map((v) => ({ vendorId: v.vendorId, totalAmount: v.total, totalQuantity: v.quantity })),
    totalAmount: o.totalAmount,
    orderDate: o.orderDate,
    status: o.status,
  }));

  return paginate(data, page, limit);
};

const getVendorOrders = async (requestedVendorId, currentUser, request) => {
  const isAdmin = currentUser.role === "admin";
  const isSeller = currentUser.role === "seller";
  let vendorId = requestedVendorId;

  if (isSeller) {
    if (vendorId && String(vendorId) !== String(currentUser.userId)) throw OrderErrors.AccessDenied;
    vendorId = currentUser.userId;
  } else if (isAdmin && !vendorId) {
    throw OrderErrors.VendorIdRequiredForAdmin;
  }

  const page = Number(request.page || 1);
  const limit = Number(request.limit || 10);
  const sort = createSort(request.sortBy || "orderDate", request.sortOrder || "desc");

  const filter = { "items.vendorId": new mongoose.Types.ObjectId(vendorId) };
  await applyCommonFilters(filter, request);

  const orders = await Order.find(filter).sort(sort).lean();
  const data = orders.map((o) => {
    const vendorItems = (o.items || []).filter((i) => String(i.vendorId) === String(vendorId));
    return {
      id: o._id,
      totalAmount: vendorItems.reduce((a, b) => a + Number(b.priceAtOrder) * Number(b.quantity), 0),
      orderDate: o.orderDate,
      status: o.status,
      items: vendorItems.map((i) => ({
        productId: i.productId,
        productName: i.productName,
        productImage: i.productImage,
        price: i.priceAtOrder,
        quantity: i.quantity,
      })),
    };
  });

  return paginate(data, page, limit);
};

const getVendorOrder = async (orderId, vendorId) => {
  const order = await Order.findById(orderId).lean();
  if (!order) throw OrderErrors.OrderNotFound;

  const vendorItems = (order.items || []).filter((i) => String(i.vendorId) === String(vendorId));
  if (!vendorItems.length) throw OrderErrors.VendorOrderNotFound;

  return {
    id: order._id,
    totalAmount: vendorItems.reduce((a, b) => a + Number(b.priceAtOrder) * Number(b.quantity), 0),
    orderDate: order.orderDate,
    status: order.status,
    items: vendorItems.map((i) => ({
      productId: i.productId,
      productName: i.productName,
      productImage: i.productImage,
      price: i.priceAtOrder,
      quantity: i.quantity,
    })),
  };
};

module.exports = {
  getOrderById,
  getOrderDetails,
  getOrderForSpecificVendor,
  getUserOrders,
  getAllOrders,
  getVendorOrders,
  getVendorOrder,
};
