const Joi = require("joi");

const removeItemFromCartBodySchema = Joi.object({
  productId: Joi.string().hex().length(24).required()
}).required();

const removeItemFromCartSchema = {
  body: removeItemFromCartBodySchema,
};

module.exports = removeItemFromCartSchema;