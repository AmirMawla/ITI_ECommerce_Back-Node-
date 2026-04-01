const Review = require('../models/review.model'); // Assuming this is your review model file
const Product = require('../models/product.model');
const APIError = require('../Errors/APIError');

exports.addReview = async (userId, reviewData) => {
    // Check if product exists
    const productExists = await Product.exists({ _id: reviewData.productId });
    if (!productExists) throw new APIError("Product not found", 404);

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({ userId, productId: reviewData.productId });
    if (existingReview) {
        throw new APIError("You have already reviewed this product", 400);
    }

    const review = await Review.create({
        userId,
        ...reviewData
    });

    return review;
};

exports.getProductReviews = async (productId, page = 1, limit = 10) => {
    const skip = (page - 1) * limit;

    return await Review.find({ productId, isApproved: true, deletedAt: null })
        .populate('userId', 'name profilePicture') // Adjust populated fields based on your User model
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });
};