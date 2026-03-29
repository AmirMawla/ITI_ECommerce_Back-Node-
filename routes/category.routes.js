const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const { Authentication } = require('../middlewares/Authentication');
const restrictTo = require('../middlewares/restrictTo');

const validate = require('../middlewares/validate');
const createCategorySchema = require('../schemas/categories/createCategorySchema');
const updateCategorySchema = require('../schemas/categories/updateCategorySchema');

router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);

router.use(Authentication);
router.post('/', restrictTo(['admin']), categoryController.createCategory);
router.patch('/:id', restrictTo(['admin']), categoryController.updateCategory);
router.delete('/:id', restrictTo(['admin']), categoryController.deleteCategory);

router.post('/', restrictTo(['admin']), validate(createCategorySchema), categoryController.createCategory);
router.patch('/:id', restrictTo(['admin']), validate(updateCategorySchema), categoryController.updateCategory);

module.exports = router;