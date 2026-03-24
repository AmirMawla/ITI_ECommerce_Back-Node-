const Joi = require("joi");

const getVendorOrderParamsSchema = Joi.object({
  orderId: Joi.string().hex().length(24).required(),
}).required();

const getVendorOrderSchema = {
  params: getVendorOrderParamsSchema,
};

module.exports = getVendorOrderSchema;
