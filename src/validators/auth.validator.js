/**
 * Authentication Validation Schemas
 * Joi schemas for user registration, login, profile updates, and password changes.
 */
const Joi = require('joi');
const { VALIDATION_RULES } = require('../utils/constants');

const registerSchema = Joi.object({
    name: Joi.string()
        .trim()
        .min(VALIDATION_RULES.NAME_MIN)
        .max(VALIDATION_RULES.NAME_MAX)
        .required()
        .messages({
            'string.empty': 'Name is required',
            'string.min': 'Name must be at least 2 characters',
            'string.max': 'Name cannot exceed 50 characters'
        }),

    email: Joi.string()
        .trim()
        .email()
        .lowercase()
        .required()
        .messages({
            'string.empty': 'Email is required',
            'string.email': 'Please provide a valid email'
        }),

    password: Joi.string()
        .min(VALIDATION_RULES.PASSWORD_MIN)
        .max(VALIDATION_RULES.PASSWORD_MAX)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .required()
        .messages({
            'string.empty': 'Password is required',
            'string.min': 'Password must be at least 8 characters',
            'string.pattern.base': 'Password must contain uppercase, lowercase, number, and special character'
        }),

    bio: Joi.string()
        .max(VALIDATION_RULES.BIO_MAX)
        .optional()
});

const loginSchema = Joi.object({
    email: Joi.string()
        .trim()
        .email()
        .lowercase()
        .required()
        .messages({
            'string.empty': 'Email is required',
            'string.email': 'Please provide a valid email'
        }),

    password: Joi.string()
        .required()
        .messages({
            'string.empty': 'Password is required'
        })
});

const updateProfileSchema = Joi.object({
    name: Joi.string().trim().min(VALIDATION_RULES.NAME_MIN).max(VALIDATION_RULES.NAME_MAX).optional(),
    bio: Joi.string().max(VALIDATION_RULES.BIO_MAX).optional(),
    avatar: Joi.string().uri().optional()
}).min(1);

const changePasswordSchema = Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string()
        .min(VALIDATION_RULES.PASSWORD_MIN)
        .max(VALIDATION_RULES.PASSWORD_MAX)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .required()
        .messages({
            'string.pattern.base': 'Password must contain uppercase, lowercase, number, and special character'
        }),
    confirmPassword: Joi.string()
        .valid(Joi.ref('newPassword'))
        .required()
        .messages({
            'any.only': 'Passwords do not match'
        })
});

module.exports = {
    registerSchema,
    loginSchema,
    updateProfileSchema,
    changePasswordSchema
};