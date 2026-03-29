const sellerService = require('../services/seller.service');

//Profile
exports.getProfile = async (req, res, next) => {
    try {
        const profile = await sellerService.getProfile(req.user.id);
        res.status(200).json({ success: true, data: profile });
    } catch (err) { next(err); }
};

exports.updateProfile = async (req, res, next) => {
    try {
        const profile = await sellerService.updateProfile(req.user.id, req.body);
        res.status(200).json({ success: true, data: profile });
    } catch (err) { next(err); }
};

exports.closeStore = async (req, res, next) => {
    try {
        const result = await sellerService.closeStore(req.user.id);
        res.status(200).json({ success: true, message: result.message });
    } catch (err) { next(err); }
};

// Products
exports.getMyProducts = async (req, res, next) => {
    try {
        const products = await sellerService.getMyProducts(req.user.id);
        res.status(200).json({ success: true, count: products.length, data: products });
    } catch (err) { next(err); }
};

exports.getMyProductById = async (req, res, next) => {
    try {
        const product = await sellerService.getMyProductById(req.user.id, req.params.id);
        res.status(200).json({ success: true, data: product });
    } catch (err) { next(err); }
};

exports.createProduct = async (req, res, next) => {
    try {
        const product = await sellerService.createProduct(req.user.id, req.body);
        res.status(201).json({ success: true, data: product });
    } catch (err) { next(err); }
};

exports.updateProduct = async (req, res, next) => {
    try {
        const product = await sellerService.updateProduct(req.user.id, req.params.id, req.body);
        res.status(200).json({ success: true, data: product });
    } catch (err) { next(err); }
};

exports.deleteProduct = async (req, res, next) => {
    try {
        await sellerService.deleteProduct(req.user.id, req.params.id);
        res.status(200).json({ success: true, message: 'Product deleted successfully' });
    } catch (err) { next(err); }
};

exports.getLowStockProducts = async (req, res, next) => {
    try {
        const products = await sellerService.getLowStockProducts(req.user.id);
        res.status(200).json({ success: true, count: products.length, data: products });
    } catch (err) { next(err); }
};