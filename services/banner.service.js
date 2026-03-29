const Banner = require('../models/banner.model');
const APIError = require('../Errors/APIError');

exports.getAllBanners = async () => {
    return await Banner.find().sort({ order: 1 });
};

exports.getActiveBanners = async () => {
    return await Banner.find({ isActive: true }).sort({ order: 1 });
};

exports.getBannerById = async (id) => {
    const banner = await Banner.findById(id);
    if (!banner) throw new APIError('Banner not found', 404);
    return banner;
};

exports.createBanner = async (data) => {
    return await Banner.create(data);
};

exports.updateBanner = async (id, data) => {
    const banner = await Banner.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!banner) throw new APIError('Banner not found', 404);
    return banner;
};

exports.deleteBanner = async (id) => {
    const banner = await Banner.findByIdAndDelete(id);
    if (!banner) throw new APIError('Banner not found', 404);
    return banner;
};

exports.toggleBanner = async (id) => {
    const banner = await Banner.findById(id);
    if (!banner) throw new APIError('Banner not found', 404);
    banner.isActive = !banner.isActive;
    return await banner.save();
};