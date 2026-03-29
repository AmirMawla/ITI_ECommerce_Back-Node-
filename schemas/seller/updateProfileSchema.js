const Joi = require('joi');

module.exports = {
    body: Joi.object({
        storeName: Joi.string().min(3).max(100).optional(),
        bio: Joi.string().max(500).optional(),
    })
};