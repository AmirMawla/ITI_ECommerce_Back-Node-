const Category = require('../models/category.model');
const APIError = require('../Errors/APIError');

exports.getAllCategories = async () => {
    return await Category.findActive();
};

exports.getCategoryById = async (id) => {
    const category = await Category.findById(id);
    if (!category) throw new APIError('Category not found', 404);
    return category;
};

exports.createCategory = async (categoryData) => {
    const category = await Category.create(categoryData);
    return category;
};

exports.updateCategory = async (id, updateData) => {
    const category = await Category.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true
    });
    if (!category) throw new APIError('Category not found', 404);
    return category;
};

exports.deleteCategory = async (id) => {
    const category = await Category.findById(id);
    if (!category) throw new APIError('Category not found', 404);

    category.deletedAt = new Date(); // Soft delete
    category.isActive = false;
    await category.save();
};