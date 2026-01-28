
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const logger = require('../config/logger');

let mongoServer;

beforeAll(async () => {

    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    process.env.MONGO_URI = mongoUri;
    await mongoose.connect(mongoUri);

    logger.info(`MongoDb memory server started: ${mongoUri}`);

}, 60000);

afterEach(async () => {
    if (mongoose.connection.readyState === 1) {
        const collections = mongoose.connection.collections;
        for (let key in collections) {
            await collections[key].deleteMany({})
        }
    }
});

afterAll(async () => {
    if (mongoose.connection.readyState === 1) {
        await mongoose.disconnect();

        if (mongoServer) {
            await mongoServer.stop();
        }
    }
})