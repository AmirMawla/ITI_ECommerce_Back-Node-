const analyticsService = require("../services/analytics.service");

exports.getStats = async (req, res, next) => {
  try {
    const stats = await analyticsService.getMainStats();
    return res.status(200).json(stats);
  } catch (err) {
    next(err);
  }
};

exports.getRevenueMonthly = async (req, res, next) => {
  try {
    const months = req.query.months;
    const data = await analyticsService.getRevenueMonthly(months);
    return res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

exports.getPaymentMethods = async (req, res, next) => {
  try {
    const data = await analyticsService.getPaymentMethods();
    return res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

exports.getOrdersByStatus = async (req, res, next) => {
  try {
    const data = await analyticsService.getOrdersByStatus();
    return res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

exports.getOrdersDaily = async (req, res, next) => {
  try {
    const days = req.query.days;
    const data = await analyticsService.getOrdersDaily(days);
    return res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

exports.getTopProducts = async (req, res, next) => {
  try {
    const limit = req.query.limit;
    const data = await analyticsService.getTopProducts(limit);
    return res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

exports.getTopCategories = async (req, res, next) => {
  try {
    const limit = req.query.limit;
    const data = await analyticsService.getTopCategories(limit);
    return res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

exports.getTopSellers = async (req, res, next) => {
  try {
    const limit = req.query.limit;
    const data = await analyticsService.getTopSellers(limit);
    return res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

exports.getRecentOrders = async (req, res, next) => {
  try {
    const { limit, sortBy, sortOrder } = req.query;
    const data = await analyticsService.getRecentOrders(limit, sortBy, sortOrder);
    return res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

exports.getPendingApprovals = async (req, res, next) => {
  try {
    const data = await analyticsService.getPendingApprovals();
    return res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

exports.exportStats = async (req, res, next) => {
  try {
    const format = String(req.query.format || "json").toLowerCase();
    const out = await analyticsService.exportStats(format);
    res.setHeader("Content-Type", out.contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${out.filename}"`);
    return res.status(200).send(out.body);
  } catch (err) {
    next(err);
  }
};

