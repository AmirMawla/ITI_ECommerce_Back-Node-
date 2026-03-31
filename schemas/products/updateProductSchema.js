const Joi = require("joi");

const updateProductBodySchema = Joi.object({
  name: Joi.string().min(2).max(200).optional(),
  description: Joi.string().max(5000).optional(),
  price: Joi.number().min(0).optional(),
  stock: Joi.number().min(0).optional(),
  categoryId: Joi.string().hex().length(24).optional(),
  imageUrl: Joi.string().uri().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
});

const updateProductSchema = {
  body: updateProductBodySchema,
};

module.exports = updateProductSchema;