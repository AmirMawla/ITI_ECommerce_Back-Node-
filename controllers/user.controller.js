const userService = require('../services/user.service');

exports.getMe = async (req, res, next) => {
    try {
        const user = await userService.getMe(req.user.id);
        res.status(200).json({ success: true, data: user });
    } catch (err) { next(err); }
};

exports.updateMe = async (req, res, next) => {
    try {
        const user = await userService.updateMe(req.user.id, req.body);
        res.status(200).json({ success: true, data: user });
    } catch (err) { next(err); }
};

exports.deleteMe = async (req, res, next) => {
    try {
        await userService.deleteMe(req.user.id);
        res.status(204).json({ success: true, data: null });
    } catch (err) { next(err); }
};

exports.applyForSeller = async (req, res, next) => {
    try {
        const user = await userService.applyForSeller(req.user.id, req.body);
        res.status(200).json({ success: true, message: "Application submitted", data: user });
    } catch (err) { next(err); }
};