const Joi = require("joi");

const getOrderByIdParamsSchema = Joi.object({
  id: Joi.string().hex().length(24).required(),
}).required();

const getOrderByIdSchema = {
  params: getOrderByIdParamsSchema,
};

module.exports = getOrderByIdSchema;
