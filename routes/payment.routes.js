const express = require("express");
const validate = require("../middlewares/validate");
const restrictTo = require("../middlewares/restrictTo");
const { Authentication } = require("../middlewares/Authentication");
const paymentController = require("../controllers/payment.controller");
const paymentSchemas = require("../schemas/payment");

const router = express.Router();

router.get(
  "/transactions/count",
  Authentication,
  restrictTo(["admin"]),
  paymentController.getTransactionsCount
);

router.get(
  "/stats",
  Authentication,
  restrictTo(["admin"]),
  paymentController.getPaymentStats
);

router.get(
  "/revenue/by-payment-method",
  Authentication,
  restrictTo(["admin"]),
  paymentController.getAllRevenueByPaymentMethod
);

router.get(
  "/revenue/vendor/by-payment-method",
  Authentication,
  restrictTo(["seller"]),
  paymentController.getVendorRevenueByPaymentMethod
);

router.get(
  "/transactions",
  Authentication,
  restrictTo(["admin"]),
  validate(paymentSchemas.transactionListSchema),
  paymentController.getAllTransactions
);

router.get(
  "/vendor/transactions",
  Authentication,
  restrictTo(["admin", "seller"]),
  validate(paymentSchemas.vendorTransactionsSchema),
  paymentController.getVendorTransactions
);

router.get(
  "/user/transactions",
  Authentication,
  restrictTo(["admin", "customer"]),
  validate(paymentSchemas.userTransactionsSchema),
  paymentController.getUserTransactions
);

module.exports = router;
