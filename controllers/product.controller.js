const productService = require('../services/product.service');

exports.getAllProducts = async (req, res, next) => {
    try {
        const products = await productService.getAllProducts(req.query);
        res.status(200).json({ success: true, data: products });
    } catch (err) { next(err); }
};

exports.getProductById = async (req, res, next) => {
    try {
        const product = await productService.getProductById(req.params.id);
        res.status(200).json({ success: true, data: product });
    } catch (err) { next(err); }
};

exports.createProduct = async (req, res, next) => {
    try {
        const product = await productService.createProduct(req.body, req.user.id);
        res.status(201).json({ success: true, data: product });
    } catch (err) { next(err); }
};

exports.updateProduct = async (req, res, next) => {
    try {
        const product = await productService.updateProduct(req.params.id, req.body, req.user.id);
        res.status(200).json({ success: true, data: product });
    } catch (err) { next(err); }
};

exports.deleteProduct = async (req, res, next) => {
    try {
        await productService.deleteProduct(req.params.id, req.user.id);
        res.status(204).json({ success: true, data: null });
    } catch (err) { next(err); }
};

