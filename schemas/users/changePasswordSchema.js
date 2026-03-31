const Joi = require('joi');

module.exports = {
    body: Joi.object({
        oldPassword: Joi.string().required(),
        newPassword: Joi.string().min(8).max(200).required(),
    })
};