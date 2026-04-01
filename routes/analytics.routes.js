const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analytics.controller");


router.get("/stats", analyticsController.getStats);
router.get("/stats/revenue-monthly", analyticsController.getRevenueMonthly);
router.get("/stats/payment-methods", analyticsController.getPaymentMethods);
router.get("/stats/orders-by-status", analyticsController.getOrdersByStatus);
router.get("/stats/orders-daily", analyticsController.getOrdersDaily);
router.get("/stats/top-products", analyticsController.getTopProducts);
router.get("/stats/top-categories", analyticsController.getTopCategories);
router.get("/stats/top-sellers", analyticsController.getTopSellers);
router.get("/stats/export", analyticsController.exportStats);

router.get("/recent-orders", analyticsController.getRecentOrders);
router.get("/pending-approvals", analyticsController.getPendingApprovals);

module.exports = router;

