const express = require("express");
const router = express.Router();
const vendorAnalyticsController = require("../controllers/vendorAnalytics.controller");

router.get("/stats", vendorAnalyticsController.getStats);
router.get("/stats/revenue-monthly", vendorAnalyticsController.getRevenueMonthly);
router.get("/stats/payment-methods", vendorAnalyticsController.getPaymentMethods);
router.get("/stats/orders-by-status", vendorAnalyticsController.getOrdersByStatus);
router.get("/stats/orders-daily", vendorAnalyticsController.getOrdersDaily);
router.get("/stats/top-products", vendorAnalyticsController.getTopProducts);
router.get("/stats/top-categories", vendorAnalyticsController.getTopCategories);
router.get("/recent-orders", vendorAnalyticsController.getRecentOrders);

module.exports = router;

