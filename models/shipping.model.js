const mongoose = require("mongoose");

const shippingSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: [true, "Order is required"],
      unique: true, 
    },

    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Vendor is required"],
    },

    estimatedDeliveryDate: {
      type: Date,
      validate: {
        validator: (v) => !v || v > new Date(),
        message: "Estimated delivery date must be in the future",
      },
    },

    actualDeliveryDate: { type: Date },

    status: {
      type: String,
      required: [true, "Shipping status is required"],
      enum: {
        values: [
          "not_shipped",
          "preparing",
          "shipped",
          "in_transit",
          "out_for_delivery",
          "delivered",
          "failed_delivery",
          "returned",
        ],
        message: "Invalid shipping status",
      },
      default: "not_shipped",
    },

    carrier: {
      type: String,
      trim: true,
    },

    trackingNumber: {
      type: String,
      trim: true,
    },

    trackingUrl: {
      type: String,
      trim: true,
    },

    shippingAddress: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String,
      phone: String,
    },

    statusHistory: [
      {
        status: { type: String },
        location: { type: String },
        note: { type: String },
        updatedAt: { type: Date, default: Date.now },
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
shippingSchema.index({ orderId: 1 });
shippingSchema.index({ vendorId: 1 });
shippingSchema.index({ trackingNumber: 1 }, { sparse: true });
shippingSchema.index({ status: 1 });

shippingSchema.pre("save", function () {
  if (this.isModified("status")) {
    this.statusHistory.push({ status: this.status, updatedAt: new Date() });
  }
});

// ─── Virtual: isDelivered ────────────────────────────────────────────────────
shippingSchema.virtual("isDelivered").get(function () {
  return this.status === "delivered";
});

// ─── Instance method: update status ──────────────────────────────────────────
shippingSchema.methods.updateStatus = function (status, note, location) {
  this.status = status;
  if (status === "delivered") this.actualDeliveryDate = new Date();
  this.statusHistory.push({ status, note, location, updatedAt: new Date() });
  return this.save();
};

module.exports = mongoose.model("Shipping", shippingSchema);
