const Joi = require('joi');

module.exports = {
    body: Joi.object({
        title: Joi.string().min(3).max(100).optional(),
        imageUrl: Joi.string().uri().optional(),
        link: Joi.string().uri().optional(),
        isActive: Joi.boolean().optional(),
        order: Joi.number().min(0).optional(),
    })
};