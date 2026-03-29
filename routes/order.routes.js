const express = require("express");
const validate = require("../middlewares/validate");
const restrictTo = require("../middlewares/restrictTo");
const { Authentication } = require("../middlewares/Authentication");
const orderController = require("../controllers/order.controller");
const orderSchemas = require("../schemas/orders");

const router = express.Router();


router.get(
  "/users",
  Authentication,
  restrictTo(["admin", "customer"]),
  validate(orderSchemas.getUserOrdersSchema),
  orderController.getUserOrders
);

router.get(
  "/all-orders",
  Authentication,
  restrictTo(["admin"]),
  validate(orderSchemas.getAllOrdersSchema),
  orderController.getAllOrders
);

router.get(
  "/vendors",
  Authentication,
  restrictTo(["admin", "seller"]),
  validate(orderSchemas.getVendorOrdersSchema),
  orderController.getVendorOrders
);

router.get(
  "/vendors/top-five-recent-orders",
  Authentication,
  restrictTo(["seller"]),
  validate(orderSchemas.topRecentVendorOrdersSchema),
  orderController.getTopFiveRecentVendorOrders
);

router.post(
  "/",
  Authentication,
  restrictTo(["customer"]),
  validate(orderSchemas.addOrderSchema),
  orderController.addOrder
);

router.post(
  "/cash-payment",
  Authentication,
  restrictTo(["customer"]),
  orderController.addCashOrder
);

router.post(
  "/checkout",
  Authentication,
  restrictTo(["admin", "customer"]),
  validate(orderSchemas.checkoutSchema),
  orderController.checkout
);

router.post(
  "/:orderId/cancel",
  Authentication,
  restrictTo(["admin", "customer"]),
  validate(orderSchemas.cancelOrderSchema),
  orderController.cancelOrder
);

router.put(
  "/:id/status",
  Authentication,
  restrictTo(["seller","admin"]),
  validate(orderSchemas.updateShipmentStatusSchema),
  orderController.updateOrderStatus
);

router.post(
  "/webhook/kashier",
  orderController.webhook
);


router.get(
  "/:id",
  Authentication,
  restrictTo(["admin", "customer"]),
  validate(orderSchemas.getOrderByIdSchema),
  orderController.getOrder
);


router.get(
  "/details/:id",
  Authentication,
  restrictTo(["admin", "customer"]),
  validate(orderSchemas.getOrderDetailsSchema),
  orderController.getOrderDetailsDividedForVendors
);

router.get(
  "/orders/:orderId/vendors/:vendorId",
  Authentication,
  restrictTo(["admin", "customer"]),
  validate(orderSchemas.getSpecificOrderSchema),
  orderController.getSpecificOrder
);



router.get(
  "/vendor/:orderId",
  Authentication,
  restrictTo(["seller"]),
  validate(orderSchemas.getVendorOrderSchema),
  orderController.getVendorOrder
);

module.exports = router;
