const Joi = require("joi");

const checkoutBodySchema = Joi.object({
  userId: Joi.string().hex().length(24),
}).required();

const checkoutSchema = {
  body: checkoutBodySchema,
};

module.exports = checkoutSchema;
