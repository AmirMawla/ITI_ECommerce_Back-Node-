const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    // SQL: Payment.OrderId (FK → Order)
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: [true, "Order is required"],
      unique: true, // one payment per order
    },

    // SQL: Payment.TotalAmount
    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: [0, "Amount cannot be negative"],
    },

    // SQL: Payment.Date
    // → createdAt from timestamps, but kept explicit for clarity
    date: { type: Date, default: Date.now },

    // SQL: Payment.PaymentMethod
    paymentMethod: {
      type: String,
      required: [true, "Payment method is required"],
      enum: {
        values: ["credit_card", "paypal", "cash_on_delivery", "wallet"],
        message: "Invalid payment method",
      },
    },

    // SQL: Payment.PaymentStatus
    paymentStatus: {
      type: String,
      required: [true, "Payment status is required"],
      enum: {
        values: ["pending", "completed", "failed", "refunded", "cancelled"],
        message: "Invalid payment status",
      },
      default: "pending",
    },

    // Gateway-specific transaction ID
    transactionId: {
      type: String,
      trim: true,
      sparse: true,
    },

    // Gateway-specific payment intent / charge ID (Stripe)
    gatewayPaymentId: {
      type: String,
      trim: true,
      select: false,
    },

    // Refund info
    refundedAmount: { type: Number, default: 0, min: 0 },
    refundedAt: { type: Date },
    refundReason: { type: String, trim: true },

    // Card saving (bonus feature): reference to saved payment method
    savedPaymentMethodId: { type: String },

    // Payer info snapshot
    paidBy: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      email: { type: String },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ────────────────────────────────────────────────────────────────
paymentSchema.index({ orderId: 1 });
paymentSchema.index({ paymentStatus: 1 });
paymentSchema.index({ transactionId: 1 }, { sparse: true });
paymentSchema.index({ "paidBy.userId": 1 });

// ─── Instance method: mark as completed ──────────────────────────────────────
paymentSchema.methods.complete = function (transactionId, gatewayPaymentId) {
  this.paymentStatus = "completed";
  this.transactionId = transactionId;
  this.gatewayPaymentId = gatewayPaymentId;
  return this.save();
};

// ─── Instance method: refund ──────────────────────────────────────────────────
paymentSchema.methods.refund = function (amount, reason) {
  if (this.paymentStatus !== "completed") {
    throw new Error("Can only refund a completed payment");
  }
  this.paymentStatus = "refunded";
  this.refundedAmount = amount || this.totalAmount;
  this.refundedAt = new Date();
  this.refundReason = reason;
  return this.save();
};

module.exports = mongoose.model("Payment", paymentSchema);
