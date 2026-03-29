const Joi = require("joi");

const addItemToCartBodySchema = Joi.object({
  productId: Joi.string().hex().length(24).required(),
  quantity: Joi.number().integer().min(1).default(1),
}).required();

const addItemToCartSchema = {
  body: addItemToCartBodySchema,
};

module.exports = addItemToCartSchema;