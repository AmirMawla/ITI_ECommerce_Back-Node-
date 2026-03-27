const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product is required"],
    },

    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },

    comment: {
      type: String,
      trim: true,
      maxlength: [2000, "Comment cannot exceed 2000 characters"],
    },

    images: [{ type: String }],

    isApproved: { type: Boolean, default: true },
    isReported: { type: Boolean, default: false },

    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true, 
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

reviewSchema.index({ userId: 1, productId: 1 }, { unique: true });
reviewSchema.index({ productId: 1, createdAt: -1 });
reviewSchema.index({ rating: 1 });

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
