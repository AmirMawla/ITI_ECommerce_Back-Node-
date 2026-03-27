const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema(
  {
    discountPercentage: {
      type: Number,
      min: [0, "Discount cannot be negative"],
      max: [100, "Discount cannot exceed 100%"],
    },

    discountAmount: {
      type: Number,
      min: [0, "Discount amount cannot be negative"],
    },

    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },

    discountCode: {
      type: String,
      trim: true,
      uppercase: true,
      unique: true,
      sparse: true, 
    },

    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },

    bannerUrl: {
      type: String,
      trim: true,
    },

    bannerFileId: { type: String, trim: true },

    startDate: { type: Date, default: Date.now },
    endDate: {
      type: Date,
      validate: {
        validator: function (v) {
          return !v || !this.startDate || v > this.startDate;
        },
        message: "End date must be after start date",
      },
    },

    usageLimit: { type: Number, min: 1 }, 
    usedCount: { type: Number, default: 0, min: 0 },

    minimumOrderValue: { type: Number, default: 0, min: 0 },

    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

offerSchema.pre("validate", function () {
  if (
    this.discountPercentage == null &&
    this.discountAmount == null
  ) {
    this.invalidate(
      "discountPercentage",
      "Either discountPercentage or discountAmount is required"
    );
  }
});

// ─── Indexes ────────────────────────────────────────────────────────────────
offerSchema.index({ discountCode: 1 }, { sparse: true });
offerSchema.index({ vendorId: 1 });
offerSchema.index({ productId: 1 });
offerSchema.index({ isActive: 1, startDate: 1, endDate: 1 });

// ─── Virtual: isExpired ──────────────────────────────────────────────────────
offerSchema.virtual("isExpired").get(function () {
  return this.endDate && this.endDate < new Date();
});

// ─── Virtual: isUsable ───────────────────────────────────────────────────────
offerSchema.virtual("isUsable").get(function () {
  if (!this.isActive) return false;
  if (this.isExpired) return false;
  if (this.usageLimit && this.usedCount >= this.usageLimit) return false;
  return true;
});

// ─── Instance method: apply to order amount ───────────────────────────────────
offerSchema.methods.calculateDiscount = function (orderAmount) {
  if (!this.isUsable) return 0;
  if (orderAmount < this.minimumOrderValue) return 0;
  if (this.discountPercentage != null) {
    return (orderAmount * this.discountPercentage) / 100;
  }
  return Math.min(this.discountAmount, orderAmount);
};

// ─── Static: find valid offer by code ────────────────────────────────────────
offerSchema.statics.findValidCode = function (code) {
  const now = new Date();
  return this.findOne({
    discountCode: code.toUpperCase(),
    isActive: true,
    $or: [{ startDate: { $lte: now } }, { startDate: null }],
    $or: [{ endDate: { $gte: now } }, { endDate: null }],
  });
};

module.exports = mongoose.model("Offer", offerSchema);
