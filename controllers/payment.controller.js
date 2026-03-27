const paymentService = require("../services/payment.service");
const UserErrors = require("../Errors/UserErrors");
const OrderErrors = require("../Errors/OrderErrors");
const PaymentErrors = require("../Errors/PaymentErrors");

const getCurrentUser = (req) => {
  if (!req.user) throw UserErrors.UnauthorizedUserAccess;
  return {
    userId: req.user.userId || req.user.id || req.user._id,
    role: req.user.role,
  };
};

const getAllTransactions = async (req, res, next) => {
  try {
    const data = await paymentService.getAllTransactions(req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getVendorTransactions = async (req, res, next) => {
  try {
    const current = getCurrentUser(req);
    let vendorId = req.query.vendorId;

    if (current.role === "seller") {
      if (vendorId && String(vendorId) !== String(current.userId)) throw OrderErrors.AccessDenied;
      vendorId = current.userId;
    } else if (current.role === "admin") {
      if (!vendorId) throw PaymentErrors.VendorIdRequiredForAdmin;
    }

    const data = await paymentService.getVendorTransactions(req.query, vendorId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getUserTransactions = async (req, res, next) => {
  try {
    const current = getCurrentUser(req);
    let userId = req.query.userId;

    if (current.role === "customer") {
      if (userId && String(userId) !== String(current.userId)) throw OrderErrors.AccessDenied;
      userId = current.userId;
    } else if (current.role === "admin") {
      if (!userId) throw PaymentErrors.UserIdRequiredForAdmin;
    }

    const data = await paymentService.getUserTransactions(userId, req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getTransactionsCount = async (req, res, next) => {
  try {
    const count = await paymentService.getTotalTransactionsCount();
    res.status(200).json({ success: true, data: { count } });
  } catch (error) {
    next(error);
  }
};

const getPaymentStats = async (req, res, next) => {
  try {
    const data = await paymentService.getPaymentStats();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getAllRevenueByPaymentMethod = async (req, res, next) => {
  try {
    const data = await paymentService.getAllRevenueByPaymentMethod();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getVendorRevenueByPaymentMethod = async (req, res, next) => {
  try {
    const current = getCurrentUser(req);
    const vendorId = current.userId;
    const data = await paymentService.getVendorRevenueByPaymentMethod(vendorId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllTransactions,
  getVendorTransactions,
  getUserTransactions,
  getTransactionsCount,
  getPaymentStats,
  getAllRevenueByPaymentMethod,
  getVendorRevenueByPaymentMethod,
};
