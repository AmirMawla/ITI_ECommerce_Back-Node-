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

const addOrder = async (req, res, next) => {
  try {
    const currentUser = getCurrentUser(req);
    const sessionId = req.headers["x-session-id"];
    const data = await orderService.createOrder(currentUser.userId, req.body, sessionId);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const addCashOrder = async (req, res, next) => {
  try {
    const currentUser = getCurrentUser(req);
    const sessionId = req.headers["x-session-id"];
    const data = await orderService.createCashOrder(currentUser.userId, sessionId);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const checkout = async (req, res, next) => {
  try {
    const currentUser = getCurrentUser(req);
    const userId = req.body.userId || currentUser.userId;
    const sessionId = req.headers["x-session-id"];
    const data = await orderService.checkout(userId, sessionId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const cancelOrder = async (req, res, next) => {
  try {
    const currentUser = getCurrentUser(req);
    const isAdmin = currentUser.role === "admin";
    await orderService.cancelOrder(req.params.orderId, currentUser.userId, isAdmin);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const currentUser = getCurrentUser(req);
    const data = await orderService.updateShipmentStatus(req.params.id, currentUser.userId, req.body);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const webhook = async (req, res, next) => {
  try {
    const signature = req.header("x-kashier-signature");
    await orderService.handleWebhook(req.body, signature);
    res.status(200).json({ success: true, message: "Webhook received successfully" });
  } catch (error) {
    next(error);
  }
};

const redirectAfterPayment = async (req, res, next) => {
  try {
    const frontendBase = (process.env.FRONTEND_URL || "").trim();
    if (!frontendBase) return res.status(500).send("FRONTEND_URL is not configured");
    const base = frontendBase.replace(/\/+$/, "");
    return res.redirect(302, `${base}/user-orders`);
  } catch (error) {
    next(error);
  }
};

const getTopFiveRecentVendorOrders = async (req, res, next) => {
  try {
    const currentUser = getCurrentUser(req);
    const count = Number(req.query.count || 5);
    const data = await orderService.getTopFiveRecentOrders(currentUser.userId, count);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getCheckoutPreview = async (req, res, next) => {
  try {
    const currentUser = getCurrentUser(req);
    const sessionId = req.headers["x-session-id"];
    const data = await orderService.getCheckoutPreview(currentUser.userId, sessionId);
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
  addOrder,
  addCashOrder,
  checkout,
  cancelOrder,
  updateOrderStatus,
  webhook,
  redirectAfterPayment,
  getTopFiveRecentVendorOrders,
  getCheckoutPreview,
};
