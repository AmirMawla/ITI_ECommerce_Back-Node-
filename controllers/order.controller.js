const orderService = require("../services/order.service");
const UserErrors = require("../Errors/UserErrors");

const getCurrentUser = (req) => {
  if (!req.user) {
    throw UserErrors.UnauthorizedUserAccess;
  }
  return {
    userId: req.user.userId || req.user.id || req.user._id,
    role: req.user.role,
  };
};

const getOrder = async (req, res, next) => {
  try {
    const data = await orderService.getOrderById(req.params.id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getOrderDetailsDividedForVendors = async (req, res, next) => {
  try {
    const currentUser = getCurrentUser(req);
    const currentUserId = currentUser.userId;
    const isAdmin = currentUser.role === "admin";
    const data = await orderService.getOrderDetails(req.params.id, currentUserId, isAdmin);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getSpecificOrder = async (req, res, next) => {
  try {
    const currentUser = getCurrentUser(req);
    const currentUserId = currentUser.userId;
    const isAdmin = currentUser.role === "admin";
    const data = await orderService.getOrderForSpecificVendor(
      req.params.orderId,
      req.params.vendorId,
      currentUserId,
      isAdmin
    );
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getUserOrders = async (req, res, next) => {
  try {
    const currentUser = getCurrentUser(req);
    const data = await orderService.getUserOrders(req.query.userId, {
      ...currentUser,
      page: req.query.page,
      limit: req.query.limit,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getAllOrders = async (req, res, next) => {
  try {
    const data = await orderService.getAllOrders(req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getVendorOrders = async (req, res, next) => {
  try {
    const currentUser = getCurrentUser(req);
    const data = await orderService.getVendorOrders(req.query.vendorId, currentUser, req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getVendorOrder = async (req, res, next) => {
  try {
    const currentUser = getCurrentUser(req);
    const data = await orderService.getVendorOrder(req.params.orderId, currentUser.userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOrder,
  getOrderDetailsDividedForVendors,
  getSpecificOrder,
  getUserOrders,
  getAllOrders,
  getVendorOrders,
  getVendorOrder,
};
