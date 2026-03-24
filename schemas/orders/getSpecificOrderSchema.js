const Joi = require("joi");

const getSpecificOrderParamsSchema = Joi.object({
  orderId: Joi.string().hex().length(24).required(),
  vendorId: Joi.string().hex().length(24).required(),
}).required();

const getSpecificOrderSchema = {
  params: getSpecificOrderParamsSchema,
};

module.exports = getSpecificOrderSchema;
