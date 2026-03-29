const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: [true, "Order is required"],
      unique: true, 
    },

    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: [0, "Amount cannot be negative"],
    },

    date: { type: Date, default: Date.now },

    paymentMethod: {
      type: String,
      required: [true, "Payment method is required"],
      enum: {
        values: ["credit_card", "paypal", "cash_on_delivery", "wallet"],
        message: "Invalid payment method",
      },
    },

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

    refundedAmount: { type: Number, default: 0, min: 0 },
    refundedAt: { type: Date },
    refundReason: { type: String, trim: true },

    savedPaymentMethodId: { type: String },


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
// orderId: unique index comes from field definition above (avoid duplicate index)
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
