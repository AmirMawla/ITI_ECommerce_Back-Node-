const User = require('../models/user.model');
const APIError = require('../Errors/APIError');

exports.getMe = async (userId) => {
    const user = await User.findById(userId);
    if (!user) throw new APIError("User not found", 404);
    return user;
};

exports.updateMe = async (userId, updateData) => {
    const forbiddenFields = ['role', 'password', 'isRestricted', 'isActive', 'sellerProfile'];
    forbiddenFields.forEach(field => delete updateData[field]);

    const user = await User.findByIdAndUpdate(userId, updateData, {
        new: true,
        runValidators: true
    });
    return user;
};

exports.deleteMe = async (userId) => {
    const user = await User.findById(userId);
    if (!user) throw new APIError("User not found", 404);

    user.isActive = false; // Soft delete
    await user.save();
    return user;
};

exports.applyForSeller = async (userId, sellerData) => {
    const user = await User.findById(userId);
    if (user.role === 'seller') throw new APIError("Already a seller", 400);

    user.sellerProfile = {
        storeName: sellerData.storeName,
        bio: sellerData.bio,
        isApproved: false
    };
    await user.save();
    return user;
};