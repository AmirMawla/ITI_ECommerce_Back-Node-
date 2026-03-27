const Joi = require("joi");

const userTransactionsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  userId: Joi.string().hex().length(24),
}).required();

const userTransactionsSchema = {
  query: userTransactionsQuerySchema,
};

module.exports = userTransactionsSchema;
