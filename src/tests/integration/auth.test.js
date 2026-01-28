const request = require('supertest');
const app = require('../../api/app');
const { email } = require('envalid');

describe('Auth API', () => {
    // Test Register User 
    describe('POST /api/v1/auth/register', () => {
        test('should register a new user successfully', async () => {
            const newUser = {
                name: 'test user',
                email: 'testuser@example.com',
                password: 'Password123!'
            };

            const response = await request(app)
                .post('/api/v1/auth/register')
                .send(newUser);

            expect(response.statusCode).toBe(201);
            expect(response.body.status).toBe('success');
            expect(response.body.data.user.name).toBe(newUser.name);
            expect(response.body.data.user.email).toBe(newUser.email);
            expect(response.body.data.tokens.accessToken).toBeDefined();
            expect(response.body.data.tokens.refreshToken).toBeDefined();

            expect(response.body.data.user.password).toBeUndefined();

        });

        test('should return 409 if email already exists', async () => {
            const existingUser = {
                name: 'First User',
                email: 'firstuser@example.com',
                password: 'Password@1234'
            };
            await request(app)
                .post('/api/v1/auth/register')
                .send(existingUser);

            const response = await request(app)
                .post('/api/v1/auth/register')
                .send(existingUser);

            expect(response.statusCode).toBe(409);
            expect(response.body.status).toBe('fail');
            expect(response.body.message).toBe('Email already registered');
        });
    });

    // Test Login User
    describe('POST /api/v1/auth/login', () => {
        test('should login a user successfully', async () => {
            const user = {
                name: 'login test user',
                email: 'loginuser@example.com',
                password: 'Password123!',
            };

            await request(app)
                .post('/api/v1/auth/register')
                .send(user);

            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: user.email,
                    password: user.password
                });

            expect(response.statusCode).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.data.user.email).toBe(user.email);
            expect(response.body.data.tokens.accessToken).toBeDefined();
            expect(response.body.data.tokens.refreshToken).toBeDefined();

            expect(response.body.data.user.password).toBeUndefined();
        });

        test('should return 401 if invalid credentials', async () => {
            const user = {
                name: 'Wrong pass user',
                email: 'wrongpassuser@example.com',
                password: 'Password123?'
            };

            await request(app)
                .post('/api/v1/auth/register')
                .send(user);

            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: user.email,
                    password: 'Wrongpassword12@'
                });

            expect(response.statusCode).toBe(401);
            expect(response.body.status).toBe('fail');
        });

        test('should return 401 for non-existent email', async () => {
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'Password123!'
                });

            expect(response.statusCode).toBe(401);
            expect(response.body.status).toBe('fail');
            expect(response.body.message).toBe('Invalid email or password');
        });

        test('should return 403 for account is locked', async () => {
            const user = {
                name: 'Locked User',
                email: 'lockeduser@example.com',
                password: 'Password123!'
            };

            await request(app)
                .post('/api/v1/auth/register')
                .send(user);

            for (let i = 0; i < 5; i++) {
                await request(app)
                    .post('/api/v1/auth/login')
                    .send({
                        email: user.email,
                        password: 'Password123?'
                    });
            }

            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: user.email,
                    password: user.password
                });

            expect(response.statusCode).toBe(403);
            expect(response.body.status).toBe('fail');
        });

        test('should return 400 for missing email', async () => {
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    password: 'Password123!'
                });
            expect(response.statusCode).toBe(400);
            expect(response.body.status).toBe('fail');
        });

        test('should return 400 for missing password', async () => {
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'test@example.com'
                });
            expect(response.statusCode).toBe(400);
            expect(response.body.status).toBe('fail');
        });
    })

    // Test Refresh Token 
    describe('POST /api/v1/auth/refresh', () => {

        test('should refresh access token successfully', async () => {

            const user = {
                name: 'Refresh Test User',
                email: 'refreshtest@example.com',
                password: 'Password123!'
            };

            const registerRes = await request(app)
                .post('/api/v1/auth/register')
                .send(user);

            const refreshToken = registerRes.body.data.tokens.refreshToken;

            const response = await request(app)
                .post('/api/v1/auth/refresh')
                .send({ refreshToken });

            expect(response.statusCode).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.data.accessToken).toBeDefined();
        });

        test('should return 401 for invalid refresh token', async () => {
            const response = await request(app)
                .post('/api/v1/auth/refresh')
                .send({ refreshToken: 'invalid-token-here' });

            expect(response.statusCode).toBe(401);
            expect(response.body.status).toBe('fail');
        });

        test('should return 401 for missing refresh token', async () => {
            const response = await request(app)
                .post('/api/v1/auth/refresh')
                .send({});

            expect(response.statusCode).toBe(401);
            expect(response.body.status).toBe('fail');
        });
    });

    // Test Get Profile
    describe('GET /api/v1/auth/me', () => {
        test('should get user profile successfully', async () => {
            const user = {
                name: 'Profile Test User',
                email: 'profiletest@example.com',
                password: 'Password123!'
            };
            const registerRes = await request(app)
                .post('/api/v1/auth/register')
                .send(user);

            const accessToken = registerRes.body.data.tokens.accessToken;
            const response = await request(app)
                .get('/api/v1/auth/me')
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.statusCode).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.data.email).toBe(user.email);
            expect(response.body.data.name).toBe(user.name);
        });

        test('should return 401 without token', async () => {
            const response = await request(app)
                .get('/api/v1/auth/me');
            expect(response.statusCode).toBe(401);
            expect(response.body.status).toBe('fail');
        });
        test('should return 401 with invalid token', async () => {
            const response = await request(app)
                .get('/api/v1/auth/me')
                .set('Authorization', 'Bearer invalid-token');
            expect(response.statusCode).toBe(401);
            expect(response.body.status).toBe('fail');
        });
    });

    // Test Update Profile
    describe('PUT /api/v1/auth/profile', () => {
        test('should update profile successfully', async () => {
            const user = {
                name: 'Update Profile User',
                email: 'updateprofile@example.com',
                password: 'Password123!'
            };
            const registerRes = await request(app)
                .post('/api/v1/auth/register')
                .send(user);
            const accessToken = registerRes.body.data.tokens.accessToken;
            const response = await request(app)
                .put('/api/v1/auth/profile')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    name: 'Updated Name',
                    bio: 'This is my updated bio'
                });
            expect(response.statusCode).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.data.name).toBe('Updated Name');
            expect(response.body.data.bio).toBe('This is my updated bio');
        });
        test('should return 401 without token', async () => {
            const response = await request(app)
                .put('/api/v1/auth/profile')
                .send({ name: 'New Name' });
            expect(response.statusCode).toBe(401);
            expect(response.body.status).toBe('fail');
        });
        test('should return 400 for empty update', async () => {
            const user = {
                name: 'Empty Update User',
                email: 'emptyupdate@example.com',
                password: 'Password123!'
            };
            const registerRes = await request(app)
                .post('/api/v1/auth/register')
                .send(user);
            const accessToken = registerRes.body.data.tokens.accessToken;
            const response = await request(app)
                .put('/api/v1/auth/profile')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({});
            console.log(response.body);
            expect(response.statusCode).toBe(400);
            expect(response.body.status).toBe('fail');
        });
    });

    // Test Change Password
    describe('PUT /api/v1/auth/password', () => {
        test('should change password successfully', async () => {
            const user = {
                name: 'Password Change User',
                email: 'passchange@example.com',
                password: 'Password123!'
            };
            const registerRes = await request(app)
                .post('/api/v1/auth/register')
                .send(user);
            const accessToken = registerRes.body.data.tokens.accessToken;
            const response = await request(app)
                .put('/api/v1/auth/password')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    currentPassword: 'Password123!',
                    newPassword: 'NewPassword456!',
                    confirmPassword: 'NewPassword456!'
                });
            expect(response.statusCode).toBe(200);
            expect(response.body.status).toBe('success');
        });
        test('should return 401 for wrong current password', async () => {
            const user = {
                name: 'Wrong Current Pass',
                email: 'wrongcurrent@example.com',
                password: 'Password123!'
            };
            const registerRes = await request(app)
                .post('/api/v1/auth/register')
                .send(user);
            const accessToken = registerRes.body.data.tokens.accessToken;
            const response = await request(app)
                .put('/api/v1/auth/password')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    currentPassword: 'WrongPassword123!',
                    newPassword: 'NewPassword456!',
                    confirmPassword: 'NewPassword456!'
                });
            expect(response.statusCode).toBe(401);
            expect(response.body.status).toBe('fail');
        });
        test('should return 401 without token', async () => {
            const response = await request(app)
                .put('/api/v1/auth/password')
                .send({
                    currentPassword: 'Password123!',
                    newPassword: 'NewPassword456!',
                    confirmPassword: 'NewPassword456!'
                });
            expect(response.statusCode).toBe(401);
            expect(response.body.status).toBe('fail');
        });
        test('should return 400 for passwords not matching', async () => {
            const user = {
                name: 'Mismatch Pass User',
                email: 'mismatch@example.com',
                password: 'Password123!'
            };
            const registerRes = await request(app)
                .post('/api/v1/auth/register')
                .send(user);
            const accessToken = registerRes.body.data.tokens.accessToken;
            const response = await request(app)
                .put('/api/v1/auth/password')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    currentPassword: 'Password123!',
                    newPassword: 'NewPassword456!',
                    confirmPassword: 'DifferentPassword789!'
                });
            expect(response.statusCode).toBe(400);
            expect(response.body.status).toBe('fail');
        });
    });

    // Test Logout
    describe('POST /api/v1/auth/logout', () => {
        test('should logout user successfully', async () => {
            const user = {
                name: 'Logout Test User',
                email: 'logouttest@example.com',
                password: 'Password123!'
            };

            const registerRes = await request(app)
                .post('/api/v1/auth/register')
                .send(user);

            const accessToken = registerRes.body.data.tokens.accessToken;

            const response = await request(app)
                .post('/api/v1/auth/logout')
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.statusCode).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.message).toBe('Logout successful');
        });

        test('should return 401 without token', async () => {
            const response = await request(app)
                .post('/api/v1/auth/logout');

            expect(response.statusCode).toBe(401);
            expect(response.body.status).toBe('fail');
        });

        test('should return 401 with invalid token', async () => {
            const response = await request(app)
                .post('/api/v1/auth/logout')
                .set('Authorization', 'Bearer invalid-token');

            expect(response.statusCode).toBe(401);
            expect(response.body.status).toBe('fail');
        });

        test('should invalidate refresh token after logout', async () => {
            const user = {
                name: 'Token Invalidation User',
                email: 'tokeninvalidation@example.com',
                password: 'Password123!'
            };

            const registerRes = await request(app)
                .post('/api/v1/auth/register')
                .send(user);

            const accessToken = registerRes.body.data.tokens.accessToken;
            const refreshToken = registerRes.body.data.tokens.refreshToken;

            // Logout the user
            await request(app)
                .post('/api/v1/auth/logout')
                .set('Authorization', `Bearer ${accessToken}`)
                .set('Cookie', `refreshToken=${refreshToken}`);

            // Try to refresh token after logout - should fail
            const refreshResponse = await request(app)
                .post('/api/v1/auth/refresh')
                .send({ refreshToken });

            expect(refreshResponse.statusCode).toBe(401);
            expect(refreshResponse.body.status).toBe('fail');
        });

        test('should clear cookies on logout', async () => {
            const user = {
                name: 'Cookie Clear User',
                email: 'cookieclear@example.com',
                password: 'Password123!'
            };

            const registerRes = await request(app)
                .post('/api/v1/auth/register')
                .send(user);

            const accessToken = registerRes.body.data.tokens.accessToken;

            const response = await request(app)
                .post('/api/v1/auth/logout')
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.statusCode).toBe(200);
            // Check that cookies are being cleared (set to empty with past expiry)
            const cookies = response.headers['set-cookie'];
            if (cookies) {
                const accessTokenCookie = cookies.find(c => c.startsWith('accessToken='));
                const refreshTokenCookie = cookies.find(c => c.startsWith('refreshToken='));

                if (accessTokenCookie) {
                    expect(accessTokenCookie).toContain('accessToken=;');
                }
                if (refreshTokenCookie) {
                    expect(refreshTokenCookie).toContain('refreshToken=;');
                }
            }
        });
    });

    // Test Logout All Devices
    describe('POST /api/v1/auth/logout-all', () => {
        test('should logout from all devices successfully', async () => {
            const user = {
                name: 'Logout All User',
                email: 'logoutall@example.com',
                password: 'Password123!'
            };

            const registerRes = await request(app)
                .post('/api/v1/auth/register')
                .send(user);

            const accessToken = registerRes.body.data.tokens.accessToken;

            const response = await request(app)
                .post('/api/v1/auth/logout-all')
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.statusCode).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.message).toBe('Logged out from all devices');
        });

        test('should return 401 without token', async () => {
            const response = await request(app)
                .post('/api/v1/auth/logout-all');

            expect(response.statusCode).toBe(401);
            expect(response.body.status).toBe('fail');
        });

        test('should return 401 with invalid token', async () => {
            const response = await request(app)
                .post('/api/v1/auth/logout-all')
                .set('Authorization', 'Bearer invalid-token');

            expect(response.statusCode).toBe(401);
            expect(response.body.status).toBe('fail');
        });

        test('should invalidate all refresh tokens after logout-all', async () => {
            const user = {
                name: 'All Tokens User',
                email: 'alltokens@example.com',
                password: 'Password123!'
            };


            const registerRes = await request(app)
                .post('/api/v1/auth/register')
                .send(user);

            const firstRefreshToken = registerRes.body.data.tokens.refreshToken;


            const loginRes = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: user.email,
                    password: user.password
                });

            const accessToken = loginRes.body.data.tokens.accessToken;
            const secondRefreshToken = loginRes.body.data.tokens.refreshToken;


            await request(app)
                .post('/api/v1/auth/logout-all')
                .set('Authorization', `Bearer ${accessToken}`);

            const refreshRes1 = await request(app)
                .post('/api/v1/auth/refresh')
                .send({ refreshToken: firstRefreshToken });

            expect(refreshRes1.statusCode).toBe(401);
            expect(refreshRes1.body.status).toBe('fail');

            const refreshRes2 = await request(app)
                .post('/api/v1/auth/refresh')
                .send({ refreshToken: secondRefreshToken });

            expect(refreshRes2.statusCode).toBe(401);
            expect(refreshRes2.body.status).toBe('fail');
        });

        test('should clear cookies on logout-all', async () => {
            const user = {
                name: 'Cookie Clear All User',
                email: 'cookieclearall@example.com',
                password: 'Password123!'
            };

            const registerRes = await request(app)
                .post('/api/v1/auth/register')
                .send(user);

            const accessToken = registerRes.body.data.tokens.accessToken;

            const response = await request(app)
                .post('/api/v1/auth/logout-all')
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.statusCode).toBe(200);

            const cookies = response.headers['set-cookie'];
            if (cookies) {
                const accessTokenCookie = cookies.find(c => c.startsWith('accessToken='));
                const refreshTokenCookie = cookies.find(c => c.startsWith('refreshToken='));

                if (accessTokenCookie) {
                    expect(accessTokenCookie).toContain('accessToken=;');
                }
                if (refreshTokenCookie) {
                    expect(refreshTokenCookie).toContain('refreshToken=;');
                }
            }
        });
    });

})