const adminProductService = require('../services/adminProduct.service');
//products
exports.getAllProducts = async (req, res, next) => {
  try {
    const products = await adminProductService.getAllProducts(req.query);
    res.status(200).json({ success: true, count: products.length, data: products });
  } catch (err) { next(err); }
};

exports.getProduct = async (req, res, next) => {
  try {
    const product = await adminProductService.getProductById(req.params.id);
    res.status(200).json({ success: true, data: product });
  } catch (err) { next(err); }
};

exports.createProduct = async (req, res, next) => {
  try {
    const product = await adminProductService.createProduct(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (err) { next(err); }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const product = await adminProductService.updateProduct(req.params.id, req.body);
    res.status(200).json({ success: true, data: product });
  } catch (err) { next(err); }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await adminProductService.deleteProduct(req.params.id);
    res.status(200).json({ success: true, data: product });
  } catch (err) { next(err); }
};

//categories
exports.getAllCategories = async (req, res, next) => {
  try {
    const categories = await adminProductService.getAllCategories();
    res.status(200).json({ success: true, count: categories.length, data: categories });
  } catch (err) { next(err); }
};

exports.getCategory = async (req, res, next) => {
  try {
    const category = await adminProductService.getCategoryById(req.params.id);
    res.status(200).json({ success: true, data: category });
  } catch (err) { next(err); }
};

exports.createCategory = async (req, res, next) => {
  try {
    const category = await adminProductService.createCategory(req.body);
    res.status(201).json({ success: true, data: category });
  } catch (err) { next(err); }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const category = await adminProductService.updateCategory(req.params.id, req.body);
    res.status(200).json({ success: true, data: category });
  } catch (err) { next(err); }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await adminProductService.deleteCategory(req.params.id);
    res.status(200).json({ success: true, data: category });
  } catch (err) { next(err); }
};