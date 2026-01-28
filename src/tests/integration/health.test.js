const request = require('supertest');
const app = require('../../api/app');

describe('Health Check Api', () => {

    test('GET / - should return API info', async () => {

        const response = await request(app).get('/');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Blogging Platform API');
        expect(response.body.version).toBe('1.0.0');
    });

    test('GET /random-route - should return 404', async () => {

        const response = await request(app).get('/this-route-does-not-exist');

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
    });
});
