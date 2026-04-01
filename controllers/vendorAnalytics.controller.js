const vendorAnalyticsService = require("../services/vendorAnalytics.service");

const getVendorId = (req) => req?.user?.userId || req?.user?.id || req?.user?._id;

exports.getStats = async (req, res, next) => {
  try {
    const vendorId = getVendorId(req);
    const data = await vendorAnalyticsService.getVendorStats(vendorId);
    return res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

exports.getRevenueMonthly = async (req, res, next) => {
  try {
    const vendorId = getVendorId(req);
    const months = req.query.months;
    const data = await vendorAnalyticsService.getVendorRevenueMonthly(vendorId, months);
    return res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

exports.getPaymentMethods = async (req, res, next) => {
  try {
    const vendorId = getVendorId(req);
    const data = await vendorAnalyticsService.getVendorPaymentMethods(vendorId);
    return res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

exports.getOrdersByStatus = async (req, res, next) => {
  try {
    const vendorId = getVendorId(req);
    const data = await vendorAnalyticsService.getVendorOrdersByStatus(vendorId);
    return res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

exports.getOrdersDaily = async (req, res, next) => {
  try {
    const vendorId = getVendorId(req);
    const days = req.query.days;
    const data = await vendorAnalyticsService.getVendorOrdersDaily(vendorId, days);
    return res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

exports.getTopProducts = async (req, res, next) => {
  try {
    const vendorId = getVendorId(req);
    const limit = req.query.limit;
    const data = await vendorAnalyticsService.getVendorTopProducts(vendorId, limit);
    return res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

exports.getTopCategories = async (req, res, next) => {
  try {
    const vendorId = getVendorId(req);
    const limit = req.query.limit;
    const data = await vendorAnalyticsService.getVendorTopCategories(vendorId, limit);
    return res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

exports.getRecentOrders = async (req, res, next) => {
  try {
    const vendorId = getVendorId(req);
    const limit = req.query.limit;
    const data = await vendorAnalyticsService.getVendorRecentOrders(vendorId, limit);
    return res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

