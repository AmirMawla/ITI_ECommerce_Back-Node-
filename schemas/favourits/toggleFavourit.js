const Joi = require('joi');

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

module.exports = {
    toggleFavoriteSchema: Joi.object({
        productId: Joi.string().pattern(objectIdPattern).required().messages({
            'string.pattern.base': 'Invalid Product ID format'
        })
    })
};