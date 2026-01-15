/**
 * Validation Middleware Factory
 * Creates middleware that validates req.body against a Joi schema.
 * Strips unknown fields and converts types automatically.
 * 
 * @param {Joi.Schema} schema - Joi validation schema
 * @returns {Function} Express middleware
 * @throws {ValidationError} If validation fails
 */
const { ValidationError } = require('../utils/ApiError')

const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
            convert: true,
        });

        if (error) {
            const errors = error.details.map((detail) => ({
                field: detail.path.join('.'),
                message: detail.message,
            }));

            throw new ValidationError('Validation failed', errors);
        }

        req.body = value;
        next();
    }
};

module.exports = validate;