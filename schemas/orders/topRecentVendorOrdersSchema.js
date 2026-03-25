const Joi = require("joi");

const topRecentVendorOrdersQuerySchema = Joi.object({
  count: Joi.number().integer().min(1).max(20).default(5),
}).required();

const topRecentVendorOrdersSchema = {
  query: topRecentVendorOrdersQuerySchema,
};

module.exports = topRecentVendorOrdersSchema;
