/**
 * Unit Tests for Custom API Error Classes
 */
const {
    ApiError,
    ValidationError,
    NotFoundError,
    ConflictError
} = require('../../../utils/ApiError');
describe('ApiError Classes', () => {

    // ApiError (Base Class)
    describe('ApiError', () => {

        test('should set statusCode and message correctly', () => {
            const error = new ApiError(500, 'Server Error');

            expect(error.statusCode).toBe(500);
            expect(error.message).toBe('Server Error');
        });
        test('should set status to "fail" for 4xx errors', () => {
            const error = new ApiError(400, 'Bad Request');

            expect(error.status).toBe('fail');
        });
        test('should set status to "error" for 5xx errors', () => {
            const error = new ApiError(500, 'Server Error');

            expect(error.status).toBe('error');
        });
        test('should be an instance of Error', () => {
            const error = new ApiError(400, 'Test');

            expect(error).toBeInstanceOf(Error);
        });
        test('should have isOperational flag set to true by default', () => {
            const error = new ApiError(400, 'Test');

            expect(error.isOperational).toBe(true);
        });
    });

    // ValidationError (400)
    describe('ValidationError', () => {

        test('should set statusCode to 400', () => {
            const error = new ValidationError('Invalid input');

            expect(error.statusCode).toBe(400);
        });
        test('should have status as "fail"', () => {
            const error = new ValidationError('Invalid input');

            expect(error.status).toBe('fail');
        });
        test('should have empty errors array by default', () => {
            const error = new ValidationError('Invalid input');

            expect(error.errors).toEqual([]);
        });
        test('should accept custom errors array', () => {
            const customErrors = ['Name is required', 'Email is invalid'];
            const error = new ValidationError('Validation failed', customErrors);

            expect(error.errors).toEqual(customErrors);
        });
    });

    // NotFoundError (404)
    describe('NotFoundError', () => {

        test('should set statusCode to 404', () => {
            const error = new NotFoundError('User');

            expect(error.statusCode).toBe(404);
        });
        test('should format message with resource name', () => {
            const error = new NotFoundError('Post');

            expect(error.message).toBe('Post not found');
        });
        test('should have status as "fail"', () => {
            const error = new NotFoundError('Comment');

            expect(error.status).toBe('fail');
        });
    });
    // ConflictError (409)

    describe('ConflictError', () => {

        test('should set statusCode to 409', () => {
            const error = new ConflictError('Email already exists');

            expect(error.statusCode).toBe(409);
        });
        test('should set custom message', () => {
            const error = new ConflictError('Username taken');

            expect(error.message).toBe('Username taken');
        });
        test('should have status as "fail"', () => {
            const error = new ConflictError('Conflict');

            expect(error.status).toBe('fail');
        });
    });
});