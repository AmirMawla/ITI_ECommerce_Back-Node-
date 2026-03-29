const Joi = require('joi');

module.exports = {
    body: Joi.object({
        storeName: Joi.string().min(3).max(50).trim().required(),
        bio: Joi.string().max(500).trim().required()
    })
};