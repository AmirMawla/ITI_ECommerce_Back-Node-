const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { Authentication } = require('../middlewares/Authentication');
const restrictTo = require('../middlewares/restrictTo');
const users = require('../schemas/users');
const validate = require('../middlewares/validate');

router.use(Authentication);

router.get('/me', userController.getMe);
router.patch('/updateMe', validate(users.UpdateUserSchema), userController.updateMe);
router.delete('/deleteMe', userController.deleteMe);
router.post('/apply-seller', restrictTo(['customer']), validate(users.applyForSellerSchema), userController.applyForSeller);

module.exports = router;