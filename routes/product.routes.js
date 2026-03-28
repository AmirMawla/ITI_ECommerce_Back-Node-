const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { Authentication } = require('../middlewares/Authentication');
const restrictTo = require('../middlewares/restrictTo');

router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

router.use(Authentication);

router.post('/', restrictTo(['seller', 'admin']), productController.createProduct);
router.patch('/:id', restrictTo(['seller', 'admin']), productController.updateProduct);
router.delete('/:id', restrictTo(['seller', 'admin']), productController.deleteProduct);

module.exports = router;