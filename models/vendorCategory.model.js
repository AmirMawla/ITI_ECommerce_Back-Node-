const mongoose = require("mongoose");


const vendorCategorySchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Vendor is required"],
    },

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },

    isApproved: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

vendorCategorySchema.index({ vendorId: 1, categoryId: 1 }, { unique: true });
vendorCategorySchema.index({ categoryId: 1 });
vendorCategorySchema.index({ vendorId: 1 });

vendorCategorySchema.statics.getCategoriesForVendor = function (vendorId) {
  return this.find({ vendorId, isApproved: true }).populate(
    "categoryId",
    "name slug categoryImageUrl"
  );
};

vendorCategorySchema.statics.getVendorsInCategory = function (categoryId) {
  return this.find({ categoryId, isApproved: true }).populate(
    "vendorId",
    "name sellerProfile"
  );
};

module.exports = mongoose.model("VendorCategory", vendorCategorySchema);
