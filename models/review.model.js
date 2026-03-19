const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    // SQL: Review.UserId (FK → User)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },

    // SQL: Review.ProductId (FK → Product)
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product is required"],
    },

    // SQL: Review.Rating
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },

    // SQL: Review.Comment
    comment: {
      type: String,
      trim: true,
      maxlength: [2000, "Comment cannot exceed 2000 characters"],
    },

    // Review images (bonus)
    images: [{ type: String }],

    // Moderation
    isApproved: { type: Boolean, default: true },
    isReported: { type: Boolean, default: false },

    // Soft delete
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true, // replaces SQL `timestamp`
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Compound index: one review per user per product ─────────────────────────
// This replaces the SQL composite primary key (UserId, ProductId)
reviewSchema.index({ userId: 1, productId: 1 }, { unique: true });
reviewSchema.index({ productId: 1, createdAt: -1 });
reviewSchema.index({ rating: 1 });

// ─── Post-save / post-remove: update product rating cache ────────────────────
async function updateProductRating(doc) {
  if (!doc || !doc.productId) return;
  const Product = mongoose.model("Product");
  const product = await Product.findById(doc.productId);
  if (product) await product.updateRatingCache();
}

reviewSchema.post("save", updateProductRating);
reviewSchema.post("findOneAndDelete", updateProductRating);
reviewSchema.post("findOneAndUpdate", async function (doc) {
  await updateProductRating(doc);
});

module.exports = mongoose.model("Review", reviewSchema);
