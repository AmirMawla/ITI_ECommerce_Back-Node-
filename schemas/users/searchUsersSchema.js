const Joi = require('joi');

module.exports = {
    query: Joi.object({
        keyword: Joi.string().min(1).required()
    })
};