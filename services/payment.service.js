const mongoose = require("mongoose");
const Payment = require("../models/payment.model");
const Order = require("../models/order.model");
const User = require("../models/user.model");
const PaymentErrors = require("../Errors/PaymentErrors");

const PAYMENT_STATUSES = ["pending", "completed", "failed", "refunded", "cancelled"];
const PAYMENT_METHODS = ["credit_card", "paypal", "cash_on_delivery", "wallet"];

const normalizeList = (v) => {
  if (!v) return null;
  if (Array.isArray(v)) return v.map(String);
  return String(v)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
};

const getTransactionDate = (p) => p.date || p.createdAt || new Date();

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

const dayRangeUtc = (dateInput) => {
  const d = new Date(dateInput);
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));
  const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
  return { start, end };
};

const toTransactionResponse = (p, order) => {
  const user = order?.userId;
  const name = user?.name || "Unknown";
  const orderId = p.orderId?._id || p.orderId;
  return {
    id: p._id,
    totalAmount: p.totalAmount,
    transactionDate: getTransactionDate(p),
    status: p.paymentStatus,
    paymentMethod: p.paymentMethod,
    orderId,
    customerName: name,
  };
};

const sortPayments = (items, sortBy, sortOrder) => {
  const dir = sortOrder === "asc" ? 1 : -1;
  const key = sortBy === "transactionDate" ? "tx" : sortBy;
  return [...items].sort((a, b) => {
    let va;
    let vb;
    if (key === "tx") {
      va = getTransactionDate(a.payment).getTime();
      vb = getTransactionDate(b.payment).getTime();
    } else if (key === "orderId") {
      va = String(a.payment.orderId);
      vb = String(b.payment.orderId);
      return dir * va.localeCompare(vb);
    } else {
      va = a.payment[key];
      vb = b.payment[key];
    }
    if (va < vb) return -1 * dir;
    if (va > vb) return 1 * dir;
    return 0;
  });
};


const getAllTransactions = async (request = {}) => {
  const page = Number(request.page || 1);
  const limit = Number(request.limit || 10);
  const statuses = normalizeList(request.statuses);
  const paymentMethods = normalizeList(request.paymentMethods);

  const filter = {};
  if (statuses?.length) {
    const valid = statuses.filter((s) => PAYMENT_STATUSES.includes(s));
    if (valid.length) filter.paymentStatus = { $in: valid };
  }
  if (paymentMethods?.length) {
    const valid = paymentMethods.filter((m) => PAYMENT_METHODS.includes(m));
    if (valid.length) filter.paymentMethod = { $in: valid };
  }
  if (request.date) {
    const { start, end } = dayRangeUtc(request.date);
    filter.$or = [
      { date: { $gte: start, $lte: end } },
      { createdAt: { $gte: start, $lte: end } },
    ];
  }

  let payments = await Payment.find(filter)
    .populate({
      path: "orderId",
      select: "userId",
      populate: { path: "userId", select: "name email" },
    })
    .lean();

  if (request.search) {
    const q = String(request.search).trim();
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const idOk = mongoose.Types.ObjectId.isValid(q);
    payments = payments.filter((p) => {
      const order = p.orderId;
      const name = order?.userId?.name || "";
      const matchName = rx.test(name);
      const matchOrder = idOk && String(p.orderId?._id || p.orderId) === q;
      const matchPayId = idOk && String(p._id) === q;
      return matchName || matchOrder || matchPayId;
    });
  }

  if (!payments.length) throw PaymentErrors.NoTransactionsFound;

  const rows = payments.map((p) => ({
    payment: p,
    order: p.orderId,
  }));

  const sortBy = request.sortBy || "transactionDate";
  const sortOrder = request.sortOrder || "desc";
  const sorted = sortPayments(rows, sortBy, sortOrder);

  const mapped = sorted.map(({ payment, order }) => toTransactionResponse(payment, order));
  return paginate(mapped, page, limit);
};


const getVendorTransactions = async (request = {}, vendorId) => {
  const page = Number(request.page || 1);
  const limit = Number(request.limit || 10);
  const statuses = normalizeList(request.statuses);
  const paymentMethods = normalizeList(request.paymentMethods);

  const orders = await Order.find({
    "items.vendorId": new mongoose.Types.ObjectId(vendorId),
  }).lean();
  const orderIds = orders.map((o) => o._id);
  if (!orderIds.length) throw PaymentErrors.NoTransactionsFound;

  const orderMap = new Map(orders.map((o) => [String(o._id), o]));

  const filter = { orderId: { $in: orderIds } };
  if (statuses?.length) {
    const valid = statuses.filter((s) => PAYMENT_STATUSES.includes(s));
    if (valid.length) filter.paymentStatus = { $in: valid };
  }
  if (paymentMethods?.length) {
    const valid = paymentMethods.filter((m) => PAYMENT_METHODS.includes(m));
    if (valid.length) filter.paymentMethod = { $in: valid };
  }
  if (request.date) {
    const { start, end } = dayRangeUtc(request.date);
    filter.$or = [
      { date: { $gte: start, $lte: end } },
      { createdAt: { $gte: start, $lte: end } },
    ];
  }

  let payments = await Payment.find(filter).lean();

  const userIdsForOrders = [...new Set(orders.map((o) => String(o.userId)))];
  const users = await User.find({ _id: { $in: userIdsForOrders } }).select("name email").lean();
  const userMap = new Map(users.map((u) => [String(u._id), u]));

  if (request.search) {
    const q = String(request.search).trim();
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const idOk = mongoose.Types.ObjectId.isValid(q);
    payments = payments.filter((p) => {
      const order = orderMap.get(String(p.orderId));
      const name = userMap.get(String(order?.userId))?.name || "";
      const matchName = rx.test(name);
      const matchOrder = idOk && String(p.orderId) === q;
      return matchName || matchOrder;
    });
  }

  if (!payments.length) throw PaymentErrors.NoTransactionsFound;

  const rows = payments.map((p) => {
    const order = orderMap.get(String(p.orderId));
    const user = userMap.get(String(order?.userId));
    const vendorItems = (order?.items || []).filter((i) => String(i.vendorId) === String(vendorId));
    const vendorAmount = vendorItems.reduce((s, i) => s + Number(i.priceAtOrder) * Number(i.quantity), 0);
    return {
      payment: p,
      order,
      user,
      vendorItems,
      vendorAmount,
    };
  });

  const sortBy = request.sortBy || "transactionDate";
  const sortOrder = request.sortOrder || "desc";
  const sorted = sortPayments(
    rows.map((r) => ({ payment: r.payment, order: r.order })),
    sortBy,
    sortOrder
  );
  const orderByPayId = new Map(rows.map((r) => [String(r.payment._id), r]));

  const mapped = sorted.map(({ payment }) => {
    const r = orderByPayId.get(String(payment._id));
    const u = r.user;
    return {
      orderId: payment.orderId,
      customerName: u?.name || "Unknown",
      customerEmail: u?.email || null,
      vendorAmount: r.vendorAmount,
      paymentMethod: payment.paymentMethod,
      status: payment.paymentStatus,
      transactionDate: getTransactionDate(payment),
      products: r.vendorItems.map((i) => ({
        productId: i.productId,
        nameEn: i.productName,
        nameAr: i.productName,
        price: i.priceAtOrder,
        quantity: i.quantity,
      })),
    };
  });

  return paginate(mapped, page, limit);
};


const getUserTransactions = async (userId, request = {}) => {
  const page = Number(request.page || 1);
  const limit = Number(request.limit || 10);

  const orders = await Order.find({ userId }).select("_id").lean();
  const orderIds = orders.map((o) => o._id);
  if (!orderIds.length) throw PaymentErrors.NoTransactionsFound;

  const payments = await Payment.find({ orderId: { $in: orderIds } })
    .populate({
      path: "orderId",
      select: "userId",
      populate: { path: "userId", select: "name email" },
    })
    .sort({ createdAt: -1 })
    .lean();

  if (!payments.length) throw PaymentErrors.NoTransactionsFound;

  const mapped = payments.map((p) => toTransactionResponse(p, p.orderId));
  return paginate(mapped, page, limit);
};

const getTotalTransactionsCount = async () => Payment.countDocuments();

const getPaymentStats = async () => {
  const [totalTransactions, completedTransactions, pendingTransactions, revenueAgg] = await Promise.all([
    Payment.countDocuments(),
    Payment.countDocuments({ paymentStatus: "completed" }),
    Payment.countDocuments({ paymentStatus: "pending" }),
    Payment.aggregate([
      { $match: { paymentStatus: "completed" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]),
  ]);
  const totalRevenue = revenueAgg[0]?.total || 0;
  return {
    totalTransactions,
    completedTransactions,
    pendingTransactions,
    totalRevenue,
  };
};


const getVendorRevenueByPaymentMethod = async (vendorId) => {
  const orders = await Order.find({
    "items.vendorId": new mongoose.Types.ObjectId(vendorId),
  }).lean();
  if (!orders.length) throw PaymentErrors.NoRevenueData;

  const orderMap = new Map(orders.map((o) => [String(o._id), o]));
  const payments = await Payment.find({
    orderId: { $in: orders.map((o) => o._id) },
    paymentStatus: "completed",
  }).lean();

  const revenueByMethod = new Map();
  for (const p of payments) {
    const order = orderMap.get(String(p.orderId));
    if (!order) continue;
    const vendorRevenue = (order.items || [])
      .filter((i) => String(i.vendorId) === String(vendorId))
      .reduce((s, i) => s + Number(i.priceAtOrder) * Number(i.quantity), 0);
    const key = p.paymentMethod;
    revenueByMethod.set(key, (revenueByMethod.get(key) || 0) + vendorRevenue);
  }

  const predefined = [...PAYMENT_METHODS];
  const result = predefined.map((method) => ({
    paymentMethod: method,
    revenue: revenueByMethod.get(method) || 0,
  })).sort((a, b) => b.revenue - a.revenue);

  if (!result.some((r) => r.revenue > 0)) throw PaymentErrors.NoRevenueData;
  return result;
};


const getAllRevenueByPaymentMethod = async () => {
  const agg = await Payment.aggregate([
    { $match: { paymentStatus: "completed" } },
    { $group: { _id: "$paymentMethod", revenue: { $sum: "$totalAmount" } } },
  ]);

  const revenueDict = new Map(agg.map((x) => [String(x._id).toLowerCase(), x.revenue]));

  const predefined = [...PAYMENT_METHODS];
  const result = predefined.map((method) => ({
    paymentMethod: method,
    revenue: revenueDict.get(method.toLowerCase()) || 0,
  })).sort((a, b) => b.revenue - a.revenue);

  if (!result.some((r) => r.revenue > 0)) throw PaymentErrors.NoRevenueData;
  return result;
};

module.exports = {
  getAllTransactions,
  getVendorTransactions,
  getUserTransactions,
  getTotalTransactionsCount,
  getPaymentStats,
  getVendorRevenueByPaymentMethod,
  getAllRevenueByPaymentMethod,
};
