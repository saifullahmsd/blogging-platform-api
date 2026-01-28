/**
 * Test Environment Variables
 */

process.env.NODE_ENV = 'test';
process.env.PORT = '5001';
process.env.LOG_LEVEL = 'error';

// Temporary MONGO_URI (will be replaced by Memory Server)
process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/testdb';


process.env.JWT_ACCESS_SECRET = 'test-access-secret-key-for-testing-minimum-32-chars';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing-minimum-32-chars';
process.env.JWT_ACCESS_EXPIRY = '15m';
process.env.JWT_REFRESH_EXPIRY = '7d';

// Security Configuration
process.env.ALLOWED_ORIGINS = 'http://localhost:3000';
process.env.BCRYPT_ROUNDS = '4';
process.env.MAX_LOGIN_ATTEMPTS = '5';
process.env.LOCK_TIME = '2h';

// Cloudinary Configuration 
process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
process.env.CLOUDINARY_API_KEY = 'test-api-key';
process.env.CLOUDINARY_API_SECRET = 'test-api-secret';

// Upload Configuration
process.env.MAX_FILE_SIZE = '5242880';
process.env.MAX_AVATAR_SIZE = '2097152';
process.env.ALLOWED_IMAGE_TYPES = 'image/jpeg,image/png,image/webp,image/gif';
process.env.CLOUDINARY_AVATAR_FOLDER = 'test/avatars';
process.env.CLOUDINARY_POST_FOLDER = 'test/posts';
process.env.CLOUDINARY_CONTENT_FOLDER = 'test/content';
