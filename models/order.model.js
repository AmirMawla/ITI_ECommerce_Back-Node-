const mongoose = require("mongoose");



const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    productName: { type: String, required: true },
    productImage: { type: String },
    priceAtOrder: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },

    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { _id: true }
);

orderItemSchema.virtual("lineTotal").get(function () {
  return this.priceAtOrder * this.quantity;
});

// ─── Shipping address snapshot ────────────────────────────────────────────────
const shippingAddressSchema = new mongoose.Schema(
  {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String,
    phone: String,
  },
  { _id: false }
);

// ─── Order schema ─────────────────────────────────────────────────────────────
const orderSchema = new mongoose.Schema(
  {
    // SQL: Order.UserId (FK → User)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },

    guestEmail: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email"],
    },

    status: {
      type: String,
      enum: {
        values: [
          "notpayed",
          "pending",
          "proccessing",
          "shipped",
          "delivered",
          "canceled",
          "refunded",
        ],
        message: "Invalid order status",
      },
      default: "pending",
    },

    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: [0, "Total amount cannot be negative"],
    },

    subtotal: { type: Number, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    shippingFee: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },

    promoCode: { type: String, trim: true, uppercase: true },

    orderDate: { type: Date, default: Date.now },

    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (arr) => arr.length > 0,
        message: "Order must have at least one item",
      },
    },

    shippingAddress: shippingAddressSchema,

    paymentMethod: {
      type: String,
      enum: ["credit_card", "paypal", "cash_on_delivery", "wallet"],
      required: [true, "Payment method is required"],
    },

    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
    },

    notificationSent: { type: Boolean, default: false },

    statusHistory: [
      {
        status: { type: String },
        changedAt: { type: Date, default: Date.now },
        note: { type: String },
      },
    ],
  },
  {
    timestamps: true, 
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ────────────────────────────────────────────────────────────────
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ "items.vendorId": 1 }); 
orderSchema.index({ paymentId: 1 });


orderSchema.pre("save", function () {
  if (this.isModified("status")) {
    this.statusHistory.push({ status: this.status, changedAt: new Date() });
  }
});

// ─── Virtual: item count ─────────────────────────────────────────────────────
orderSchema.virtual("itemCount").get(function () {
  return this.items.reduce((sum, i) => sum + i.quantity, 0);
});

// ─── Instance method: cancel order ───────────────────────────────────────────
orderSchema.methods.cancel = function (note = "") {
  if (["delivered", "canceled", "refunded"].includes(this.status)) {
    throw new Error(`Cannot cancel an order with status: ${this.status}`);
  }
  this.status = "canceled";
  this.statusHistory.push({ status: "canceled", changedAt: new Date(), note });
  return this.save();
};

module.exports = mongoose.model("Order", orderSchema);
