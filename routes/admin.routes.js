const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { Authentication } = require('../middlewares/Authentication');
const restrictTo = require('../middlewares/restrictTo');

router.use(Authentication);
router.use(restrictTo(['admin']));

router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUser);
router.patch('/users/:id/restrict', adminController.toggleRestriction);
router.get('/seller-applications', adminController.getPendingSellers);
router.patch('/approve-seller/:id', adminController.decideSellerApplication);

module.exports = router;