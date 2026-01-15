/**
 * Post Validation Schemas
 * Joi schemas for creating and updating blog posts.
 */
const Joi = require('joi');
const { CATEGORIES, VALIDATION_RULES } = require('../utils/constants');

const createPostSchema = Joi.object({
    title: Joi.string()
        .trim()
        .min(VALIDATION_RULES.TITLE_MIN_LENGTH)
        .max(VALIDATION_RULES.TITLE_MAX_LENGTH)
        .required()
        .messages({
            'string.empty': 'Title is required',
            'string.min': 'Title must be at least 3 characters',
            'string.max': 'Title cannot exceed 200 characters'
        }),

    content: Joi.string()
        .trim()
        .min(VALIDATION_RULES.CONTENT_MIN_LENGTH)
        .max(VALIDATION_RULES.CONTENT_MAX_LENGTH)
        .required()
        .messages({
            'string.empty': 'Content is required',
            'string.min': 'Content must be at least 10 characters',
            'string.max': 'Content cannot exceed 50000 characters'
        }),

    category: Joi.string()
        .valid(...Object.values(CATEGORIES))
        .required()
        .messages({
            'any.only': 'Invalid category. Must be one of: Technology, Lifestyle, Travel, Food, Health, Finance, Other',
            'string.empty': 'Category is required'
        }),

    tags: Joi.array()
        .items(
            Joi.string()
                .trim()
                .max(VALIDATION_RULES.TAG_MAX_LENGTH)
        )
        .max(VALIDATION_RULES.MAX_TAGS)
        .optional()
        .messages({
            'array.max': 'Cannot have more than 10 tags',
            'string.max': 'Each tag cannot exceed 30 characters'
        })
});

const updatePostSchema = Joi.object({
    title: Joi.string()
        .trim()
        .min(VALIDATION_RULES.TITLE_MIN_LENGTH)
        .max(VALIDATION_RULES.TITLE_MAX_LENGTH)
        .optional(),

    content: Joi.string()
        .trim()
        .min(VALIDATION_RULES.CONTENT_MIN_LENGTH)
        .max(VALIDATION_RULES.CONTENT_MAX_LENGTH)
        .optional(),

    category: Joi.string()
        .valid(...Object.values(CATEGORIES))
        .optional(),

    tags: Joi.array()
        .items(Joi.string().trim().max(VALIDATION_RULES.TAG_MAX_LENGTH))
        .max(VALIDATION_RULES.MAX_TAGS)
        .optional()
}).min(1).messages({
    'object.min': 'At least one field must be provided for update'
});

module.exports = {
    createPostSchema,
    updatePostSchema
};