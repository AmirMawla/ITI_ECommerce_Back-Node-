const Joi = require('joi');

module.exports = {
    body: Joi.object({
        name: Joi.string().min(3).max(30).required(),
        email: Joi.string().email().lowercase().required(),
        password: Joi.string().min(8).max(200).required(),
        birthdate: Joi.date().less('now'),
        role: Joi.string().valid('customer', 'seller').default('customer'),
        phone: Joi.string().pattern(/^\+?[\d\s\-().]{7,20}$/),
        address: Joi.object({
            street: Joi.string().trim(),
            city: Joi.string().trim(),
            state: Joi.string().trim(),
            country: Joi.string().trim(),
            zipCode: Joi.string().trim()
        })
    })
};