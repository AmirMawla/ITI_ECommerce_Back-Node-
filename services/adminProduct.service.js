const Product = require('../models/product.model');
const Category = require('../models/category.model');

//Products
exports.getAllProducts = (query) => {
  return Product.search(query); 
};

exports.getProductById = (id) => {
  return Product.findById(id).populate('categoryId', 'name slug');
};

exports.createProduct = (data) => {
  return Product.create(data);
};

exports.updateProduct = (id, data) => {
  return Product.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

exports.deleteProduct = async (id) => {
  const product = await Product.findById(id);
  if (!product) throw new Error("Product not found");

  product.name = "deleted-" + product.name;
  product.isActive = false;
  product.deletedAt = new Date();

  return product.save();
};

//Categories
exports.getAllCategories = () => {
  return Category.findActive();
};

exports.getCategoryById = (id) => {
  return Category.findById(id);
};

exports.createCategory = (data) => {
  return Category.create(data);
};

exports.updateCategory = (id, data) => {
  return Category.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

exports.deleteCategory = async (id) => {
  const category = await Category.findById(id);
  if (!category) throw new Error("Category not found");

  category.name = "deleted-" + category.name;
  category.isActive = false;
  category.deletedAt = new Date();

  return category.save();
};