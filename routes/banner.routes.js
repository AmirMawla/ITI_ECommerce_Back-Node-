const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/banner.controller');

// Public route — anyone can see active banners (for homepage)
router.get('/active', bannerController.getActiveBanners);

module.exports = router;