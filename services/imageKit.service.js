const ImageKit = require('imagekit');
const ImageErrors = require('../Errors/ImageErrors');

const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});


const uploadImage = async (fileBuffer, fileName, folder) => {
    try {
        const response = await imagekit.upload({
            file: fileBuffer.toString('base64'),
            fileName: fileName,
            folder: folder,
            useUniqueFileName: true
        });

        return {
            url: response.url,
            fileId: response.fileId,
            thumbnailUrl: response.thumbnailUrl
        };
    } catch (error) {
        console.error('ImageKit upload error:', error);
        throw ImageErrors.UploadFailed;
    }
};


const deleteImage = async (fileId) => {
    try {
        await imagekit.deleteFile(fileId);
    } catch (error) {
        console.error('ImageKit delete error:', error);
        throw ImageErrors.DeleteFailed;
    }
};


const getOptimizedUrl = (url, options = {}) => {
    const transformations = [];

    if (options.width) transformations.push(`w-${options.width}`);
    if (options.height) transformations.push(`h-${options.height}`);
    if (options.quality) transformations.push(`q-${options.quality}`);
    if (options.format) transformations.push(`f-${options.format}`);

    // Add progressive loading for better UX
    transformations.push('pr-true');

    if (transformations.length === 0) return url;

    const transformStr = transformations.join(',');

    const urlParts = url.split('/');
    const accountIdIndex = urlParts.findIndex(part => part.includes('ik.imagekit.io')) + 1;

    if (accountIdIndex > 0 && accountIdIndex < urlParts.length) {
        urlParts.splice(accountIdIndex + 1, 0, `tr:${transformStr}`);
        return urlParts.join('/');
    }

    return url;
};


const getThumbnailUrl = (url) => {
    return getOptimizedUrl(url, { width: 200, height: 200, quality: 80, format: 'auto' });
};

module.exports = {
    uploadImage,
    deleteImage,
    getOptimizedUrl,
    getThumbnailUrl
};
