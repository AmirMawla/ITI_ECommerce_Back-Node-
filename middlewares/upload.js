const multer = require('multer');
const ImageErrors = require('../Errors/ImageErrors');

const storage = multer.memoryStorage();

const imageFileFilter = (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(ImageErrors.InvalidFileType, false);
    }
};

const uploadProfilePicture = multer({
    storage: storage,
    limits: {
        fileSize: 2 * 1024 * 1024, // 2MB
        files: 1
    },
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ['image/jpeg', 'image/png'];

        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(ImageErrors.InvalidFileType, false);
        }
    }
}).single('profilePicture');

    const uploadProductImages = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, 
        files: 5
    },
    fileFilter: imageFileFilter
}).array('productImages', 5);

const handleUpload = (uploadFn) => {
    return (req, res, next) => {
        uploadFn(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return next(ImageErrors.FileTooLarge);
                }
                if (err.code === 'LIMIT_FILE_COUNT') {
                    return next(ImageErrors.TooManyFiles);
                }
                return next(ImageErrors.UploadFailed);
            } else if (err) {
                return next(err);
            }
            next();
        });
    };
};

module.exports = {
    uploadProfilePicture: handleUpload(uploadProfilePicture),
    uploadProductImages: handleUpload(uploadProductImages)
};
