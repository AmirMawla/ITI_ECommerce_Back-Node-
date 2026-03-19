const APIError = require('./APIError');

class ImageErrors {
    static InvalidFileType = new APIError('Invalid file type. Only JPG, PNG, and WebP images are allowed.', 400);

    static FileTooLarge = new APIError('File size exceeds the maximum allowed limit.', 400);

    static TooManyFiles = new APIError('Too many files. Maximum 5 images allowed.', 400);

    static UploadFailed = new APIError('Failed to upload image. Please try again.', 500);

    static DeleteFailed = new APIError('Failed to delete image. Please try again.', 500);

    static ImageNotFound = new APIError('Image not found.', 404);

    static NoFileProvided = new APIError('No image file provided.', 400);
}

module.exports = ImageErrors;
