const Joi = require("joi");

const getAllOrdersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().valid("orderDate", "totalAmount", "status", "createdAt").default("orderDate"),
  sortOrder: Joi.string().valid("asc", "desc").default("desc"),
  statuses: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()),
  date: Joi.date().iso(),
  search: Joi.string().allow("", null),
  userId: Joi.string().hex().length(24),
  vendorId: Joi.string().hex().length(24),
}).required();

const getAllOrdersSchema = {
  query: getAllOrdersQuerySchema,
};

module.exports = getAllOrdersSchema;
