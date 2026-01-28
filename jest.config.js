module.exports = {
    testEnvironment: 'node',
    setupFiles: ['<rootDir>/src/tests/testEnv.js'],
    setupFilesAfterEnv: ['<rootDir>/src/tests/setup.js'],

    testMatch: [
        '<rootDir>/src/tests/**/*test.js'
    ],

    testTimeout: 30000,

    verbose: true,
    forceExit: true,
    clearMocks: true,

};