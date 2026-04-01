const express = require('express');
const router = express.Router({ mergeParams: true }); // Important if you nest routes like /products/:productId/reviews
const reviewController = require('../controllers/review.controller');
const { Authentication } = require('../middlewares/Authentication');
const validate = require('../middlewares/validate');
const reviewsSchema = require('../schemas/reviews/addReview');

// Public route to view reviews
router.get('/:productId', reviewController.getProductReviews);

// Protected routes
router.use(Authentication);
router.post('/', validate({ body: reviewsSchema.addReviewSchema }), reviewController.addReview);

module.exports = router;