const mongoose = require("mongoose");
const Order = require("../models/order.model");
const Payment = require("../models/payment.model");
const Product = require("../models/product.model");
const Category = require("../models/category.model");

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfMonth(d) {
  const x = new Date(d.getFullYear(), d.getMonth(), 1);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfNextMonth(d) {
  const x = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  x.setHours(0, 0, 0, 0);
  return x;
}

function pctGrowth(current, previous) {
  const prev = Number(previous || 0);
  const cur = Number(current || 0);
  if (prev <= 0) return cur > 0 ? 100 : 0;
  return Math.round(((cur - prev) / prev) * 1000) / 10;
}

const vendorMatchOrders = (vendorId) => ({
  status: { $ne: "notpayed" },
  "items.vendorId": new mongoose.Types.ObjectId(vendorId),
});

async function vendorRevenueBetween(vendorId, from, to) {
  const vid = new mongoose.Types.ObjectId(vendorId);
  const res = await Payment.aggregate([
    { $match: { paymentStatus: "completed", createdAt: { $gte: from, $lt: to } } },
    {
      $lookup: {
        from: "orders",
        localField: "orderId",
        foreignField: "_id",
        as: "o",
      },
    },
    { $unwind: "$o" },
    { $match: { "o.status": { $ne: "notpayed" } } },
    { $unwind: "$o.items" },
    { $match: { "o.items.vendorId": vid } },
    {
      $group: {
        _id: null,
        total: { $sum: { $multiply: ["$o.items.priceAtOrder", "$o.items.quantity"] } },
      },
    },
  ]);
  return Math.round(res[0]?.total || 0);
}

exports.getVendorStats = async (vendorId) => {
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const nextMonthStart = startOfNextMonth(now);
  const prevMonthStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const todayStart = startOfDay(now);
  const tomorrowStart = startOfDay(new Date(now.getTime() + 24 * 60 * 60 * 1000));

  const vid = new mongoose.Types.ObjectId(vendorId);

  const [
    totalRevenue,
    revenueThisMonth,
    revenueLastMonth,
    totalOrders,
    ordersThisMonth,
    ordersLastMonth,
    totalProducts,
    newProductsThisMonth,
    lowStockProducts,
    ordersToday,
    avgOrderValue,
  ] = await Promise.all([
    vendorRevenueBetween(vendorId, new Date(0), now),
    vendorRevenueBetween(vendorId, thisMonthStart, nextMonthStart),
    vendorRevenueBetween(vendorId, prevMonthStart, thisMonthStart),
    Order.countDocuments(vendorMatchOrders(vendorId)),
    Order.countDocuments({ ...vendorMatchOrders(vendorId), createdAt: { $gte: thisMonthStart, $lt: nextMonthStart } }),
    Order.countDocuments({ ...vendorMatchOrders(vendorId), createdAt: { $gte: prevMonthStart, $lt: thisMonthStart } }),
    Product.countDocuments({ vendorId: vid }),
    Product.countDocuments({ vendorId: vid, createdAt: { $gte: thisMonthStart, $lt: nextMonthStart } }),
    Product.countDocuments({ vendorId: vid, stock: { $lte: 5 }, isActive: true, deletedAt: null }),
    Order.countDocuments({ ...vendorMatchOrders(vendorId), createdAt: { $gte: todayStart, $lt: tomorrowStart } }),
    (async () => {
      const res = await Payment.aggregate([
        { $match: { paymentStatus: "completed" } },
        {
          $lookup: {
            from: "orders",
            localField: "orderId",
            foreignField: "_id",
            as: "o",
          },
        },
        { $unwind: "$o" },
        { $match: { "o.status": { $ne: "notpayed" } } },
        { $unwind: "$o.items" },
        { $match: { "o.items.vendorId": vid } },
        {
          $group: {
            _id: "$o._id",
            vendorAmount: { $sum: { $multiply: ["$o.items.priceAtOrder", "$o.items.quantity"] } },
          },
        },
        { $group: { _id: null, avg: { $avg: "$vendorAmount" } } },
      ]);
      return Math.round((res[0]?.avg || 0) * 100) / 100;
    })(),
  ]);

  return {
    totalRevenue,
    revenueLastMonth,
    revenueGrowthPercent: pctGrowth(revenueThisMonth, revenueLastMonth),

    totalOrders,
    ordersLastMonth,
    ordersGrowthPercent: pctGrowth(ordersThisMonth, ordersLastMonth),

    totalProducts,
    newProductsThisMonth,
    productsGrowthPercent: pctGrowth(newProductsThisMonth, 0),

    lowStockProducts,
    ordersToday,

    avgOrderValue,
    aovGrowthPercent: 0,
  };
};

exports.getVendorRevenueMonthly = async (vendorId, months = 6) => {
  const n = Math.max(1, Math.min(24, Number(months) || 6));
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - (n - 1), 1);
  from.setHours(0, 0, 0, 0);

  const vid = new mongoose.Types.ObjectId(vendorId);

  const res = await Payment.aggregate([
    { $match: { paymentStatus: "completed", createdAt: { $gte: from, $lte: now } } },
    {
      $lookup: {
        from: "orders",
        localField: "orderId",
        foreignField: "_id",
        as: "o",
      },
    },
    { $unwind: "$o" },
    { $match: { "o.status": { $ne: "notpayed" } } },
    { $unwind: "$o.items" },
    { $match: { "o.items.vendorId": vid } },
    {
      $group: {
        _id: { y: { $year: "$createdAt" }, m: { $month: "$createdAt" } },
        revenue: { $sum: { $multiply: ["$o.items.priceAtOrder", "$o.items.quantity"] } },
      },
    },
    { $sort: { "_id.y": 1, "_id.m": 1 } },
  ]);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const map = new Map();
  for (const row of res) {
    map.set(`${row._id.y}-${row._id.m}`, Math.round(row.revenue));
  }

  const data = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(from.getFullYear(), from.getMonth() + i, 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    data.push({ month: monthNames[d.getMonth()], year: y, revenue: map.get(`${y}-${m}`) || 0 });
  }
  return { data };
};

exports.getVendorPaymentMethods = async (vendorId) => {
  const vid = new mongoose.Types.ObjectId(vendorId);
  const res = await Payment.aggregate([
    { $match: { paymentStatus: "completed" } },
    {
      $lookup: {
        from: "orders",
        localField: "orderId",
        foreignField: "_id",
        as: "o",
      },
    },
    { $unwind: "$o" },
    { $match: { "o.status": { $ne: "notpayed" } } },
    { $unwind: "$o.items" },
    { $match: { "o.items.vendorId": vid } },
    {
      $group: {
        _id: "$paymentMethod",
        total: { $sum: { $multiply: ["$o.items.priceAtOrder", "$o.items.quantity"] } },
      },
    },
    { $sort: { total: -1 } },
  ]);

  const labelMap = {
    credit_card: "Credit Card",
    paypal: "PayPal",
    wallet: "Wallet",
    cash_on_delivery: "Cash/COD",
    other: "Other",
  };
  const grand = res.reduce((s, r) => s + (r.total || 0), 0) || 0;
  const data = res.map((r) => {
    const method = r._id || "other";
    const total = Math.round(r.total || 0);
    const percentage = grand > 0 ? Math.round((total / grand) * 1000) / 10 : 0;
    return { method, label: labelMap[method] || method, total, percentage };
  });
  return { data };
};

exports.getVendorOrdersByStatus = async (vendorId) => {
  const res = await Order.aggregate([
    { $match: vendorMatchOrders(vendorId) },
    { $group: { _id: "$status", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  return { data: res.map((r) => ({ status: r._id, count: r.count })) };
};

exports.getVendorOrdersDaily = async (vendorId, days = 14) => {
  const n = Math.max(1, Math.min(60, Number(days) || 14));
  const now = new Date();
  const from = startOfDay(new Date(now.getTime() - (n - 1) * 24 * 60 * 60 * 1000));

  const res = await Order.aggregate([
    { $match: { ...vendorMatchOrders(vendorId), createdAt: { $gte: from, $lte: now } } },
    {
      $group: {
        _id: { y: { $year: "$createdAt" }, m: { $month: "$createdAt" }, d: { $dayOfMonth: "$createdAt" } },
        orders: { $sum: 1 },
      },
    },
    { $sort: { "_id.y": 1, "_id.m": 1, "_id.d": 1 } },
  ]);

  const map = new Map();
  for (const row of res) {
    const y = row._id.y;
    const m = String(row._id.m).padStart(2, "0");
    const d = String(row._id.d).padStart(2, "0");
    map.set(`${y}-${m}-${d}`, row.orders);
  }

  const data = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(from.getTime() + i * 24 * 60 * 60 * 1000);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const key = `${y}-${m}-${day}`;
    data.push({ date: key, orders: map.get(key) || 0 });
  }
  return { data };
};

exports.getVendorTopProducts = async (vendorId, limit = 5) => {
  const n = Math.max(1, Math.min(25, Number(limit) || 5));
  const vid = new mongoose.Types.ObjectId(vendorId);

  const res = await Order.aggregate([
    { $match: vendorMatchOrders(vendorId) },
    { $unwind: "$items" },
    { $match: { "items.vendorId": vid } },
    {
      $group: {
        _id: "$items.productId",
        name: { $first: "$items.productName" },
        imageUrl: { $first: "$items.productImage" },
        totalOrders: { $sum: "$items.quantity" },
        totalRevenue: { $sum: { $multiply: ["$items.priceAtOrder", "$items.quantity"] } },
      },
    },
    { $sort: { totalRevenue: -1 } },
    { $limit: n },
  ]);

  const data = res.map((r, idx) => ({
    rank: idx + 1,
    productId: String(r._id),
    name: r.name,
    category: "—",
    imageUrl: r.imageUrl || null,
    totalOrders: r.totalOrders,
    totalRevenue: Math.round(r.totalRevenue || 0),
  }));

  return { data };
};

exports.getVendorTopCategories = async (vendorId, limit = 5) => {
  const n = Math.max(1, Math.min(25, Number(limit) || 5));
  const vid = new mongoose.Types.ObjectId(vendorId);

  const res = await Order.aggregate([
    { $match: vendorMatchOrders(vendorId) },
    { $unwind: "$items" },
    { $match: { "items.vendorId": vid } },
    {
      $lookup: {
        from: "products",
        localField: "items.productId",
        foreignField: "_id",
        as: "p",
      },
    },
    { $unwind: { path: "$p", preserveNullAndEmptyArrays: false } },
    {
      $group: {
        _id: "$p.categoryId",
        totalRevenue: { $sum: { $multiply: ["$items.priceAtOrder", "$items.quantity"] } },
        totalOrders: { $sum: "$items.quantity" },
      },
    },
    { $sort: { totalRevenue: -1 } },
    { $limit: n },
    {
      $lookup: {
        from: "categories",
        localField: "_id",
        foreignField: "_id",
        as: "c",
      },
    },
    { $unwind: { path: "$c", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        name: "$c.name",
        totalRevenue: { $round: ["$totalRevenue", 0] },
        totalOrders: 1,
      },
    },
  ]);

  const data = res.map((r, idx) => ({
    rank: idx + 1,
    categoryId: String(r._id),
    name: r.name || "Unknown",
    totalRevenue: r.totalRevenue,
    totalOrders: r.totalOrders,
  }));

  return { data };
};

exports.getVendorRecentOrders = async (vendorId, limit = 5) => {
  const n = Math.max(1, Math.min(50, Number(limit) || 5));
  const vid = new mongoose.Types.ObjectId(vendorId);

  const orders = await Order.find(vendorMatchOrders(vendorId))
    .sort({ createdAt: -1 })
    .limit(n)
    .populate("userId", "name email")
    .lean();

  const data = orders.map((o) => {
    const vendorItems = (o.items || []).filter((i) => String(i.vendorId) === String(vendorId));
    const vendorAmount = vendorItems.reduce((s, i) => s + Number(i.priceAtOrder) * Number(i.quantity), 0);
    return {
      _id: String(o._id),
      userId: o.userId ? { name: o.userId.name, email: o.userId.email } : null,
      items: vendorItems.slice(0, 3).map((it) => ({ productName: it.productName, quantity: it.quantity })),
      vendorAmount: Math.round(vendorAmount),
      status: o.status,
      createdAt: o.createdAt,
    };
  });

  return { data, pagination: { total: await Order.countDocuments(vendorMatchOrders(vendorId)), page: 1, limit: n } };
};

