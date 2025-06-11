const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

// 🧪 Backend Test Setup Configuration
let mongoServer;

// Setup before all tests
beforeAll(async () => {
     try {
          // Create in-memory MongoDB instance
          mongoServer = await MongoMemoryServer.create();
          const mongoUri = mongoServer.getUri();

          // Connect to in-memory database
          await mongoose.connect(mongoUri, {
               useNewUrlParser: true,
               useUnifiedTopology: true,
          });

          console.log('✅ Connected to in-memory MongoDB for testing');
     } catch (error) {
          console.error('❌ Failed to setup test database:', error);
          throw error;
     }
});

// Cleanup after each test
afterEach(async () => {
     try {
          // Clear all collections
          const collections = mongoose.connection.collections;
          for (const key in collections) {
               await collections[key].deleteMany({});
          }
     } catch (error) {
          console.error('❌ Failed to cleanup test data:', error);
     }
});

// Teardown after all tests
afterAll(async () => {
     try {
          // Close database connection
          await mongoose.connection.dropDatabase();
          await mongoose.connection.close();

          // Stop MongoDB memory server
          if (mongoServer) {
               await mongoServer.stop();
          }

          console.log('✅ Test database cleanup completed');
     } catch (error) {
          console.error('❌ Failed to teardown test database:', error);
     }
});

// Test utilities
global.testUtils = {
     // Create test user
     createTestUser: async (userData = {}) => {
          const User = require('../src/models/users');
          const bcrypt = require('bcrypt');

          const timestamp = Date.now();
          const randomSuffix = Math.floor(Math.random() * 1000);

          const defaultUser = {
               name: 'Test User',
               email: `test${timestamp}${randomSuffix}@example.com`,
               password: await bcrypt.hash('test123', 10),
               role: 'USER',
               registrationMethod: 'EMAIL',
               gender: 'OTHER'
          };

          return await User.create({ ...defaultUser, ...userData });
     },

     // Create test admin
     createTestAdmin: async (userData = {}) => {
          const timestamp = Date.now();
          const randomSuffix = Math.floor(Math.random() * 1000);

          return await global.testUtils.createTestUser({
               name: 'Test Admin',
               email: `admin${timestamp}${randomSuffix}@example.com`,
               role: 'ADMIN',
               ...userData
          });
     },

     // Generate JWT token  
     generateTestToken: (userId, role = 'USER') => {
          const jwt = require('jsonwebtoken');
          return jwt.sign(
               { id: userId, userId, role },
               process.env.JWT_SECRET_KEY || 'test_secret',
               { expiresIn: '1h' }
          );
     },

     // Create unique test questions
     createTestQuestions: async (count = 3) => {
          const Question = require('../src/models/question');
          const LESSON_TYPE = require('../src/constants/lesson');

          const questions = [];
          const timestamp = Date.now();
          const randomBase = Math.floor(Math.random() * 100000);

          for (let i = 0; i < count; i++) {
               // Generate unique questionNumber to avoid duplicates
               const uniqueQuestionNumber = randomBase + timestamp + i * 1000;

               const questionData = {
                    type: i === 0 ? 'ASK_AND_ANSWER' : i === 1 ? 'CONVERSATION_PIECE' : 'READ_AND_UNDERSTAND',
                    question: `Test question ${i + 1}`,
                    answers: [
                         { answer: `Correct answer ${i + 1}`, isCorrect: true },
                         { answer: `Wrong answer ${i + 1}`, isCorrect: false }
                    ]
               };

               if (questionData.type === 'CONVERSATION_PIECE') {
                    questionData.questions = [
                         {
                              question: `Sub question ${i + 1}`,
                              answers: [
                                   { answer: `Correct sub answer ${i + 1}`, isCorrect: true },
                                   { answer: `Wrong sub answer ${i + 1}`, isCorrect: false }
                              ]
                         }
                    ];
                    delete questionData.answers;
               }

               // Create question without questionNumber first, then update
               const question = new Question(questionData);
               question.questionNumber = uniqueQuestionNumber; // Bypass validation and pre-save hook
               await question.save();
               questions.push(question);
          }

          return questions;
     },

     // Create unique test stages
     createTestStages: async (questionsArray = []) => {
          const Stage = require('../src/models/stage');

          if (questionsArray.length === 0) {
               questionsArray = await global.testUtils.createTestQuestions(3);
          }

          const stages = [
               {
                    minScore: 0,
                    targetScore: 300,
                    days: [
                         {
                              dayNumber: 1,
                              questions: [questionsArray[0]._id, questionsArray[1]._id]
                         },
                         {
                              dayNumber: 2,
                              questions: [questionsArray[2]._id]
                         }
                    ]
               },
               {
                    minScore: 300,
                    targetScore: 600,
                    days: [
                         {
                              dayNumber: 1,
                              questions: [questionsArray[0]._id]
                         }
                    ]
               }
          ];

          return await Stage.create(stages);
     }
};

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET_KEY = 'test_secret_key_for_testing';
process.env.PORT = '0'; // Use random available port

console.log('🚀 Backend test environment initialized'); 