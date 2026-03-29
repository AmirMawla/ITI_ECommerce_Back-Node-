const Joi = require('joi');

module.exports = {
    params: Joi.object({
        id: Joi.string().hex().length(24).required(),
    })
};