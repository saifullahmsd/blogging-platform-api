/**
 * Unit Tests for JWT Utilities
 */
const JWTUtils = require('../../../utils/jwt');
const { ApiError } = require('../../../utils/ApiError');

describe('JWTUtils', () => {

    // generateAccessToken
    describe('generateAccessToken', () => {

        test('should generate a valid JWT string', () => {
            const id = '507f1f77bcf86cd799439011';
            const token = JWTUtils.generateAccessToken(id);

            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
            expect(token.split('.')).toHaveLength(3);

        })

    });


    // generateRefreshToken
    describe('generateRefreshToken', () => {

        test('should generate a valid JWT string', () => {
            const id = '507f1f77bcf86cd799439011';
            const token = JWTUtils.generateRefreshToken(id);

            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
            expect(token.split('.')).toHaveLength(3);
        })


    });

    // verifyAccessToken - Success Case
    describe('verifyAccessToken', () => {

        test('should a valid access token', () => {
            const id = '507f1f77bcf86cd799439011';
            const token = JWTUtils.generateAccessToken(id);

            const decoded = JWTUtils.verifyAccessToken(token);

            expect(decoded.id).toBe(id);
            expect(decoded.type).toBe('access');
        })

        test('should throw ApiError for invalid token', () => {
            const invalidToken = 'fake.invalid.token';

            expect(() => {
                JWTUtils.verifyAccessToken(invalidToken);
            }).toThrow(ApiError);
        });

        test('should throw ApiError with 401 status for invalid token', () => {
            const invalidToken = 'invalid-token';

            try {
                JWTUtils.verifyAccessToken(invalidToken);
            } catch (error) {
                expect(error).toBeInstanceOf(ApiError);
                expect(error.statusCode).toBe(401);
            }
        });

    });

    // verifyRefreshToken
    describe('verifyRefreshToken', () => {

        test('should decode a valid refresh token', () => {
            const userId = '507f1f77bcf86cd799439011';
            const token = JWTUtils.generateRefreshToken(userId);

            const decoded = JWTUtils.verifyRefreshToken(token);

            expect(decoded.id).toBe(userId);
            expect(decoded.type).toBe('refresh');
        });

        test('should throw ApiError if access token used as refresh', () => {
            const userId = '507f1f77bcf86cd799439011';
            const accessToken = JWTUtils.generateAccessToken(userId);

            expect(() => {
                JWTUtils.verifyRefreshToken(accessToken);
            }).toThrow(ApiError);
        });

    });

    // generateTokenPair
    describe('generateTokenPair', () => {

        test('should return both tokens with expiry dates', () => {
            const userId = '507f1f77bcf86cd799439011';

            const result = JWTUtils.generateTokenPair(userId);


            expect(result.accessToken).toBeDefined();
            expect(result.refreshToken).toBeDefined();
            expect(result.accessTokenExpiry).toBeDefined();
            expect(result.refreshTokenExpiry).toBeDefined();

            // Check expiry dates are in the future
            expect(result.accessTokenExpiry > new Date()).toBe(true);
            expect(result.refreshTokenExpiry > new Date()).toBe(true);
        });

    });

    // parseExpiry
    describe('parseExpiry', () => {

        test('should parse seconds correctly', () => {
            expect(JWTUtils.parseExpiry('30s')).toBe(30 * 1000);
        });

        test('should parse minutes correctly', () => {
            expect(JWTUtils.parseExpiry('15m')).toBe(15 * 60 * 1000);
        });

        test('should parse hours correctly', () => {
            expect(JWTUtils.parseExpiry('2h')).toBe(2 * 60 * 60 * 1000);
        });

        test('should parse days correctly', () => {
            expect(JWTUtils.parseExpiry('7d')).toBe(7 * 24 * 60 * 60 * 1000);
        });

    });

});
