/**
 * Unit Tests for User Model
 */
const mongoose = require('mongoose');
const User = require('../../../models/user.model');
describe('User Model', () => {
    // Schema Validation
    describe('Schema Validation', () => {
        test('should require name field', async () => {
            const user = new User({
                email: 'test@test.com',
                password: 'Password123!'
            });
            let error;
            try {
                await user.validate();
            } catch (e) {
                error = e;
            }
            expect(error).toBeDefined();
            expect(error.errors.name).toBeDefined();
        });
        test('should require email field', async () => {
            const user = new User({
                name: 'Test User',
                password: 'Password123!'
            });
            let error;
            try {
                await user.validate();
            } catch (e) {
                error = e;
            }
            expect(error).toBeDefined();
            expect(error.errors.email).toBeDefined();
        });
        test('should set default role to "user"', () => {
            const user = new User({
                name: 'Test',
                email: 'test@test.com',
                password: 'Password123!'
            });
            expect(user.role).toBe('user');
        });
        test('should set isActive to true by default', () => {
            const user = new User({
                name: 'Test',
                email: 'test@test.com',
                password: 'Password123!'
            });
            expect(user.isActive).toBe(true);
        });
    });

    // Password Hashing 
    describe('Password Hashing', () => {
        test('should hash password before saving', async () => {
            const plainPassword = 'Password123!';
            const user = new User({
                name: 'Test User',
                email: 'hash@test.com',
                password: plainPassword
            });
            await user.save();

            expect(user.password).not.toBe(plainPassword);
            expect(user.password.length).toBeGreaterThan(20);
        });
    });

    // comparePassword Method
    describe('comparedPassword', () => {
        test('should return true for correct password', async () => {
            const plainPassword = 'Password!123';
            const user = new User({
                name: 'amjad khan',
                email: 'amjad@gemail.com',
                password: plainPassword
            });

            await user.save();
            const isMatch = await user.comparePassword(plainPassword);

            expect(isMatch).toBe(true)
        });

        test('should return false for wrong password', async () => {
            const user = new User({
                name: 'Test User',
                email: 'wrong@test.com',
                password: 'Password123!'
            });
            await user.save();
            const isMatch = await user.comparePassword('WrongPassword123!');
            expect(isMatch).toBe(false);
        });
    });

    // isLocked Method
    describe('isLocked', () => {
        test('should return false when lockUntil is not set', () => {
            const user = new User({
                name: 'Test',
                email: 'lock1@test.com',
                password: 'Password123!'
            });
            expect(user.isLocked()).toBe(false);
        });
        test('should return true when lockUntil is in the future', () => {
            const user = new User({
                name: 'Test',
                email: 'lock2@test.com',
                password: 'Password123!',
                lockUntil: new Date(Date.now() + 60000)
            });
            expect(user.isLocked()).toBe(true);
        });
        test('should return false when lockUntil is in the past', () => {
            const user = new User({
                name: 'Test',
                email: 'lock3@test.com',
                password: 'Password123!',
                lockUntil: new Date(Date.now() - 60000)
            });
            expect(user.isLocked()).toBe(false);
        });
    });
    // toJSON Transform
    describe('toJSON Transform', () => {
        test('should remove password from JSON output', async () => {
            const user = new User({
                name: 'Test',
                email: 'json@test.com',
                password: 'Password123!'
            });
            await user.save();
            const json = user.toJSON();
            expect(json.password).toBeUndefined();
        });
        test('should remove refreshTokens from JSON output', async () => {
            const user = new User({
                name: 'Test',
                email: 'json2@test.com',
                password: 'Password123!'
            });
            await user.save();
            const json = user.toJSON();
            expect(json.refreshTokens).toBeUndefined();
        });
        test('should rename _id to id', async () => {
            const user = new User({
                name: 'Test',
                email: 'json3@test.com',
                password: 'Password123!'
            });
            await user.save();
            const json = user.toJSON();
            expect(json.id).toBeDefined();
            expect(json._id).toBeUndefined();
        });
    });
});