module.exports = {
     // 🧪 Jest Configuration for ETrainer Backend Testing

     // Test environment setup
     testEnvironment: 'node',

     // Test file patterns
     testMatch: [
          '**/__tests__/**/*.js',
          '**/?(*.)+(spec|test).js'
     ],

     // Coverage configuration
     collectCoverageFrom: [
          'src/**/*.js',
          '!src/main.js',
          '!src/cron.js',
          '!**/node_modules/**'
     ],

     // Setup files
     setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],

     // Module paths
     testPathIgnorePatterns: [
          '/node_modules/',
          '/dist/',
          '__tests__/setup.js',
          '__tests__/run-phase2-tests.js'
     ],

     // Timeout for tests (important for database operations)
     testTimeout: 30000,

     // Clear mocks between tests
     clearMocks: true,

     // Coverage thresholds
     coverageThreshold: {
          global: {
               branches: 80,
               functions: 80,
               lines: 80,
               statements: 80
          }
     },

     // Verbose output
     verbose: true
}; 