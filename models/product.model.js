const mongoose = require("mongoose");

// Each image stored in ImageKit
const productImageSchema = new mongoose.Schema(
  {
    fileId: { type: String, required: true },
    url: { type: String, required: true }
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      minlength: [2, "Product name must be at least 2 characters"],
      maxlength: [200, "Product name cannot exceed 200 characters"],
    },

    description: {
      type: String,
      required: [true, "Product description is required"],
      trim: true,
      maxlength: [5000, "Description cannot exceed 5000 characters"],
    },

    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },

    // SQL schema had ImageUrl — Mongo stores multiple images as array
    images: {
      type: [productImageSchema],
      validate: {
        validator: (arr) => arr.length <= 10,
        message: "A product can have at most 10 images",
      },
    },

    // Convenience getter for the primary image URL (mirrors SQL ImageUrl)
    // Set automatically on save
    imageUrl: {
      type: String,
      trim: true,
    },

    // Stock availability (from project spec)
    stock: {
      type: Number,
      required: [true, "Stock quantity is required"],
      min: [0, "Stock cannot be negative"],
      default: 0,
    },

    // FK → Category (SQL: CategoryId)
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },

    // FK → User/Seller (who listed this product)
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Slug for SEO-friendly URLs & search
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // Computed from reviews — cached for fast sorting/filtering
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },

    // Soft delete
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },

    // Tags for search/filter
    tags: [{ type: String, trim: true, lowercase: true }],
  },
  {
    timestamps: true, // replaces SQL `timestamp`
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ────────────────────────────────────────────────────────────────
productSchema.index({ name: "text", description: "text", tags: "text" }); // full-text search
productSchema.index({ categoryId: 1 });
productSchema.index({ vendorId: 1 });
productSchema.index({ price: 1 });
productSchema.index({ averageRating: -1 });
productSchema.index({ isActive: 1, deletedAt: 1 });
productSchema.index({ slug: 1 });

// ─── Pre-save: auto slug + primary imageUrl ───────────────────────────────────
productSchema.pre("save", function () {
  if (this.isModified("name")) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      + "-" + Date.now();
  }

  if (this.isModified("images") && this.images.length > 0) {
    const primary = this.images.find((i) => i.isPrimary) || this.images[0];
    this.imageUrl = primary.url;
  }
});

// ─── Virtual: inStock ────────────────────────────────────────────────────────
productSchema.virtual("inStock").get(function () {
  return this.stock > 0;
});

// ─── Instance method: update rating cache ────────────────────────────────────
// Call this after a review is added/updated/deleted
productSchema.methods.updateRatingCache = async function () {
  const Review = mongoose.model("Review");
  const stats = await Review.aggregate([
    { $match: { productId: this._id } },
    {
      $group: {
        _id: "$productId",
        avgRating: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);
  this.averageRating = stats[0] ? Math.round(stats[0].avgRating * 10) / 10 : 0;
  this.reviewCount = stats[0] ? stats[0].count : 0;
  return this.save();
};

// ─── Static: search products (name, category, price range) ───────────────────
productSchema.statics.search = function ({
  keyword,
  categoryId,
  minPrice,
  maxPrice,
  vendorId,
  sortBy = "createdAt",
  sortOrder = -1,
  page = 1,
  limit = 20,
} = {}) {
  const filter = { isActive: true, deletedAt: null };

  if (keyword) filter.$text = { $search: keyword };
  if (categoryId) filter.categoryId = categoryId;
  if (vendorId) filter.vendorId = vendorId;
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = minPrice;
    if (maxPrice !== undefined) filter.price.$lte = maxPrice;
  }

  const skip = (page - 1) * limit;
  return this.find(filter)
    .sort({ [sortBy]: sortOrder })
    .skip(skip)
    .limit(limit)
    .populate("categoryId", "name slug")
    .populate("vendorId", "name sellerProfile.storeName");
};

module.exports = mongoose.model("Product", productSchema);
