const User = require('../models/user.model');
const Product = require('../models/product.model');
const APIError = require('../Errors/APIError');

//  Profile
exports.getProfile = async (sellerId) => {
    const seller = await User.findById(sellerId);
    if (!seller) throw new APIError('Seller not found', 404);
    return seller.sellerProfile;
};

exports.updateProfile = async (sellerId, data) => {
    const seller = await User.findById(sellerId);
    if (!seller) throw new APIError('Seller not found', 404);

    seller.sellerProfile.storeName = data.storeName || seller.sellerProfile.storeName;
    seller.sellerProfile.bio = data.bio || seller.sellerProfile.bio;
    await seller.save();
    return seller.sellerProfile;
};

//Close Store
exports.closeStore = async (sellerId) => {
    const seller = await User.findById(sellerId);
    if (!seller) throw new APIError('Seller not found', 404);

    seller.role = 'customer';
    seller.sellerProfile.isApproved = false;
    seller.sellerProfile.storeName = undefined;
    seller.sellerProfile.bio = undefined;
    await seller.save();
    return { message: 'Store closed successfully' };
};

// Products
exports.getMyProducts = async (vendorId) => {
    return await Product.find({ vendorId, isActive: true });
};

exports.getMyProductById = async (vendorId, productId) => {
    const product = await Product.findOne({ _id: productId, vendorId });
    if (!product) throw new APIError('Product not found', 404);
    return product;
};

exports.createProduct = async (vendorId, data) => {
    const existingProduct = await Product.findOne({ 
        vendorId, 
        name: data.name,
        isActive: true 
    });
    if (existingProduct) throw new APIError('You already have a product with this name', 400);
    return await Product.create({ ...data, vendorId });
};

exports.updateProduct = async (vendorId, productId, data) => {
    const product = await Product.findOneAndUpdate(
        { _id: productId, vendorId },
        data,
        { new: true, runValidators: true }
    );
    if (!product) throw new APIError('Product not found', 404);
    return product;
};

exports.deleteProduct = async (vendorId, productId) => {
    const product = await Product.findOne({ _id: productId, vendorId });
    if (!product) throw new APIError('Product not found', 404);
    product.isActive = false;
    product.deletedAt = new Date();
    return await product.save();
};

// Low Stock
exports.getLowStockProducts = async (vendorId) => {
    return await Product.find({ vendorId, isActive: true, stock: { $lte: 5 } });
};