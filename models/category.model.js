const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      unique: true,
      minlength: [2, "Category name must be at least 2 characters"],
      maxlength: [100, "Category name cannot exceed 100 characters"],
    },

    categoryImageUrl: {
      url: {
        type: String,
        default: null
    },
    fileId: {
        type: String,
        default: null
    }
    },


    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },

    // Slug for SEO-friendly URLs
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },

    isActive: { type: Boolean, default: true },

    // Soft delete
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ────────────────────────────────────────────────────────────────
categorySchema.index({ name: 1 });
categorySchema.index({ slug: 1 });
categorySchema.index({ isActive: 1 });

// ─── Pre-save: auto-generate slug from name ──────────────────────────────────
categorySchema.pre("save", function () {
  if (this.isModified("name")) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");
  }
});

// ─── Virtual: product count (populated when needed) ─────────────────────────
categorySchema.virtual("products", {
  ref: "Product",
  localField: "_id",
  foreignField: "categoryId",
  justOne: false,
});

// ─── Static: find active categories ─────────────────────────────────────────
categorySchema.statics.findActive = function () {
  return this.find({ isActive: true, deletedAt: null });
};

module.exports = mongoose.model("Category", categorySchema);
