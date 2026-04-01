const reviewService = require('../services/review.service');

exports.addReview = async (req, res, next) => {
    try {
        const review = await reviewService.addReview(req.user.id, req.body);
        res.status(201).json({ success: true, message: "Review added successfully", data: review });
    } catch (err) {
        next(err);
    }
};

exports.getProductReviews = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const reviews = await reviewService.getProductReviews(productId, page, limit);
        res.status(200).json({ success: true, count: reviews.length, data: reviews });
    } catch (err) {
        next(err);
    }
};