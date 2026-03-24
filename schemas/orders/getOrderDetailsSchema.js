const Joi = require("joi");

const getOrderDetailsParamsSchema = Joi.object({
  id: Joi.string().hex().length(24).required(),
}).required();

const getOrderDetailsSchema = {
  params: getOrderDetailsParamsSchema,
};

module.exports = getOrderDetailsSchema;
