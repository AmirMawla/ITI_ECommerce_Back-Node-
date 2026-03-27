const Joi = require("joi");

const vendorTransactionsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string()
    .valid("transactionDate", "totalAmount", "paymentStatus", "paymentMethod", "orderId", "createdAt")
    .default("transactionDate"),
  sortOrder: Joi.string().valid("asc", "desc").default("desc"),
  statuses: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()),
  date: Joi.date().iso(),
  search: Joi.string().allow("", null),
  paymentMethods: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()),
  vendorId: Joi.string().hex().length(24),
}).required();

const vendorTransactionsSchema = {
  query: vendorTransactionsQuerySchema,
};

module.exports = vendorTransactionsSchema;
