const Joi = require("joi");

const updateCartItemQuantityBodySchema = Joi.object({
  productId: Joi.string().hex().length(24).required(),
  quantity: Joi.number().integer().min(1).required(),
}).required();

const updateCartItemQuantitySchema = {
  body: updateCartItemQuantityBodySchema,
};

module.exports = updateCartItemQuantitySchema;