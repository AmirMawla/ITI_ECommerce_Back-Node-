const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const adminProductController = require('../controllers/adminProduct.controller');
const { Authentication } = require('../middlewares/Authentication');
const restrictTo = require('../middlewares/restrictTo');
const bannerController = require('../controllers/banner.controller');
const bannerSchemas = require('../schemas/banner');
const validate = require('../middlewares/validate');


router.use(Authentication);
router.use(restrictTo(['admin']));

//users
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUser);
router.patch('/users/:id/restrict', adminController.toggleRestriction);

//sellers
router.get('/seller-applications', adminController.getPendingSellers);
router.patch('/approve-seller/:id', adminController.decideSellerApplication);

//products
router.get('/products', adminProductController.getAllProducts);
router.get('/products/:id', adminProductController.getProduct);
router.post('/products', adminProductController.createProduct);
router.patch('/products/:id', adminProductController.updateProduct);
router.delete('/products/:id', adminProductController.deleteProduct);

//categories
router.get('/categories', adminProductController.getAllCategories);
router.get('/categories/:id', adminProductController.getCategory);
router.post('/categories', adminProductController.createCategory);
router.patch('/categories/:id', adminProductController.updateCategory);
router.delete('/categories/:id', adminProductController.deleteCategory);

//banners
router.get('/banners', bannerController.getAllBanners);
router.get('/banners/:id', validate(bannerSchemas.getBannerSchema), bannerController.getBanner);
router.post('/banners', validate(bannerSchemas.createBannerSchema), bannerController.createBanner);
router.patch('/banners/:id', validate(bannerSchemas.updateBannerSchema), bannerController.updateBanner);
router.delete('/banners/:id', validate(bannerSchemas.getBannerSchema), bannerController.deleteBanner);
router.patch('/banners/:id/toggle', validate(bannerSchemas.getBannerSchema), bannerController.toggleBanner);

module.exports = router;

