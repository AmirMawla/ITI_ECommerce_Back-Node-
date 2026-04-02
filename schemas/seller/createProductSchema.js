const Joi = require('joi');

module.exports = {
    body: Joi.object({
        name: Joi.string().min(3).max(200).required(),
        description: Joi.string().optional(),
        price: Joi.number().min(0).required(),
        stock: Joi.number().min(0).required(),
        categoryId: Joi.string().hex().length(24).required(),
        images: Joi.array().items(Joi.string().uri()).optional(),
        imageUrl: Joi.string().uri().optional(),
    })
};