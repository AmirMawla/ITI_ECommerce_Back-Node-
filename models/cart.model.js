const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product is required"],
    },

    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
      max: [100, "Quantity cannot exceed 100"],
      default: 1,
    },

    priceAtAddTime: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: true,
    timestamps: true,
  }
);

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [false, "User is required"],
      unique: true, // one cart per user
      sparse: true, // allow multiple nulls for guest carts
    },

    sessionId: {
      type: String,
      sparse: true, 
    },


    items: {
      type: [cartItemSchema],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 100,
        message: "Cart cannot contain more than 100 items",
      },
    },


    promoCode: { type: String, trim: true, uppercase: true },
    discountAmount: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true, 
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ────────────────────────────────────────────────────────────────
cartSchema.index({ userId: 1 });
cartSchema.index({ sessionId: 1 }, { sparse: true });

// ─── Virtual: subtotal ───────────────────────────────────────────────────────
cartSchema.virtual("subtotal").get(function () {
  return this.items.reduce(
    (sum, item) => sum + item.priceAtAddTime * item.quantity,
    0
  );
});

// ─── Virtual: total (after discount) ─────────────────────────────────────────
cartSchema.virtual("total").get(function () {
  return Math.max(0, this.subtotal - (this.discountAmount || 0));
});

// ─── Virtual: itemCount ──────────────────────────────────────────────────────
cartSchema.virtual("itemCount").get(function () {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// ─── Instance method: add or increment item ───────────────────────────────────
cartSchema.methods.addItem = function (productId, quantity, price) {
  const existing = this.items.find(
    (i) => i.productId.toString() === productId.toString()
  );
  if (existing) {
    existing.quantity = Math.min(100, existing.quantity + quantity);
  } else {
    this.items.push({ productId, quantity, priceAtAddTime: price });
  }
  return this.save();
};

// ─── Instance method: remove item ────────────────────────────────────────────
cartSchema.methods.removeItem = function (productId) {
  this.items = this.items.filter(
    (i) => i.productId.toString() !== productId.toString()
  );
  return this.save();
};

// ─── Instance method: update quantity ────────────────────────────────────────
cartSchema.methods.updateQuantity = function (productId, quantity) {
  const item = this.items.find(
    (i) => i.productId.toString() === productId.toString()
  );
  if (!item) throw new Error("Item not found in cart");
  if (quantity <= 0) return this.removeItem(productId);
  item.quantity = Math.min(100, quantity);
  return this.save();
};

// ─── Instance method: clear cart (called after order placement) ──────────────
cartSchema.methods.clear = function () {
  this.items = [];
  this.promoCode = undefined;
  this.discountAmount = 0;
  return this.save();
};

module.exports = mongoose.model("Cart", cartSchema);
