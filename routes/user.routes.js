const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { Authentication } = require('../middlewares/Authentication');
const restrictTo = require('../middlewares/restrictTo');

router.use(Authentication);

router.get('/me', userController.getMe);
router.patch('/updateMe', userController.updateMe);
router.delete('/deleteMe', userController.deleteMe);
router.post('/apply-seller', restrictTo(['customer']), userController.applyForSeller);

module.exports = router;