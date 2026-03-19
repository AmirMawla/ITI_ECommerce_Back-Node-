const mongoose = require("mongoose");

// ─── OrderItem (replaces SQL OrderProduct join table) ────────────────────────
// In MongoDB, order items are embedded — they are immutable snapshots of what
// was purchased. Unlike a FK to Product, we snapshot name/price so the order
// record stays accurate even if the product is later edited or deleted.

const orderItemSchema = new mongoose.Schema(
  {
    // FK → Product (kept for reference/linking)
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    // Snapshot fields (SQL: OrderProduct.Quantity + product data at order time)
    productName: { type: String, required: true },
    productImage: { type: String },
    priceAtOrder: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },

    // Vendor who sold this item
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { _id: true }
);

// Virtual: line total
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

    // Guest order support (project spec)
    guestEmail: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email"],
    },

    // SQL: Order.status
    status: {
      type: String,
      enum: {
        values: [
          "pending",
          "confirmed",
          "processing",
          "shipped",
          "delivered",
          "cancelled",
          "refunded",
        ],
        message: "Invalid order status",
      },
      default: "pending",
    },

    // SQL: Order.totalamount
    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: [0, "Total amount cannot be negative"],
    },

    // Breakdown
    subtotal: { type: Number, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    shippingFee: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },

    // Promo code applied
    promoCode: { type: String, trim: true, uppercase: true },

    // SQL: Order.date
    // → handled by timestamps.createdAt, but kept as orderDate for clarity
    orderDate: { type: Date, default: Date.now },

    // Embedded items (replaces SQL OrderProduct table)
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (arr) => arr.length > 0,
        message: "Order must have at least one item",
      },
    },

    // Shipping address snapshot (so address changes don't affect past orders)
    shippingAddress: shippingAddressSchema,

    // Payment method chosen at checkout
    paymentMethod: {
      type: String,
      enum: ["credit_card", "paypal", "cash_on_delivery", "wallet"],
      required: [true, "Payment method is required"],
    },

    // Reference to Payment document (populated after payment)
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
    },

    // Order notifications (project spec)
    notificationSent: { type: Boolean, default: false },

    // Status history for tracking (project spec: order tracking with status updates)
    statusHistory: [
      {
        status: { type: String },
        changedAt: { type: Date, default: Date.now },
        note: { type: String },
      },
    ],
  },
  {
    timestamps: true, // replaces SQL `date` field
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ────────────────────────────────────────────────────────────────
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ "items.vendorId": 1 }); // seller can query their orders
orderSchema.index({ paymentId: 1 });

// ─── Pre-save: push to status history on status change ───────────────────────
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
  if (["delivered", "cancelled", "refunded"].includes(this.status)) {
    throw new Error(`Cannot cancel an order with status: ${this.status}`);
  }
  this.status = "cancelled";
  this.statusHistory.push({ status: "cancelled", changedAt: new Date(), note });
  return this.save();
};

module.exports = mongoose.model("Order", orderSchema);
