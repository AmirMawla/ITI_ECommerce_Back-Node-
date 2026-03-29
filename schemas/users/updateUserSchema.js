const Joi = require('joi');

module.exports = {
    body: Joi.object({
        name: Joi.string().min(3).max(30),
        birthdate: Joi.date().less('now'),
        phone: Joi.string().pattern(/^\+?[\d\s\-().]{7,20}$/),
        address: Joi.object({
            street: Joi.string(),
            city: Joi.string(),
            state: Joi.string(),
            country: Joi.string(),
            zipCode: Joi.string()
        }),
        profilePicture: Joi.object({
            url: Joi.string().uri(),
            fileId: Joi.string()
        })
    })
};