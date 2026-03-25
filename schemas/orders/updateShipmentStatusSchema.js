const Joi = require("joi");

const updateShipmentStatusParamsSchema = Joi.object({
  id: Joi.string().hex().length(24).required(),
}).required();

const updateShipmentStatusBodySchema = Joi.object({
  newStatus: Joi.string()
    .valid("preparing", "outfordelivery", "delivered", "canceled", "returned")
    .required(),
  note: Joi.string().allow("", null),
  location: Joi.string().allow("", null),
}).required();

const updateShipmentStatusSchema = {
  params: updateShipmentStatusParamsSchema,
  body: updateShipmentStatusBodySchema,
};

module.exports = updateShipmentStatusSchema;
