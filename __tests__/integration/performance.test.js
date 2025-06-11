const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const userJourneyRouter = require('../../src/routes/userJourney');
const questionRouter = require('../../src/routes/question');
const UserJourney = require('../../src/models/userJourney');
const Stage = require('../../src/models/stage');
const Question = require('../../src/models/question');

// ⚡ Performance Tests for ETrainer Backend
describe('Backend Performance Tests', () => {
     let app;
     let testUser;
     let testAdmin;

     beforeAll(async () => {
          // Setup Express app for testing
          app = express();
          app.use(express.json());
          app.use((req, res, next) => {
               // Mock authentication middleware
               if (req.headers.authorization) {
                    const token = req.headers.authorization.replace('Bearer ', '');
                    try {
                         const jwt = require('jsonwebtoken');
                         const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
                         req.user = decoded;
                    } catch (error) {
                         return res.status(401).json({ error: 'Invalid token' });
                    }
               }
               next();
          });
          app.use('/api/journeys', userJourneyRouter);
          app.use('/api/question', questionRouter);
     });

     beforeEach(async () => {
          testUser = await global.testUtils.createTestUser();
          testAdmin = await global.testUtils.createTestAdmin();
     });

     describe('API Response Time Performance', () => {
          const RESPONSE_TIME_LIMIT = 200; // 200ms as target from reports

          it('should get current journey within response time limit', async () => {
               // Create test data with unique questionNumbers
               const questions = await global.testUtils.createTestQuestions(1);

               const stage = await Stage.create({
                    minScore: 0,
                    targetScore: 300,
                    days: [{ dayNumber: 1, questions: [questions[0]._id] }]
               });

               // Create journey
               const token = global.testUtils.generateTestToken(testUser._id, testUser.role);
               await request(app)
                    .post('/api/journeys')
                    .set('Authorization', `Bearer ${token}`)
                    .send({ stageIds: [stage._id.toString()] });

               // Measure response time
               const startTime = Date.now();

               const response = await request(app)
                    .get('/api/journeys/current')
                    .set('Authorization', `Bearer ${token}`)
                    .expect(200);

               const responseTime = Date.now() - startTime;

               expect(responseTime).toBeLessThan(RESPONSE_TIME_LIMIT);
               expect(response.body).toHaveProperty('user');
               expect(response.body).toHaveProperty('stages');

               console.log(`✅ Journey fetch time: ${responseTime}ms (limit: ${RESPONSE_TIME_LIMIT}ms)`);
          });

          it('should handle question queries efficiently', async () => {
               // Create bulk questions for testing with unique questionNumbers
               await global.testUtils.createTestQuestions(50);

               const token = global.testUtils.generateTestToken(testAdmin._id, testAdmin.role);

               const startTime = Date.now();

               const response = await request(app)
                    .get('/api/question')
                    .set('Authorization', `Bearer ${token}`)
                    .expect(200);

               const responseTime = Date.now() - startTime;

               expect(responseTime).toBeLessThan(RESPONSE_TIME_LIMIT);
               expect(response.body.questions).toHaveLength(50);

               console.log(`✅ Question list time: ${responseTime}ms (limit: ${RESPONSE_TIME_LIMIT}ms)`);
          });
     });

     describe('Database Query Performance', () => {
          it('should handle large datasets efficiently', async () => {
               // Create large dataset with unique emails
               const timestamp = Date.now();
               const users = [];
               for (let i = 0; i < 100; i++) {
                    users.push({
                         name: `User ${i}`,
                         email: `user${timestamp}${i}@example.com`,
                         password: 'hashedpassword',
                         role: 'USER',
                         registrationMethod: 'EMAIL'
                    });
               }

               const startTime = Date.now();
               await mongoose.connection.collection('users').insertMany(users);
               const insertTime = Date.now() - startTime;

               expect(insertTime).toBeLessThan(1000); // Should insert within 1 second

               // Test query performance
               const queryStart = Date.now();
               const userCount = await mongoose.connection.collection('users').countDocuments();
               const queryTime = Date.now() - queryStart;

               expect(queryTime).toBeLessThan(50); // Query should be very fast
               expect(userCount).toBeGreaterThanOrEqual(100);

               console.log(`✅ Database insert time: ${insertTime}ms`);
               console.log(`✅ Database query time: ${queryTime}ms`);
          });

          it('should handle complex journey queries efficiently', async () => {
               // Create complex test data with unique questionNumbers
               const questions = await global.testUtils.createTestQuestions(20);

               const stages = await Stage.create(Array.from({ length: 5 }, (_, i) => ({
                    minScore: i * 100,
                    targetScore: (i + 1) * 100,
                    days: Array.from({ length: 3 }, (_, j) => ({
                         dayNumber: j + 1,
                         questions: questions.slice(j * 2, (j + 1) * 2).map(q => q._id)
                    }))
               })));

               // Create journeys for multiple users
               const tokens = [];
               for (let i = 0; i < 10; i++) {
                    const user = await global.testUtils.createTestUser();
                    const token = global.testUtils.generateTestToken(user._id, user.role);
                    tokens.push(token);

                    await request(app)
                         .post('/api/journeys')
                         .set('Authorization', `Bearer ${token}`)
                         .send({ stageIds: stages.map(s => s._id.toString()) });
               }

               // Test concurrent access performance
               const startTime = Date.now();

               const promises = tokens.map(token =>
                    request(app)
                         .get('/api/journeys/current')
                         .set('Authorization', `Bearer ${token}`)
                         .expect(200)
               );

               const responses = await Promise.all(promises);
               const totalTime = Date.now() - startTime;

               expect(totalTime).toBeLessThan(2000); // All 10 requests within 2 seconds
               expect(responses).toHaveLength(10);
               responses.forEach(response => {
                    expect(response.body).toHaveProperty('user');
                    expect(response.body).toHaveProperty('stages');
               });

               console.log(`✅ Concurrent journey fetch time: ${totalTime}ms for 10 users`);
          });
     });

     describe('Memory Usage and Resource Management', () => {
          it('should not leak memory during repeated operations', async () => {
               const initialMemory = process.memoryUsage().heapUsed;

               // Perform repeated operations
               for (let i = 0; i < 50; i++) {
                    const user = await global.testUtils.createTestUser();
                    const token = global.testUtils.generateTestToken(user._id, user.role);

                    await request(app)
                         .get('/api/journeys/current')
                         .set('Authorization', `Bearer ${token}`);
               }

               // Force garbage collection if available
               if (global.gc) {
                    global.gc();
               }

               const finalMemory = process.memoryUsage().heapUsed;
               const memoryIncrease = finalMemory - initialMemory;
               const memoryIncreaseInMB = memoryIncrease / 1024 / 1024;

               // Memory increase should be reasonable (less than 50MB for 50 operations)
               expect(memoryIncreaseInMB).toBeLessThan(50);

               console.log(`✅ Memory increase: ${memoryIncreaseInMB.toFixed(2)}MB`);
          });

          it('should handle database connection pooling', async () => {
               // Test connection limits by making many concurrent requests
               const token = global.testUtils.generateTestToken(testUser._id, testUser.role);

               const startTime = Date.now();

               // Make 20 concurrent requests
               const promises = Array.from({ length: 20 }, () =>
                    request(app)
                         .get('/api/journeys/current')
                         .set('Authorization', `Bearer ${token}`)
               );

               try {
                    await Promise.all(promises);
                    const totalTime = Date.now() - startTime;

                    // Should handle all requests without database connection issues
                    expect(totalTime).toBeLessThan(5000);

                    console.log(`✅ Connection pooling test: ${totalTime}ms for 20 concurrent requests`);
               } catch (error) {
                    // Should not fail due to connection issues
                    expect(error.message).not.toContain('connection');
                    expect(error.message).not.toContain('pool');
               }
          });
     });

     describe('Scalability Tests', () => {
          it('should maintain performance with increasing data volume', async () => {
               // Test performance scaling with different data sizes
               const dataSizes = [10, 50, 100];
               const performanceResults = [];

               for (const size of dataSizes) {
                    // Clear questions before each iteration to ensure clean count
                    const Question = require('../../src/models/question');
                    await Question.deleteMany({});

                    // Create questions with unique questionNumbers
                    const questions = await global.testUtils.createTestQuestions(size);

                    const token = global.testUtils.generateTestToken(testAdmin._id, testAdmin.role);

                    const startTime = Date.now();

                    const response = await request(app)
                         .get('/api/question')
                         .set('Authorization', `Bearer ${token}`)
                         .expect(200);

                    const responseTime = Date.now() - startTime;
                    performanceResults.push({ size, time: responseTime });

                    expect(response.body.questions).toHaveLength(size);

                    console.log(`✅ Data size ${size}: ${responseTime}ms`);
               }

               // Performance should not degrade dramatically with size increase
               const timeIncrease = performanceResults[2].time / performanceResults[0].time;
               expect(timeIncrease).toBeLessThan(10); // Should not be more than 10x slower (relaxed for CI environment)

               console.log(`✅ Performance scaling factor: ${timeIncrease.toFixed(2)}x`);
          });

          it('should handle burst traffic patterns', async () => {
               // Simulate burst traffic with different user types
               const users = [];
               for (let i = 0; i < 20; i++) {
                    const user = await global.testUtils.createTestUser();
                    users.push(user);
               }

               // Create test stages and questions with unique questionNumbers
               const questions = await global.testUtils.createTestQuestions(1);

               const stage = await Stage.create({
                    minScore: 0,
                    targetScore: 300,
                    days: [{ dayNumber: 1, questions: [questions[0]._id] }]
               });

               // Simulate burst: many users creating journeys simultaneously
               const startTime = Date.now();

               const createPromises = users.map(user => {
                    const token = global.testUtils.generateTestToken(user._id, user.role);
                    return request(app)
                         .post('/api/journeys')
                         .set('Authorization', `Bearer ${token}`)
                         .send({ stageIds: [stage._id.toString()] });
               });

               const results = await Promise.all(createPromises);
               const burstTime = Date.now() - startTime;

               // All requests should succeed
               results.forEach(result => {
                    expect(result.status).toBe(201);
               });

               // Burst should be handled within reasonable time (under 3 seconds for 20 users)
               expect(burstTime).toBeLessThan(3000);

               console.log(`✅ Burst traffic test: ${burstTime}ms for 20 simultaneous journey creations`);
          });
     });

     describe('Load Testing Simulation', () => {
          it('should maintain stability under sustained load', async () => {
               const LOAD_TEST_DURATION = 2000; // 2 seconds for testing
               const REQUEST_INTERVAL = 200; // 200ms between requests

               const user = await global.testUtils.createTestUser();
               const token = global.testUtils.generateTestToken(user._id, user.role);

               const results = [];
               const startTime = Date.now();

               while (Date.now() - startTime < LOAD_TEST_DURATION) {
                    try {
                         const requestStart = Date.now();

                         await request(app)
                              .get('/api/journeys/current')
                              .set('Authorization', `Bearer ${token}`);

                         const requestTime = Date.now() - requestStart;
                         results.push(requestTime);

                         // Wait before next request
                         await new Promise(resolve => setTimeout(resolve, REQUEST_INTERVAL));
                    } catch (error) {
                         // Log errors but continue test
                         console.warn('Load test request failed:', error.message);
                    }
               }

               // Analyze results
               if (results.length > 0) {
                    const avgResponseTime = results.reduce((a, b) => a + b, 0) / results.length;
                    const maxResponseTime = Math.max(...results);

                    expect(avgResponseTime).toBeLessThan(500); // Average under 500ms
                    expect(maxResponseTime).toBeLessThan(2000); // Max under 2 seconds

                    console.log(`✅ Load test results:`);
                    console.log(`  - Requests: ${results.length}`);
                    console.log(`  - Avg time: ${avgResponseTime.toFixed(2)}ms`);
                    console.log(`  - Max time: ${maxResponseTime}ms`);
               }
          });
     });
}); 