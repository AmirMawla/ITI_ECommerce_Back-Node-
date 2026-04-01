const Joi = require('joi');

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

module.exports = {
    addReviewSchema: Joi.object({
        productId: Joi.string().pattern(objectIdPattern).required().messages({
            'string.pattern.base': 'Invalid Product ID format'
        }),
        rating: Joi.number().min(1).max(5).required(),
        comment: Joi.string().max(2000).allow('', null),
        images: Joi.array().items(Joi.string().uri()).max(5)
    })
};