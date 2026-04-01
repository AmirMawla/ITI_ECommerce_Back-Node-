const favoriteService = require('../services/favorite.service');

exports.toggleFavorite = async (req, res, next) => {
    try {
        const result = await favoriteService.toggleFavorite(req.user.id, req.body.productId);
        res.status(200).json({ success: true, message: result.message, data: { isFavorited: result.isFavorited } });
    } catch (err) {
        next(err);
    }
};

exports.getMyFavorites = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;

        const favorites = await favoriteService.getMyFavorites(req.user.id, page, limit);
        res.status(200).json({ success: true, count: favorites.length, data: favorites });
    } catch (err) {
        next(err);
    }
};