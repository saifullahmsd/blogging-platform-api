/**
 * Application Constants
 * Centralized configuration values for validation rules, categories, and pagination.
 */
module.exports = {
    /** Allowed post categories */
    CATEGORIES: {
        TECHNOLOGY: 'Technology',
        LIFESTYLE: 'Lifestyle',
        TRAVEL: 'Travel',
        FOOD: 'Food',
        HEALTH: 'Health',
        FINANCE: 'Finance',
        OTHER: 'Other'
    },

    /** Validation constraints for Post and User models */
    VALIDATION_RULES: {
        TITLE_MIN_LENGTH: 3,
        TITLE_MAX_LENGTH: 200,
        CONTENT_MIN_LENGTH: 10,
        CONTENT_MAX_LENGTH: 50000,
        TAG_MAX_LENGTH: 30,
        MAX_TAGS: 10,

        NAME_MIN: 3,
        NAME_MAX: 50,
        PASSWORD_MIN: 8,
        PASSWORD_MAX: 128,
        AGE_MIN: 18,
        AGE_MAX: 100,
        BIO_MAX: 500
    },

    /** Default pagination settings */
    PAGINATION: {
        DEFAULT_PAGE: 1,
        DEFAULT_LIMIT: 10,
        MAX_LIMIT: 100,
    }
};