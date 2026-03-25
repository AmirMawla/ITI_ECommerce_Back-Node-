const Joi = require("joi");

const addOrderBodySchema = Joi.object({
  notes: Joi.string().allow("", null),
}).optional();

const addOrderSchema = {
  body: addOrderBodySchema,
};

module.exports = addOrderSchema;
