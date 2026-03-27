const Joi = require("joi");

const cancelOrderParamsSchema = Joi.object({
  orderId: Joi.string().hex().length(24).required(),
}).required();

const cancelOrderSchema = {
  params: cancelOrderParamsSchema,
};

module.exports = cancelOrderSchema;
