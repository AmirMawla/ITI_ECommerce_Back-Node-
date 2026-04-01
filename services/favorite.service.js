const Favorite = require('../models/favorite.model');
const Product = require('../models/product.model'); // Assuming this is your product model file
const APIError = require('../Errors/APIError');

exports.toggleFavorite = async (userId, productId) => {
    // Verify product exists first
    const productExists = await Product.exists({ _id: productId, isActive: true });
    if (!productExists) throw new APIError("Product not found or inactive", 404);

    const existingFavorite = await Favorite.findOne({ userId, productId });
    
    if (existingFavorite) {
        await existingFavorite.deleteOne();
        return { isFavorited: false, message: "Removed from favorites" };
    }

    await Favorite.create({ userId, productId });
    return { isFavorited: true, message: "Added to favorites" };
};

exports.getMyFavorites = async (userId, page = 1, limit = 20) => {
    const skip = (page - 1) * limit;
    
    const favorites = await Favorite.find({ userId })
        .populate('productId', 'name price imageUrl slug averageRating inStock isActive')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

    // Optional: filter out favorites where the product was deleted
    return favorites.filter(fav => fav.productId && fav.productId.isActive);
};