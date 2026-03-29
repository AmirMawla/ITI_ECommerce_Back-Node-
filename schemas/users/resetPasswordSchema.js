const Joi = require('joi');

module.exports = {
    body: Joi.object({
        email: Joi.string().email().required(),
        otp: Joi.string().required(),
        newPassword: Joi.string().min(8).max(200).required(),
        confirmPassword: Joi.any().valid(Joi.ref('newPassword')).required()
            .messages({ 'any.only': 'Passwords must match' })
    })
};