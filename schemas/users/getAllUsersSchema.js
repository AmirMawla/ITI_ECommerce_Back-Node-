const Joi = require('joi');

module.exports = {
    query: Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(10),
        role: Joi.string().valid('customer', 'seller', 'admin'),
        isActive: Joi.boolean()
    })
};