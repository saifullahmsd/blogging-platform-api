const Joi = require('joi');

const createCommentSchema = Joi.object({
    content: Joi.string()
        .trim()
        .min(1)
        .max(2000)
        .required()
        .messages({
            'string.empty': 'Comment content is required',
            'string.min': 'Comment must be at least 1 character',
            'string.max': 'Comment cannot exceed 2000 characters'
        }),

    parentComment: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .optional()
        .messages({
            'string.pattern.base': 'Invalid parent comment ID'
        })
});

const updateCommentSchema = Joi.object({
    content: Joi.string()
        .trim()
        .min(1)
        .max(2000)
        .required()
        .messages({
            'string.empty': 'Comment content is required',
            'string.min': 'Comment must be at least 1 character',
            'string.max': 'Comment cannot exceed 2000 characters'
        })
});

const flagCommentSchema = Joi.object({
    reason: Joi.string()
        .valid('spam', 'offensive', 'harassment', 'misinformation', 'other')
        .required()
        .messages({
            'any.only': 'Invalid flag reason',
            'string.empty': 'Flag reason is required'
        }),

    details: Joi.string()
        .max(500)
        .optional()
        .messages({
            'string.max': 'Details cannot exceed 500 characters'
        })
});

module.exports = {
    createCommentSchema,
    updateCommentSchema,
    flagCommentSchema
};