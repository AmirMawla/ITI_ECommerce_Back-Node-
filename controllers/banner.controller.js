const APIError = require('../Errors/APIError');
const bannerService = require('../services/banner.service');
const imageKitService = require('../services/imageKit.service');

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
        const banner = await bannerService.deleteBanner(req.params.id);
        res.status(200).json({ success: true, message: `Banner ${banner.title} deleted successfully` });
    } catch (err) { next(err); }
};

exports.toggleBanner = async (req, res, next) => {
    try {
        const banner = await bannerService.toggleBanner(req.params.id);
        res.status(200).json({ success: true, data: banner });
    } catch (err) { next(err); }
};

exports.uploadBannerImage = async (req, res, next) => {
    try {
        if (!req.file) {
            return next(new APIError('No file provided', 400));
        }

        const result = await imageKitService.uploadImage(
            req.file.buffer,
            req.file.originalname,
            'banners'
        );

        res.status(200).json({
            success: true,
            data: {
                url: result.url,
                fileId: result.fileId
            }
        });
    } catch (err) {
        next(err);
    }
};