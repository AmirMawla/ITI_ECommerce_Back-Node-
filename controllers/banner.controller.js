const bannerService = require('../services/banner.service');

exports.getAllBanners = async (req, res, next) => {
    try {
        const banners = await bannerService.getAllBanners();
        res.status(200).json({ success: true, count: banners.length, data: banners });
    } catch (err) { next(err); }
};

exports.getActiveBanners = async (req, res, next) => {
    try {
        const banners = await bannerService.getActiveBanners();
        res.status(200).json({ success: true, count: banners.length, data: banners });
    } catch (err) { next(err); }
};

exports.getBanner = async (req, res, next) => {
    try {
        const banner = await bannerService.getBannerById(req.params.id);
        res.status(200).json({ success: true, data: banner });
    } catch (err) { next(err); }
};

exports.createBanner = async (req, res, next) => {
    try {
        const banner = await bannerService.createBanner(req.body);
        res.status(201).json({ success: true, data: banner });
    } catch (err) { next(err); }
};

exports.updateBanner = async (req, res, next) => {
    try {
        const banner = await bannerService.updateBanner(req.params.id, req.body);
        res.status(200).json({ success: true, data: banner });
    } catch (err) { next(err); }
};

exports.deleteBanner = async (req, res, next) => {
    try {
        await bannerService.deleteBanner(req.params.id);
        res.status(204).send();
    } catch (err) { next(err); }
};

exports.toggleBanner = async (req, res, next) => {
    try {
        const banner = await bannerService.toggleBanner(req.params.id);
        res.status(200).json({ success: true, data: banner });
    } catch (err) { next(err); }
};