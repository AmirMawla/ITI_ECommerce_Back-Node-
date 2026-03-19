const mongoose = require("mongoose");

// SQL: VendorCategory (VendorId FK, CategoryId FK)
// In MongoDB this can be handled two ways:
//   1. A separate collection (chosen here — mirrors SQL, enables rich queries)
//   2. Embed categoryIds array inside the User/Seller document
//
// We keep a collection because admins need to manage vendor↔category assignments
// and query "all vendors in category X" efficiently.

const vendorCategorySchema = new mongoose.Schema(
  {
    // SQL: VendorCategory.VendorId (FK → User where role=seller)
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Vendor is required"],
    },

    // SQL: VendorCategory.CategoryId (FK → Category)
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },

    // Admin approval for this vendor↔category assignment
    isApproved: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// ─── Compound unique index (replaces SQL composite PK) ───────────────────────
vendorCategorySchema.index({ vendorId: 1, categoryId: 1 }, { unique: true });
vendorCategorySchema.index({ categoryId: 1 });
vendorCategorySchema.index({ vendorId: 1 });

// ─── Static: get all categories for a vendor ─────────────────────────────────
vendorCategorySchema.statics.getCategoriesForVendor = function (vendorId) {
  return this.find({ vendorId, isApproved: true }).populate(
    "categoryId",
    "name slug categoryImageUrl"
  );
};

// ─── Static: get all vendors in a category ───────────────────────────────────
vendorCategorySchema.statics.getVendorsInCategory = function (categoryId) {
  return this.find({ categoryId, isApproved: true }).populate(
    "vendorId",
    "name sellerProfile"
  );
};

module.exports = mongoose.model("VendorCategory", vendorCategorySchema);
