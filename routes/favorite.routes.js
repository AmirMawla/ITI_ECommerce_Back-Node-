const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favorite.controller');
const { Authentication } = require('../middlewares/Authentication');
const validate = require('../middlewares/validate');
const favoritesSchema = require('../schemas/favourits/toggleFavourit');

router.use(Authentication);

router.get('/', favoriteController.getMyFavorites);
router.post('/toggle', validate({ body: favoritesSchema.toggleFavoriteSchema }), favoriteController.toggleFavorite);

module.exports = router;