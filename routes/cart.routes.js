const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const { Authentication } = require('../middlewares/Authentication');
const restrictTo = require('../middlewares/restrictTo');

router.use(Authentication);

router.get('/',restrictTo(['customer']), cartController.getCart);
router.post('/add-item',restrictTo(['customer']), cartController.addItemToCart);
router.patch('/update-quantity',restrictTo(['customer']), cartController.updateCartItemQuantity);
router.delete('/remove-item',restrictTo(['customer']),cartController.removeItemFromCart)
router.post('/merge-guest-cart',restrictTo(['customer']), cartController.mergeGuestCart);
router.get('/reciept',restrictTo(['customer']), cartController.calculateOrderSummary);
router.post('/checkout',restrictTo(['customer']), cartController.checkout);


module.exports = router;