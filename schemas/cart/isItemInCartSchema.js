const Joi = require("joi");

const isItemInCartparamsSchema = Joi.object({
  productId: Joi.string().hex().length(24).required(),
}).required();

const isItemInCartSchema = {
  params: isItemInCartparamsSchema,
};

module.exports = isItemInCartSchema;