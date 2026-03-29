const Joi = require("joi");

const isItemInCartBodySchema = Joi.object({
  productId: Joi.string().hex().length(24).required(),
}).required();

const isItemInCartSchema = {
  body: isItemInCartBodySchema,
};

module.exports = isItemInCartSchema;