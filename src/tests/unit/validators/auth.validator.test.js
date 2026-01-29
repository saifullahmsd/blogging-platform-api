/**
 * Unit Tests for Auth Validation Schemas
 */
const {
    registerSchema,
    loginSchema,
    updateProfileSchema,
    changePasswordSchema
} = require('../../../validators/auth.validator');
describe('Auth Validators', () => {
    // Register Schema
    describe('registerSchema', () => {

        test('should pass with valid data', () => {
            const validData = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'Password123!'
            };
            const { error } = registerSchema.validate(validData);

            expect(error).toBeUndefined();
        });

        test('should fail when name is missing', () => {
            const data = {
                email: 'test@example.com',
                password: 'Password123!'
            };
            const { error } = registerSchema.validate(data);

            expect(error).toBeDefined();
            expect(error.details[0].path).toContain('name');
        });

        test('should fail when email is invalid', () => {
            const data = {
                name: 'Test User',
                email: 'invalid-email',
                password: 'Password123!'
            };
            const { error } = registerSchema.validate(data);

            expect(error).toBeDefined();
            expect(error.details[0].path).toContain('email');
        });

        test('should fail when password is too weak', () => {
            const data = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'password'
            };
            const { error } = registerSchema.validate(data);

            expect(error).toBeDefined();
            expect(error.details[0].path).toContain('password');
        });

        test('should fail when password is too short', () => {
            const data = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'Pass1!'
            };
            const { error } = registerSchema.validate(data);

            expect(error).toBeDefined();
        });
    });

    // Login Schema
    describe('loginSchema', () => {

        test('should pass with valid email and password', () => {
            const validData = {
                email: 'test@example.com',
                password: 'anypassword'
            };
            const { error } = loginSchema.validate(validData);

            expect(error).toBeUndefined();
        });

        test('should fail when email is missing', () => {
            const data = {
                password: 'password'
            };
            const { error } = loginSchema.validate(data);

            expect(error).toBeDefined();
            expect(error.details[0].path).toContain('email');
        });
        test('should fail when password is missing', () => {
            const data = {
                email: 'test@example.com'
            };
            const { error } = loginSchema.validate(data);

            expect(error).toBeDefined();
            expect(error.details[0].path).toContain('password');
        });
    });
    // Update Profile Schema
    describe('updateProfileSchema', () => {

        test('should pass with valid name update', () => {
            const data = {
                name: 'New Name'
            };
            const { error } = updateProfileSchema.validate(data);

            expect(error).toBeUndefined();
        });

        test('should pass with valid bio update', () => {
            const data = {
                bio: 'This is my bio'
            };
            const { error } = updateProfileSchema.validate(data);

            expect(error).toBeUndefined();
        });

        test('should fail when no fields provided (empty object)', () => {
            const data = {};
            const { error } = updateProfileSchema.validate(data);

            expect(error).toBeDefined();
        });
    });
    // Change Password Schema
    describe('changePasswordSchema', () => {

        test('should pass with valid password change', () => {

            const data = {
                currentPassword: 'OldPassword123!',
                newPassword: 'NewPassword456!',
                confirmPassword: 'NewPassword456!'
            };
            const { error } = changePasswordSchema.validate(data);

            expect(error).toBeUndefined();
        });

        test('should fail when passwords do not match', () => {
            const data = {
                currentPassword: 'OldPassword123!',
                newPassword: 'NewPassword456!',
                confirmPassword: 'DifferentPassword789!'
            };
            const { error } = changePasswordSchema.validate(data);

            expect(error).toBeDefined();
        });
        test('should fail when new password is weak', () => {
            const data = {
                currentPassword: 'OldPassword123!',
                newPassword: 'weakpassword',
                confirmPassword: 'weakpassword'
            };
            const { error } = changePasswordSchema.validate(data);

            expect(error).toBeDefined();
        });
    });
});