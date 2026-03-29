const Joi = require("joi");

const createCategoryBodySchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(500).optional(),
  imageUrl: Joi.string().uri().optional(),
});

const createCategorySchema = {
  body: createCategoryBodySchema,
};

module.exports = createCategorySchema;