const Product = require('../models/product.model');
const APIError = require('../Errors/APIError');

exports.getAllProducts = async (query) => {
    const { search, categoryId, minPrice, maxPrice, page = 1, limit = 20 } = query;
    
    return await Product.search({
        keyword: search,
        categoryId,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        page: Number(page),
        limit: Number(limit)
    });
};

exports.getProductById = async (id) => {
    const product = await Product.findById(id)
        .populate('categoryId', 'name slug')
        .populate('vendorId', 'name');
    if (!product) throw new APIError('Product not found', 404);
    return product;
};

exports.createProduct = async (productData, vendorId) => {
    const product = await Product.create({
        ...productData,
        vendorId
    });
    return product;
};

exports.updateProduct = async (id, updateData, userId) => {
    const product = await Product.findById(id);
    if (!product) throw new APIError('Product not found', 404);

    Object.assign(product, updateData);
    await product.save();
    return product;
};

exports.deleteProduct = async (id, userId) => {
    const product = await Product.findById(id);
    if (!product) throw new APIError('Product not found', 404);

    product.deletedAt = new Date(); // Soft delete
    product.isActive = false;
    await product.save();
};