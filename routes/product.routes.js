const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { Authentication } = require('../middlewares/Authentication');
const restrictTo = require('../middlewares/restrictTo');

const validate = require('../middlewares/validate');
const createProductSchema = require('../schemas/products/createProductSchema');
const updateProductSchema = require('../schemas/products/updateProductSchema');

router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

router.use(Authentication);

router.post('/', restrictTo(['seller', 'admin']), productController.createProduct);
router.patch('/:id', restrictTo(['seller', 'admin']), productController.updateProduct);
router.delete('/:id', restrictTo(['seller', 'admin']), productController.deleteProduct);

router.post('/', restrictTo(['seller', 'admin']), validate(createProductSchema), productController.createProduct);
router.patch('/:id', restrictTo(['seller', 'admin']), validate(updateProductSchema), productController.updateProduct);
module.exports = router;