const imageKitService = require('../services/imageKit.service');
const User = require('../models/user.model');
const Post = require('../models/post.model');
const ImageErrors = require('../Errors/ImageErrors');
const PostErrors = require('../Errors/PostErrors');
const UserErrors = require('../Errors/UserErrors');

const uploadProfilePicture = async (req, res, next) => {
    try {
        if (!req.file) {
            throw ImageErrors.NoFileProvided;
        }

        const { userId } = req.user;
        const user = await User.findById(userId);

        if (!user) {
            throw UserErrors.UserNotFound;
        }

        if (user.profilePicture && user.profilePicture.fileId) {
            try {
                await imageKitService.deleteImage(user.profilePicture.fileId);
            } catch (err) {
                console.log('Failed to delete old profile picture:', err.message);
            }
        }

        const result = await imageKitService.uploadImage(
            req.file.buffer,
            req.file.originalname,
            'profile-pictures'
        );

        user.profilePicture = {
            url: result.url,
            fileId: result.fileId
        };
        await user.save();

        res.status(200).json({
            message: 'Profile picture uploaded successfully',
            data: {
                profilePicture: {
                    url: result.url,
                    thumbnailUrl: imageKitService.getThumbnailUrl(result.url)
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

const deleteProfilePicture = async (req, res, next) => {
    try {
        const { userId } = req.user;
        const user = await User.findById(userId);

        if (!user) {
            throw UserErrors.UserNotFound;
        }

        if (!user.profilePicture || !user.profilePicture.fileId) {
            throw ImageErrors.ImageNotFound;
        }

        await imageKitService.deleteImage(user.profilePicture.fileId);

        user.profilePicture = null;
        await user.save();

        res.status(200).json({
            message: 'Profile picture deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};



module.exports = {
    uploadProfilePicture,
    deleteProfilePicture
};
