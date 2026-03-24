const adminService = require('../services/admin.service');

exports.getAllUsers = async (req, res, next) => {
    try {
        const users = await adminService.getAllUsers(req.query);
        res.status(200).json({ success: true, count: users.length, data: users });
    } catch (err) { next(err); }
};

exports.getUser = async (req, res, next) => {
    try {
        const user = await adminService.getUser(req.params.id);
        res.status(200).json({ success: true, data: user });
    } catch (err) { next(err); }
};

exports.toggleRestriction = async (req, res, next) => {
    try {
        const user = await adminService.toggleRestriction(req.params.id);
        res.status(200).json({ success: true, data: user });
    } catch (err) { next(err); }
};

exports.getPendingSellers = async (req, res, next) => {
    try {
        const pending = await adminService.getPendingSellers();
        res.status(200).json({ success: true, data: pending });
    } catch (err) { next(err); }
};

exports.decideSellerApplication = async (req, res, next) => {
    try {
        const { decision } = req.body; // 'approve' or 'reject'
        const user = await adminService.decideSellerApplication(req.params.id, decision);
        res.status(200).json({ success: true, data: user });
    } catch (err) { next(err); }
};