const Joi = require('joi');

module.exports = {
    body: Joi.object({
        email: Joi.string().email().required(),
        otp: Joi.string().length(6).required()
    })
};