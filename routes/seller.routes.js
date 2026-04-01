const express = require('express');
const router = express.Router();
const sellerController = require('../controllers/seller.controller');
const { Authentication } = require('../middlewares/Authentication');
const restrictTo = require('../middlewares/restrictTo');
const validate = require('../middlewares/validate');
const sellerSchemas = require('../schemas/seller');
const vendorAnalyticsRoutes = require("./vendorAnalytics.routes");

router.use(Authentication);
router.use(restrictTo(['seller']));

// Profile
router.get('/profile', sellerController.getProfile);
router.patch('/profile', validate(sellerSchemas.updateProfileSchema), sellerController.updateProfile);
router.patch('/close-store', sellerController.closeStore);

// Products
router.get('/products', sellerController.getMyProducts);
router.get('/products/low-stock', sellerController.getLowStockProducts);
router.get('/products/:id', validate(sellerSchemas.productIdSchema), sellerController.getMyProductById);
router.post('/products', validate(sellerSchemas.createProductSchema), sellerController.createProduct);
router.patch('/products/:id', validate(sellerSchemas.productIdSchema), validate(sellerSchemas.updateProductSchema), sellerController.updateProduct);
router.delete('/products/:id', validate(sellerSchemas.productIdSchema), sellerController.deleteProduct);

router.use("/", vendorAnalyticsRoutes);

module.exports = router;