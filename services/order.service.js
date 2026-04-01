const mongoose = require("mongoose");
const Order = require("../models/order.model");
const User = require("../models/user.model");
const Payment = require("../models/payment.model");
const Shipping = require("../models/shipping.model");
const Review = require("../models/review.model");
const Cart = require("../models/cart.model");
const APIError = require("../Errors/APIError");
const OrderErrors = require("../Errors/OrderErrors");
const cartService = require("./cart.service");
const kashierService = require("./kashier.service");
const { sendOrderStatusChangedEmail } = require("./email.service");

const safeEnqueueOrderEmail = async (emailPayload) => {
  try {
    await sendOrderStatusChangedEmail(emailPayload);
  } catch (err) {
    // Do not block the API response if email queue fails
    console.error("Failed to enqueue order status email:", err?.message || err);
  }
};

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

const updateOrderStatusByShippings = (order, shippings) => {
  const shippingStatuses = (shippings || []).map((s) => s.status);
  if (!shippingStatuses.length) {
    order.status = "pending";
    return;
  }

  if (shippingStatuses.every((s) => s === "delivered")) {
    order.status = "delivered";
    return;
  }

  const shippedSet = new Set(["outfordelivery"]);
  if (shippingStatuses.every((s) => shippedSet.has(s))) {
    order.status = "shipped";
    return;
  }

  if (shippingStatuses.every((s) => s === "preparing")) {
    order.status = "proccessing";
    return;
  }

  if (shippingStatuses.every((s) => s === "canceled")) {
    order.status = "canceled";
    return;
  }

  order.status = "pending";
};

const normalizeVendorId = (vendorRef) => {
  if (!vendorRef) return null;
  if (typeof vendorRef === "object" && vendorRef._id) return vendorRef._id;
  return vendorRef;
};

const buildShippingDocsForOrder = (orderId, orderItems) => {
  const shippingSeen = new Set();
  const shippingDocs = [];
  for (const line of orderItems) {
    const vid = line.vendorId;
    if (!vid) continue;
    const key = String(vid);
    if (shippingSeen.has(key)) continue;
    shippingSeen.add(key);
    shippingDocs.push({
      orderId,
      vendorId: vid,
      status: "preparing",
      estimatedDeliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    });
  }
  return shippingDocs;
};

const computeTotalsFromCart = (cart, orderItems) => {
  const subtotal = orderItems.reduce((sum, i) => sum + Number(i.priceAtOrder) * Number(i.quantity), 0);
  const discountAmountRaw = Number(cart?.discountAmount || 0);
  const discountAmount = Number.isFinite(discountAmountRaw) ? Math.max(0, discountAmountRaw) : 0;
  const shippingFee = 50;
  const totalAmount = Math.max(0, subtotal - discountAmount + shippingFee);
  return {
    subtotal,
    discountAmount,
    shippingFee,
    totalAmount,
    promoCode: cart?.promoCode || undefined,
  };
};

const buildOrderItemsFromCart = (cart) => {
  const items = (cart.items || []).map((item) => {
    const product = item.productId;
    if (!product) return null;
    return {
      productId: product._id,
      productName: product.name,
      productImage: product.imageUrl || product.images?.[0]?.url || null,
      priceAtOrder: Number(item.priceAtAddTime ?? product.price),
      quantity: Number(item.quantity),
      vendorId: normalizeVendorId(product.vendorId),
    };
  }).filter(Boolean);

  if (!items.length) throw OrderErrors.CartNotFoundOrEmpty;
  return items;
};

const applyCommonFilters = async (baseFilter, request = {}) => {
  const statuses = normalizeStatuses(request.statuses);

  if (statuses?.length) {
    // Always exclude "notpayed" from filtered results
    const filteredStatuses = statuses.filter((s) => s !== "notpayed");
    if (filteredStatuses.length) {
      baseFilter.status = { $in: filteredStatuses };
    } else {
      baseFilter.status = { $ne: "notpayed" };
    }
  } else {
    // Default: exclude "notpayed" everywhere
    baseFilter.status = { $ne: "notpayed" };
  }

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
  if (!order || order.status === "notpayed") throw OrderErrors.OrderNotFound;

  const payment = order.paymentId ? await Payment.findById(order.paymentId).lean() : null;
  const vendorSummaries = toVendorSummary(order.items || []);

  const vendorIds = vendorSummaries.map((v) => v.vendorId).filter(Boolean);
  const vendors = await User.find({ _id: { $in: vendorIds } }).select("_id name sellerProfile.storeName").lean();
  const vendorMap = new Map(vendors.map((v) => [String(v._id), v]));

  return {
    id: order._id,
    userId: order.userId?._id || order.userId,
    customerName: order.userId?.name,
    subtotal: order.subtotal ?? null,
    discountAmount: order.discountAmount ?? 0,
    shippingFee: order.shippingFee ?? 0,
    promoCode: order.promoCode ?? null,
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
  if (!order || order.status === "notpayed") throw OrderErrors.OrderNotFound;
  if (!isAdmin && String(order.userId?._id || order.userId) !== String(currentUserId)) throw OrderErrors.AccessDenied;

  const vendorSummaries = toVendorSummary(order.items || []);
  const vendorIds = vendorSummaries.map((v) => v.vendorId).filter(Boolean);
  const [vendors, shippings] = await Promise.all([
    User.find({ _id: { $in: vendorIds } }).select("_id name phone sellerProfile.storeName profilePicture").lean(),
    Shipping.find({ orderId: order._id, vendorId: { $in: vendorIds } }).lean(),
  ]);

  const vendorMap = new Map(vendors.map((v) => [String(v._id), v]));
  const shippingMap = new Map(shippings.map((s) => [String(s.vendorId), s]));

  return {
    id: order._id,
    subtotal: order.subtotal ?? null,
    discountAmount: order.discountAmount ?? 0,
    shippingFee: order.shippingFee ?? 0,
    promoCode: order.promoCode ?? null,
    totalAmount: order.totalAmount,
    orderDate: order.orderDate,
    status: order.status,
    vendors: vendorSummaries.map((v) => {
      const vendor = vendorMap.get(String(v.vendorId));
      const shipping = shippingMap.get(String(v.vendorId));
      return {
        vendorId: v.vendorId,
        vendorName: vendor?.sellerProfile?.storeName || vendor?.name || "Unknown Vendor",
        vendorPhone: vendor?.phone || null,
        vendorProfilePicture: vendor?.profilePicture?.url || null,
        vendorSubtotal: v.total,
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
  if (!order || order.status === "notpayed") throw OrderErrors.OrderNotFound;
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
  const vendorSubtotal = vendorItems.reduce((a, b) => a + Number(b.quantity) * Number(b.priceAtOrder), 0);
  return {
    vendorOrder: {
      orderId: order._id,
      vendorId: vendor?._id || vendorId,
      vendorName: vendor?.sellerProfile?.storeName || vendor?.name || "Unknown Vendor",
      vendorProfilePicture: vendor?.profilePicture?.url || null,
      status: order.status,
      orderDate: order.orderDate,
      totalQuantity: vendorItems.reduce((a, b) => a + Number(b.quantity), 0),
      vendorSubtotal,
      // Order-level totals (after discount) so APIs are consistent everywhere
      subtotal: order.subtotal ?? null,
      discountAmount: order.discountAmount ?? 0,
      promoCode: order.promoCode ?? null,
      totalAmount: order.totalAmount,
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

  const orders = await Order.find({ userId, status: { $ne: "notpayed" } }).sort(sort).lean();

  const allVendorIds = Array.from(
    new Set(
      orders
        .flatMap((o) => (o.items || []).map((i) => i.vendorId))
        .filter(Boolean)
        .map((v) => String(v))
        .filter((v) => v && v !== "null")
    )
  );

  const vendors = allVendorIds.length
    ? await User.find({ _id: { $in: allVendorIds } })
        .select("_id name sellerProfile.storeName profilePicture")
        .lean()
    : [];
  const vendorMap = new Map(vendors.map((v) => [String(v._id), v]));

  const data = orders.map((order) => {
    const vendorGroups = toVendorSummary(order.items || []);
    return {
      id: order._id,
      orderDate: order.orderDate,
      status: order.status,
      subtotal: order.subtotal ?? null,
      discountAmount: order.discountAmount ?? 0,
      promoCode: order.promoCode ?? null,
      totalAmount: order.totalAmount,
      itemCount: (order.items || []).reduce((sum, i) => sum + Number(i.quantity || 0), 0),
      vendors: vendorGroups.map((g) => {
        const vendor = g.vendorId ? vendorMap.get(String(g.vendorId)) : null;
        return {
          vendorId: g.vendorId,
          vendorName: vendor?.sellerProfile?.storeName || vendor?.name || "Unknown Vendor",
          vendorProfilePicture: vendor?.profilePicture?.url || null,
          vendorSubtotal: g.total,
          totalQuantity: g.quantity,
        };
      }),
    };
  });

  return paginate(data, page, limit);
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
    subtotal: o.subtotal ?? null,
    discountAmount: o.discountAmount ?? 0,
    promoCode: o.promoCode ?? null,
    totalAmount: o.totalAmount,
    orderDate: o.orderDate,
    status: o.status,
    paymentMethod: o.paymentMethod ,
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

  const orders = await Order.find(filter).sort(sort).populate("userId", "name").lean();

  const orderIds = orders.map((o) => o._id);
  const shippings = orderIds.length
    ? await Shipping.find({ orderId: { $in: orderIds }, vendorId }).lean()
    : [];
  const shippingMap = new Map(shippings.map((s) => [String(s.orderId), s.status]));

  const data = orders.map((o) => {
    const vendorItems = (o.items || []).filter((i) => String(i.vendorId) === String(vendorId));
    const vendorShippingStatus = shippingMap.get(String(o._id)) || o.status;
    const vendorSubtotal = vendorItems.reduce((a, b) => a + Number(b.priceAtOrder) * Number(b.quantity), 0);
    return {
      id: o._id,
      userName: o.userId?.name,
      vendorSubtotal,
      subtotal: o.subtotal ?? null,
      discountAmount: o.discountAmount ?? 0,
      promoCode: o.promoCode ?? null,
      totalAmount: o.totalAmount,
      orderDate: o.orderDate,
      status: vendorShippingStatus, 
      items: vendorItems.map((i) => ({
        productId: i.productId,
        productName: i.productName,
        productImage: i.productImage,
        price: i.priceAtOrder,
        quantity: i.quantity,
        status: vendorShippingStatus,
      })),
    };
  });

  return paginate(data, page, limit);
};

const getVendorOrder = async (orderId, vendorId) => {
  const order = await Order.findById(orderId).lean();
  if (!order || order.status === "notpayed") throw OrderErrors.OrderNotFound;

  const vendorItems = (order.items || []).filter((i) => String(i.vendorId) === String(vendorId));
  if (!vendorItems.length) throw OrderErrors.VendorOrderNotFound;

  const shipping = await Shipping.findOne({ orderId, vendorId }).lean();
  const vendorShippingStatus = shipping?.status || order.status;
  const vendorSubtotal = vendorItems.reduce((a, b) => a + Number(b.priceAtOrder) * Number(b.quantity), 0);

  return {
    id: order._id,
    vendorSubtotal,
    subtotal: order.subtotal ?? null,
    discountAmount: order.discountAmount ?? 0,
    promoCode: order.promoCode ?? null,
    totalAmount: order.totalAmount,
    orderDate: order.orderDate,
    status: vendorShippingStatus,
    items: vendorItems.map((i) => ({
      productId: i.productId,
      productName: i.productName,
      productImage: i.productImage,
      price: i.priceAtOrder,
      quantity: i.quantity,
      status: vendorShippingStatus,
    })),
  };
};

const mapTransactionError = (error, label) => {
  if (error?.statusCode) return error;
  if (error?.name === "ValidationError") {
    return new APIError(error.message || "Validation failed.", 400);
  }
  if (error?.code === 11000) {
    const detail = error.message || JSON.stringify(error.keyValue || {});
    return new APIError(detail, 409);
  }
  console.error(`[${label}]`, error?.message || error, error?.stack);
  const wrapped = new APIError("Order creation failed.", 400);
  wrapped.cause = error;
  return wrapped;
};


const rollbackDraftOrder = async (orderId) => {
  if (!orderId) return;
  await Shipping.deleteMany({ orderId }).catch(() => {});
  await Payment.deleteOne({ orderId }).catch(() => {});
  await Order.findByIdAndDelete(orderId).catch(() => {});
};

const createOrder = async (userId, payload = {}, sessionId) => {
  if (sessionId) {
    await cartService.mergeGuestCart(userId, sessionId);
  }
  let draftOrderId = null;
  try {
    const [cart, user] = await Promise.all([
      Cart.findOne({ userId }).populate("items.productId"),
      User.findById(userId).select("email"),
    ]);
    if (!cart || !cart.items?.length) throw OrderErrors.CartNotFoundOrEmpty;

    const orderItems = buildOrderItemsFromCart(cart);
    const totals = computeTotalsFromCart(cart, orderItems);

    const order = await Order.create([
      {
        userId,
        totalAmount: totals.totalAmount,
        subtotal: totals.subtotal,
        discountAmount: totals.discountAmount,
        shippingFee: totals.shippingFee,
        promoCode: totals.promoCode,
        orderDate: new Date(),
        status: "notpayed",
        items: orderItems,
        paymentMethod: "credit_card",
        guestEmail: user?.email || undefined,
      },
    ]);

    const createdOrder = order[0];
    draftOrderId = createdOrder._id;

    const payment = await Payment.create([
      {
        orderId: createdOrder._id,
        totalAmount: totals.totalAmount,
        paymentMethod: "credit_card",
        paymentStatus: "pending",
        paidBy: { userId, email: user?.email },
      },
    ]);
    createdOrder.paymentId = payment[0]._id;

 

    const providerSession = await kashierService.createPaymentSession({
      amount: totals.totalAmount,
      orderId: `ORDER-${createdOrder._id}`,
      notes: payload.notes || "Order payment",
    });
    if (!providerSession?._id) throw OrderErrors.PaymentSessionCreationFailed;

    payment[0].gatewayPaymentId = providerSession._id;
    await payment[0].save();
    await createdOrder.save();


    draftOrderId = null;

    return {
      // Minimal order snapshot; status is "notpayed" and this order is hidden
      // from all public order-listing endpoints until payment succeeds.
      order: {
        id: createdOrder._id,
        userId,
        subtotal: totals.subtotal,
        discountAmount: totals.discountAmount,
        shippingFee: totals.shippingFee,
        promoCode: totals.promoCode || null,
        totalAmount: totals.totalAmount,
        orderDate: createdOrder.orderDate,
        status: createdOrder.status,
        items: orderItems,
        vendors: toVendorSummary(orderItems).map((v) => ({
          vendorId: v.vendorId,
          vendorName: 'Unknown Vendor',
          totalAmount: v.total,
          totalQuantity: v.quantity,
          items: v.items,
        })),
        payment: null,
      },
      paymentSession: {
        sessionId: providerSession._id,
        orderId: providerSession?.paymentParams?.order || `ORDER-${createdOrder._id}`,
        amount: providerSession?.paymentParams?.amount || totals.totalAmount,
        sessionUrl: providerSession?.sessionUrl,
      },
    };
  } catch (error) {
    await rollbackDraftOrder(draftOrderId);
    throw mapTransactionError(error, "createOrder");
  }
};

const createCashOrder = async (userId, sessionId) => {
  if (sessionId) {
    await cartService.mergeGuestCart(userId, sessionId);
  }
  let draftOrderId = null;
  try {
    const [cart, user] = await Promise.all([
      Cart.findOne({ userId }).populate("items.productId"),
      User.findById(userId).select("email"),
    ]);
    if (!cart || !cart.items?.length) throw OrderErrors.CartNotFoundOrEmpty;

    const orderItems = buildOrderItemsFromCart(cart);
    const totals = computeTotalsFromCart(cart, orderItems);

    const order = await Order.create([
      {
        userId,
        totalAmount: totals.totalAmount,
        subtotal: totals.subtotal,
        discountAmount: totals.discountAmount,
        shippingFee: totals.shippingFee,
        promoCode: totals.promoCode,
        orderDate: new Date(),
        status: "pending",
        items: orderItems,
        paymentMethod: "cash_on_delivery",
        guestEmail: user?.email || undefined,
      },
    ]);
    const createdOrder = order[0];
    draftOrderId = createdOrder._id;

    const payment = await Payment.create([
      {
        orderId: createdOrder._id,
        totalAmount: totals.totalAmount,
        paymentMethod: "cash_on_delivery",
        paymentStatus: "pending",
        paidBy: { userId, email: user?.email },
      },
    ]);

    createdOrder.paymentId = payment[0]._id;
    const shippingDocsCash = buildShippingDocsForOrder(createdOrder._id, orderItems);
    if (shippingDocsCash.length) await Shipping.insertMany(shippingDocsCash);

    await createdOrder.save();

    // For cash orders, remove cart items immediately.
    await cart.clear();

    draftOrderId = null;

    return getOrderById(createdOrder._id);
  } catch (error) {
    await rollbackDraftOrder(draftOrderId);
    throw mapTransactionError(error, "createCashOrder");
  }
};

const checkout = async (userId, sessionId) => {
  if (sessionId) {
    await cartService.mergeGuestCart(userId, sessionId);
  }
  let draftOrderId = null;
  try {
    const [cart, user] = await Promise.all([
      Cart.findOne({ userId }).populate("items.productId"),
      User.findById(userId).select("email"),
    ]);
    if (!cart || !cart.items?.length) throw OrderErrors.CartNotFoundOrEmpty;

    const orderItems = buildOrderItemsFromCart(cart);
    const totals = computeTotalsFromCart(cart, orderItems);

    const order = await Order.create([
      {
        userId,
        totalAmount: totals.totalAmount,
        subtotal: totals.subtotal,
        discountAmount: totals.discountAmount,
        shippingFee: totals.shippingFee,
        promoCode: totals.promoCode,
        orderDate: new Date(),
        status: "pending",
        items: orderItems,
        paymentMethod: "credit_card",
        guestEmail: user?.email || undefined,
      },
    ]);

    const createdOrder = order[0];
    draftOrderId = createdOrder._id;

    const payment = await Payment.create([
      {
        orderId: createdOrder._id,
        totalAmount: totals.totalAmount,
        paymentMethod: "credit_card",
        paymentStatus: "completed",
        paidBy: { userId, email: user?.email },
      },
    ]);
    createdOrder.paymentId = payment[0]._id;
    await createdOrder.save();

    await cart.clear();

    draftOrderId = null;

    return getOrderById(createdOrder._id);
  } catch (error) {
    await rollbackDraftOrder(draftOrderId);
    throw mapTransactionError(error, "checkout");
  }
};

const cancelOrder = async (orderId, currentUserId, isAdmin) => {
  const order = await Order.findById(orderId);
  if (!order) throw OrderErrors.OrderNotFound;

  if (!isAdmin && String(order.userId) !== String(currentUserId)) throw OrderErrors.AccessDenied;
  if (order.status === "delivered") throw OrderErrors.OrderAlreadyDelivered;
  if (order.status === "canceled") throw OrderErrors.OrderAlreadyCancelled;

  order.status = "canceled";
  await order.save();

  await Shipping.updateMany({ orderId: order._id }, { $set: { status: "canceled" } });

  const payment = await Payment.findById(order.paymentId);
  if (payment) {
    payment.paymentStatus = payment.paymentStatus === "completed" ? "refunded" : "cancelled";
    await payment.save();
  }

  // Notify customer
  const customer = await User.findById(order.userId).select("email name").lean();
  if (customer?.email) {
    await safeEnqueueOrderEmail({
      to: customer.email,
      subject: `Order #${order._id} update`,
      data: {
        userName: customer.name || "Customer",
        orderId: String(order._id),
        vendorName: "All vendors",
        shippingStatus: "canceled",
        orderStatus: order.status,
        changedAt: new Date().toLocaleString(),
      },
    });
  }
};

const updateShipmentStatus = async (orderId, vendorId, request) => {
  const allowedStatuses = ["preparing", "outfordelivery", "delivered", "canceled", "returned"];
  if (!allowedStatuses.includes(request.newStatus)) throw OrderErrors.InvalidShippingStatus;

  const shipping = await Shipping.findOne({ orderId, vendorId });
  if (!shipping) throw OrderErrors.ShippingNotFound;

  const previousShippingStatus = shipping.status;
  shipping.status = request.newStatus;
  if (request.newStatus === "delivered") shipping.actualDeliveryDate = new Date();
  shipping.statusHistory.push({
    status: request.newStatus,
    note: request.note || "",
    location: request.location || "",
    updatedAt: new Date(),
  });
  await shipping.save();

  const [order, shippings] = await Promise.all([
    Order.findById(orderId),
    Shipping.find({ orderId }),
  ]);
  if (!order) throw OrderErrors.OrderNotFound;
  updateOrderStatusByShippings(order, shippings);
  await order.save();

  // Notify customer only if status actually changed
  if (previousShippingStatus !== request.newStatus) {
    const [customer, vendor] = await Promise.all([
      User.findById(order.userId).select("email name").lean(),
      User.findById(vendorId).select("sellerProfile.storeName name").lean(),
    ]);

    if (customer?.email) {
      await safeEnqueueOrderEmail({
        to: customer.email,
        subject: `Order #${orderId} update`,
        data: {
          userName: customer.name || "Customer",
          orderId: String(orderId),
          vendorName: vendor?.sellerProfile?.storeName || vendor?.name,
          shippingStatus: request.newStatus,
          orderStatus: order.status,
          estimatedDeliveryDate: shipping?.estimatedDeliveryDate
            ? shipping.estimatedDeliveryDate.toLocaleDateString()
            : undefined,
          changedAt: new Date().toLocaleString(),
        },
      });
    }
  }

  return getOrderById(orderId);
};

const handleWebhook = async (payload, signatureHeader) => {
  const { data } = payload || {};
  const isValid = kashierService.isValidWebhookSignature(data, signatureHeader);
  if (!isValid) throw OrderErrors.InvalidWebhookSignature;

  const merchantOrderId = data?.merchantOrderId || "";
  const idPart = merchantOrderId.startsWith("ORDER-") ? merchantOrderId.replace("ORDER-", "") : null;

  const payment = idPart
    ? await Payment.findOne({ orderId: idPart })
    : await Payment.findOne({ gatewayPaymentId: data?._id || data?.sessionId });
  if (!payment) throw OrderErrors.PaymentNotFound;

  const isSuccess = data?.status === "SUCCESS";
  payment.paymentStatus = isSuccess ? "completed" : "failed";
  payment.transactionId = data?.paymentId || data?.referenceId || payment.transactionId;
  await payment.save();

  const orderId = payment.orderId;

  const orderDoc = await Order.findById(orderId);
  if (!orderDoc) return { success: true };

  if (!isSuccess) {
    // Payment failed/canceled:
    // - keep Payment document (status already set to "failed")
    // - delete Order document (it should not appear as a real order)
    // - do NOT create shipping or clear cart.
    await Shipping.deleteMany({ orderId }).catch(() => {});
    await Order.findByIdAndDelete(orderId).catch(() => {});
    return { success: true };
  }


  const existing = await Shipping.findOne({ orderId }).lean().catch(() => null);
  if (!existing) {
    const shippingDocs = buildShippingDocsForOrder(orderDoc._id, orderDoc.items || []);
    if (shippingDocs.length) await Shipping.insertMany(shippingDocs);
  }

  const shippings = await Shipping.find({ orderId }).lean().catch(() => []);
  updateOrderStatusByShippings(orderDoc, shippings);
  await orderDoc.save();

  const cart = await Cart.findOne({ userId: orderDoc.userId });
  if (cart) await cart.clear().catch(() => {});

  return { success: true };
};

const getTopFiveRecentOrders = async (vendorId, count = 5) => {
  const orders = await Order.find({ "items.vendorId": vendorId, status: { $ne: "notpayed" } })
    .sort({ orderDate: -1 })
    .limit(Number(count))
    .populate("userId", "name")
    .lean();

  return orders.map((o) => ({
    id: o._id,
    orderDate: o.orderDate,
    totalAmount: o.totalAmount,
    status: o.status,
    customerName: o.userId?.name || "Unknown",
    items: (o.items || [])
      .filter((item) => String(item.vendorId) === String(vendorId))
      .map((item) => ({
        productName: item.productName,
        quantity: item.quantity,
        price: item.priceAtOrder,
      })),
  }));
};

const getCheckoutPreview = async (userId, sessionId) => {
  if (sessionId) {
    await cartService.mergeGuestCart(userId, sessionId);
  }

  const cart = await Cart.findOne({ userId }).populate("items.productId");
  if (!cart || !cart.items?.length) throw OrderErrors.CartNotFoundOrEmpty;

  const orderItems = buildOrderItemsFromCart(cart);
  const totals = computeTotalsFromCart(cart, orderItems);

  const vendorIds = Array.from(
    new Set(
      (orderItems || [])
        .map((i) => i.vendorId)
        .filter((v) => v && v !== "null")
        .map((v) => String(v))
    )
  );

  const vendors =
    vendorIds.length > 0
      ? await User.find({ _id: { $in: vendorIds } })
          .select("_id name sellerProfile.storeName")
          .lean()
      : [];

  const vendorMap = new Map(vendors.map((v) => [String(v._id), v]));

  const items = orderItems.map((i) => {
    const vendorName =
      (i.vendorId && vendorMap.get(String(i.vendorId))?.sellerProfile?.storeName) ||
      (i.vendorId && vendorMap.get(String(i.vendorId))?.name) ||
      "Unknown Vendor";

    const price = Number(i.priceAtOrder);
    const quantity = Number(i.quantity);

    return {
      vendorId: i.vendorId ? String(i.vendorId) : null,
      vendorName,
      productId: i.productId ? String(i.productId) : '',
      productName: i.productName,
      productImage: i.productImage,
      price,
      quantity,
      lineTotal: price * quantity,
    };
  });

  return {
    subtotal: totals.subtotal,
    discountAmount: totals.discountAmount,
    shippingFee: totals.shippingFee,
    promoCode: totals.promoCode ?? null,
    totalAmount: totals.totalAmount,
    itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
    items,
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
  createOrder,
  createCashOrder,
  checkout,
  cancelOrder,
  updateShipmentStatus,
  handleWebhook,
  getTopFiveRecentOrders,
  getCheckoutPreview,
};
