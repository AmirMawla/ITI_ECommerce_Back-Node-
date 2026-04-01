const Order = require("../models/order.model");
const Payment = require("../models/payment.model");
const User = require("../models/user.model");
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

async function sumPaymentsBetween(from, to) {
  const match = {
    paymentStatus: "completed",
    createdAt: { $gte: from, $lt: to },
  };
  const res = await Payment.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: "$totalAmount" } } },
  ]);
  return res[0]?.total || 0;
}

async function countOrdersBetween(from, to) {
  return Order.countDocuments({ createdAt: { $gte: from, $lt: to }, status: { $ne: "notpayed" } });
}

async function countUsersBetween(from, to) {
  return User.countDocuments({ createdAt: { $gte: from, $lt: to } });
}

async function countProductsBetween(from, to) {
  return Product.countDocuments({ createdAt: { $gte: from, $lt: to } });
}

exports.getMainStats = async () => {
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const nextMonthStart = startOfNextMonth(now);
  const prevMonthStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1));

  const todayStart = startOfDay(now);
  const tomorrowStart = startOfDay(new Date(now.getTime() + 24 * 60 * 60 * 1000));

  const [
    totalRevenue,
    revenueThisMonth,
    revenueLastMonth,
    totalOrders,
    ordersThisMonth,
    ordersLastMonth,
    totalUsers,
    newUsersToday,
    newUsersThisMonth,
    totalProducts,
    newProductsThisMonth,
    productsLastMonth,
    totalSellers,
    pendingSellerApprovals,
    avgOrderValue,
    cancelledOrders,
    pendingApprovals,
  ] = await Promise.all([
    Payment.aggregate([
      { $match: { paymentStatus: "completed" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]).then((r) => r[0]?.total || 0),
    sumPaymentsBetween(thisMonthStart, nextMonthStart),
    sumPaymentsBetween(prevMonthStart, thisMonthStart),
    Order.countDocuments({ status: { $ne: "notpayed" } }),
    countOrdersBetween(thisMonthStart, nextMonthStart),
    countOrdersBetween(prevMonthStart, thisMonthStart),
    User.countDocuments({}),
    countUsersBetween(todayStart, tomorrowStart),
    countUsersBetween(thisMonthStart, nextMonthStart),
    Product.countDocuments({}),
    countProductsBetween(thisMonthStart, nextMonthStart),
    countProductsBetween(prevMonthStart, thisMonthStart),
    User.countDocuments({ role: "seller" }),
    User.countDocuments({ "sellerProfile.isApproved": false, "sellerProfile.storeName": { $exists: true } }),
    Order.aggregate([
      { $match: { status: { $ne: "notpayed" } } },
      { $group: { _id: null, avg: { $avg: "$totalAmount" } } },
    ]).then((r) => Math.round((r[0]?.avg || 0) * 100) / 100),
    Order.countDocuments({ status: "canceled" }),
    (async () => {
      const sellers = await User.countDocuments({ "sellerProfile.isApproved": false, "sellerProfile.storeName": { $exists: true } });
      const products = await Product.countDocuments({ isActive: false, deletedAt: null });
      return sellers + products;
    })(),
  ]);

  const cancellationRatePercent = totalOrders > 0 ? Math.round((cancelledOrders / totalOrders) * 1000) / 10 : 0;

  return {
    totalRevenue: Math.round(totalRevenue),
    revenueLastMonth: Math.round(revenueLastMonth),
    revenueGrowthPercent: pctGrowth(revenueThisMonth, revenueLastMonth),

    totalOrders,
    ordersLastMonth,
    ordersGrowthPercent: pctGrowth(ordersThisMonth, ordersLastMonth),

    totalUsers,
    newUsersToday,
    newUsersThisMonth,

    totalProducts,
    newProductsThisMonth,
    productsGrowthPercent: pctGrowth(newProductsThisMonth, productsLastMonth),

    totalSellers,
    pendingSellerApprovals,

    avgOrderValue,
    aovGrowthPercent: 0,

    cancelledOrders,
    cancellationRatePercent,

    pendingApprovals,
  };
};

exports.getRevenueMonthly = async (months = 6) => {
  const n = Math.max(1, Math.min(24, Number(months) || 6));
  const now = new Date();

  const from = new Date(now.getFullYear(), now.getMonth() - (n - 1), 1);
  from.setHours(0, 0, 0, 0);

  const res = await Payment.aggregate([
    { $match: { paymentStatus: "completed", createdAt: { $gte: from, $lte: now } } },
    {
      $group: {
        _id: { y: { $year: "$createdAt" }, m: { $month: "$createdAt" } },
        revenue: { $sum: "$totalAmount" },
      },
    },
    { $sort: { "_id.y": 1, "_id.m": 1 } },
  ]);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const map = new Map();
  for (const row of res) {
    const y = row._id.y;
    const m = row._id.m;
    map.set(`${y}-${m}`, Math.round(row.revenue));
  }

  const data = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(from.getFullYear(), from.getMonth() + i, 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    data.push({
      month: monthNames[d.getMonth()],
      year: y,
      revenue: map.get(`${y}-${m}`) || 0,
    });
  }

  return { data };
};

exports.getPaymentMethods = async () => {
  const res = await Payment.aggregate([
    { $match: { paymentStatus: "completed" } },
    { $group: { _id: "$paymentMethod", total: { $sum: "$totalAmount" } } },
    { $sort: { total: -1 } },
  ]);

  const labelMap = {
    credit_card: "Credit Card",
    paypal: "PayPal",
    wallet: "Wallet",
    cash_on_delivery: "Cash/COD",
    other: "Other",
  };

  const grand = res.reduce((sum, r) => sum + (r.total || 0), 0) || 0;
  const data = res.map((r) => {
    const method = r._id || "other";
    const total = Math.round(r.total || 0);
    const percentage = grand > 0 ? Math.round((total / grand) * 1000) / 10 : 0;
    return { method, label: labelMap[method] || method, total, percentage };
  });

  return { data };
};

exports.getOrdersByStatus = async () => {
  const res = await Order.aggregate([
    { $match: { status: { $ne: "notpayed" } } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  return { data: res.map((r) => ({ status: r._id, count: r.count })) };
};

exports.getOrdersDaily = async (days = 14) => {
  const n = Math.max(1, Math.min(60, Number(days) || 14));
  const now = new Date();
  const from = startOfDay(new Date(now.getTime() - (n - 1) * 24 * 60 * 60 * 1000));

  const res = await Order.aggregate([
    { $match: { createdAt: { $gte: from, $lte: now }, status: { $ne: "notpayed" } } },
    {
      $group: {
        _id: {
          y: { $year: "$createdAt" },
          m: { $month: "$createdAt" },
          d: { $dayOfMonth: "$createdAt" },
        },
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

exports.getTopProducts = async (limit = 5) => {
  const n = Math.max(1, Math.min(25, Number(limit) || 5));

  const res = await Order.aggregate([
    { $match: { status: { $ne: "notpayed" } } },
    { $unwind: "$items" },
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
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "p",
      },
    },
    { $unwind: { path: "$p", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "categories",
        localField: "p.categoryId",
        foreignField: "_id",
        as: "c",
      },
    },
    { $unwind: { path: "$c", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        name: 1,
        imageUrl: 1,
        totalOrders: 1,
        totalRevenue: { $round: ["$totalRevenue", 0] },
        category: "$c.name",
      },
    },
  ]);

  const data = res.map((r, idx) => ({
    rank: idx + 1,
    productId: String(r._id),
    name: r.name,
    category: r.category || "Unknown",
    imageUrl: r.imageUrl || r?.p?.imageUrl || null,
    totalOrders: r.totalOrders,
    totalRevenue: r.totalRevenue,
  }));

  return { data };
};

exports.getTopCategories = async (limit = 5) => {
  const n = Math.max(1, Math.min(25, Number(limit) || 5));

  const res = await Order.aggregate([
    { $match: { status: { $ne: "notpayed" } } },
    { $unwind: "$items" },
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

exports.getTopSellers = async (limit = 5) => {
  const n = Math.max(1, Math.min(25, Number(limit) || 5));

  const res = await Order.aggregate([
    { $match: { status: { $ne: "notpayed" } } },
    { $unwind: "$items" },
    { $match: { "items.vendorId": { $ne: null } } },
    {
      $group: {
        _id: "$items.vendorId",
        totalSales: { $sum: "$items.quantity" },
        totalEarnings: { $sum: { $multiply: ["$items.priceAtOrder", "$items.quantity"] } },
      },
    },
    { $sort: { totalEarnings: -1 } },
    { $limit: n },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "u",
      },
    },
    { $unwind: { path: "$u", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        storeName: "$u.sellerProfile.storeName",
        category: { $literal: null },
        totalSales: 1,
        totalEarnings: { $round: ["$totalEarnings", 0] },
      },
    },
  ]);

  const data = res.map((r, idx) => ({
    rank: idx + 1,
    sellerId: String(r._id),
    storeName: r.storeName || "Unknown Seller",
    category: r.category || "—",
    totalSales: r.totalSales,
    totalEarnings: r.totalEarnings,
  }));

  return { data };
};

exports.getRecentOrders = async (limit = 5, sortBy = "createdAt", sortOrder = "desc") => {
  const n = Math.max(1, Math.min(50, Number(limit) || 5));
  const order = sortOrder === "asc" ? 1 : -1;

  const query = Order.find({ status: { $ne: "notpayed" } })
    .sort({ [sortBy]: order })
    .limit(n)
    .populate("userId", "name email");

  const data = await query.lean();
  return {
    data: data.map((o) => ({
      _id: String(o._id),
      userId: o.userId ? { name: o.userId.name, email: o.userId.email } : null,
      items: (o.items || []).slice(0, 3).map((it) => ({ productName: it.productName, quantity: it.quantity })),
      totalAmount: o.totalAmount,
      paymentMethod: o.paymentMethod,
      status: o.status,
      createdAt: o.createdAt,
    })),
    pagination: { total: await Order.countDocuments({ status: { $ne: "notpayed" } }), page: 1, limit: n },
  };
};

exports.getPendingApprovals = async () => {
  const [pendingSellers, pendingProducts] = await Promise.all([
    User.find({ "sellerProfile.isApproved": false, "sellerProfile.storeName": { $exists: true } })
      .select("name sellerProfile.storeName createdAt")
      .lean(),
    Product.find({ isActive: false, deletedAt: null })
      .select("name vendorId createdAt")
      .populate("vendorId", "name sellerProfile.storeName")
      .lean(),
  ]);

  const data = [];
  for (const p of pendingProducts) {
    data.push({
      _id: String(p._id),
      type: "product",
      name: p.name,
      seller: p.vendorId
        ? { _id: String(p.vendorId._id), name: p.vendorId.name, storeName: p.vendorId?.sellerProfile?.storeName }
        : null,
      createdAt: p.createdAt,
    });
  }
  for (const s of pendingSellers) {
    data.push({
      _id: String(s._id),
      type: "seller",
      name: s.name,
      seller: { _id: String(s._id), name: s.name, storeName: s?.sellerProfile?.storeName },
      createdAt: s.createdAt,
    });
  }

  data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return { data, total: data.length };
};

exports.exportStats = async (format = "json") => {
  const stats = await exports.getMainStats();
  const revenueMonthly = await exports.getRevenueMonthly(6);
  const paymentMethods = await exports.getPaymentMethods();
  const ordersByStatus = await exports.getOrdersByStatus();
  const ordersDaily = await exports.getOrdersDaily(14);
  const topProducts = await exports.getTopProducts(5);
  const topCategories = await exports.getTopCategories(5);
  const topSellers = await exports.getTopSellers(5);
  const pendingApprovals = await exports.getPendingApprovals();

  const payload = {
    generatedAt: new Date().toISOString(),
    stats,
    revenueMonthly,
    paymentMethods,
    ordersByStatus,
    ordersDaily,
    topProducts,
    topCategories,
    topSellers,
    pendingApprovals,
  };

  if (format === "csv") {
    const rows = [
      ["metric", "value"],
      ...Object.entries(stats).map(([k, v]) => [k, String(v)]),
    ];
    const csv = rows.map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(",")).join("\n");
    return { contentType: "text/csv; charset=utf-8", filename: "dashboard.csv", body: Buffer.from(csv, "utf8") };
  }

  return { contentType: "application/json; charset=utf-8", filename: "dashboard.json", body: Buffer.from(JSON.stringify(payload, null, 2), "utf8") };
};

