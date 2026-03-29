const Joi = require("joi");

const updateCategoryBodySchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  description: Joi.string().max(500).optional(),
  imageUrl: Joi.string().uri().optional(),
});

const updateCategorySchema = {
  body: updateCategoryBodySchema,
};

module.exports = updateCategorySchema;