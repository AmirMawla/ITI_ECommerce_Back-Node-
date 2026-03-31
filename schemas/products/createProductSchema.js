const Joi = require("joi");

const createProductBodySchema = Joi.object({
  name: Joi.string().min(2).max(200).required(),
  description: Joi.string().max(5000).required(),
  price: Joi.number().min(0).required(),
  stock: Joi.number().min(0).required(),
  categoryId: Joi.string().hex().length(24).required(),
  imageUrl: Joi.string().uri().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
});

const createProductSchema = {
  body: createProductBodySchema,
};

module.exports = createProductSchema;