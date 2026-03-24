const User = require('../models/user.model');
const APIError = require('../Errors/APIError');

exports.getAllUsers = async (filter) => {
    return await User.find(filter);
};

exports.getUser = async (id) => {
    const user = await User.findById(id);
    if (!user) throw new APIError("User not found", 404);
    return user;
};

exports.toggleRestriction = async (id) => {
    const user = await User.findById(id);
    if (!user) throw new APIError("User not found", 404);

    user.isRestricted = !user.isRestricted;
    await user.save();
    return user;
};

exports.getPendingSellers = async () => {
    return await User.find({ "sellerProfile.isApproved": false, "sellerProfile.storeName": { $exists: true } });
};

exports.decideSellerApplication = async (id, decision) => {
    const user = await User.findById(id);
    if (!user) throw new APIError("User not found", 404);

    if (decision === 'approve') {
        user.role = 'seller';
        user.sellerProfile.isApproved = true;
    } else {
        user.sellerProfile = undefined; // Reject/Clear application
    }
    await user.save();
    return user;
};