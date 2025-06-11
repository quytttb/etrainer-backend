const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const userJourneyRouter = require('../../src/routes/userJourney');
const { checkLogin } = require('../../src/middlewares/auth');
const UserJourney = require('../../src/models/userJourney');
const Stage = require('../../src/models/stage');
const Question = require('../../src/models/question');

// 🎯 Journey System Integration Tests
describe('User Journey Integration Tests', () => {
     let app;
     let testUser;
     let testAdmin;
     let testStages;
     let testQuestions;

     beforeAll(async () => {
          // Setup Express app for testing
          app = express();
          app.use(express.json());
          app.use((req, res, next) => {
               // Mock authentication middleware for testing
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
     });

     beforeEach(async () => {
          // Create test users
          testUser = await global.testUtils.createTestUser();
          testAdmin = await global.testUtils.createTestAdmin();

          // Create test questions with unique questionNumbers
          testQuestions = await global.testUtils.createTestQuestions(3);

          // Create test stages using the unique questions
          testStages = await global.testUtils.createTestStages(testQuestions);
     });

     describe('POST /api/journeys', () => {
          it('should create a new journey successfully', async () => {
               const token = global.testUtils.generateTestToken(testUser._id, testUser.role);

               const journeyData = {
                    stageIds: [testStages[0]._id.toString(), testStages[1]._id.toString()]
               };

               const response = await request(app)
                    .post('/api/journeys')
                    .set('Authorization', `Bearer ${token}`)
                    .send(journeyData)
                    .expect(201);

               expect(response.body).toHaveProperty('message');
               expect(response.body).toHaveProperty('journey');
               expect(response.body.journey.user).toBe(testUser._id.toString());
               expect(response.body.journey.stages).toHaveLength(2);
               expect(response.body.journey.state).toBe('IN_PROGRESS');
               expect(response.body.journey.currentStageIndex).toBe(0);
          });

          it('should reject journey creation without authentication', async () => {
               const journeyData = {
                    stageIds: [testStages[0]._id.toString()]
               };

               await request(app)
                    .post('/api/journeys')
                    .send(journeyData)
                    .expect(401);
          });

          it('should replace existing active journey', async () => {
               const token = global.testUtils.generateTestToken(testUser._id, testUser.role);

               // Create first journey
               await request(app)
                    .post('/api/journeys')
                    .set('Authorization', `Bearer ${token}`)
                    .send({ stageIds: [testStages[0]._id.toString()] })
                    .expect(201);

               // Create second journey (should replace first)
               const response = await request(app)
                    .post('/api/journeys')
                    .set('Authorization', `Bearer ${token}`)
                    .send({ stageIds: [testStages[1]._id.toString()] })
                    .expect(201);

               // Check that old journey was marked as REPLACED
               const oldJourney = await UserJourney.findOne({
                    user: testUser._id,
                    state: 'REPLACED'
               });
               expect(oldJourney).toBeTruthy();
               expect(oldJourney.replacedAt).toBeTruthy();
          });

          it('should validate stage IDs exist', async () => {
               const token = global.testUtils.generateTestToken(testUser._id, testUser.role);
               const nonExistentId = new mongoose.Types.ObjectId();

               const response = await request(app)
                    .post('/api/journeys')
                    .set('Authorization', `Bearer ${token}`)
                    .send({ stageIds: [nonExistentId.toString()] })
                    .expect(400);

               expect(response.body).toHaveProperty('error');
          });
     });

     describe('GET /api/journeys/current', () => {
          let journey;

          beforeEach(async () => {
               const token = global.testUtils.generateTestToken(testUser._id, testUser.role);

               const response = await request(app)
                    .post('/api/journeys')
                    .set('Authorization', `Bearer ${token}`)
                    .send({ stageIds: [testStages[0]._id.toString()] });

               journey = response.body.journey;
          });

          it('should get current journey with populated data', async () => {
               const token = global.testUtils.generateTestToken(testUser._id, testUser.role);

               const response = await request(app)
                    .get('/api/journeys/current')
                    .set('Authorization', `Bearer ${token}`)
                    .expect(200);

               expect(response.body).toHaveProperty('journey');
               expect(response.body.journey._id).toBe(journey._id);
               expect(response.body.journey.stages[0]).toHaveProperty('stageId');
               expect(response.body.journey.stages[0].days).toBeDefined();
          });

          it('should return 404 when no current journey exists', async () => {
               const newUser = await global.testUtils.createTestUser({ email: 'new@example.com' });
               const token = global.testUtils.generateTestToken(newUser._id, newUser.role);

               await request(app)
                    .get('/api/journeys/current')
                    .set('Authorization', `Bearer ${token}`)
                    .expect(404);
          });
     });

     describe('PUT /api/journeys/complete-day/:stageIndex/:dayNumber', () => {
          let journey;
          let token;

          beforeEach(async () => {
               token = global.testUtils.generateTestToken(testUser._id, testUser.role);

               const response = await request(app)
                    .post('/api/journeys')
                    .set('Authorization', `Bearer ${token}`)
                    .send({ stageIds: [testStages[0]._id.toString()] });

               journey = response.body.journey;
          });

          it('should complete a day successfully', async () => {
               const response = await request(app)
                    .put('/api/journeys/complete-day/0/1')
                    .set('Authorization', `Bearer ${token}`)
                    .send({ score: 85 })
                    .expect(200);

               expect(response.body.message).toContain('completed');
               expect(response.body.journey.stages[0].days[0].completed).toBe(true);
               expect(response.body.journey.stages[0].days[0].score).toBe(85);
          });

          it('should not complete day without starting it first', async () => {
               const response = await request(app)
                    .put('/api/journeys/complete-day/0/2')
                    .set('Authorization', `Bearer ${token}`)
                    .send({ score: 85 })
                    .expect(400);

               expect(response.body).toHaveProperty('error');
          });

          it('should validate score is a number', async () => {
               // First start the day
               await request(app)
                    .put('/api/journeys/start-next-day/0/1')
                    .set('Authorization', `Bearer ${token}`)
                    .expect(200);

               const response = await request(app)
                    .put('/api/journeys/complete-day/0/1')
                    .set('Authorization', `Bearer ${token}`)
                    .send({ score: 'invalid' })
                    .expect(400);

               expect(response.body).toHaveProperty('error');
          });
     });

     describe('PUT /api/journeys/start-next-day/:stageIndex/:dayNumber', () => {
          let journey;
          let token;

          beforeEach(async () => {
               token = global.testUtils.generateTestToken(testUser._id, testUser.role);

               const response = await request(app)
                    .post('/api/journeys')
                    .set('Authorization', `Bearer ${token}`)
                    .send({ stageIds: [testStages[0]._id.toString()] });

               journey = response.body.journey;
          });

          it('should start day 1 successfully', async () => {
               const response = await request(app)
                    .put('/api/journeys/start-next-day/0/1')
                    .set('Authorization', `Bearer ${token}`)
                    .expect(200);

               expect(response.body.message).toContain('started');
               expect(response.body.journey.stages[0].days[0].started).toBe(true);
               expect(response.body.journey.stages[0].days[0].startedAt).toBeDefined();
          });

          it('should not start day 2 before completing day 1', async () => {
               const response = await request(app)
                    .put('/api/journeys/start-next-day/0/2')
                    .set('Authorization', `Bearer ${token}`)
                    .expect(400);

               expect(response.body).toHaveProperty('error');
               expect(response.body.error).toContain('previous day');
          });

          it('should assign questions to day when started', async () => {
               const response = await request(app)
                    .put('/api/journeys/start-next-day/0/1')
                    .set('Authorization', `Bearer ${token}`)
                    .expect(200);

               const day = response.body.journey.stages[0].days[0];
               expect(day.questions).toBeDefined();
               expect(Array.isArray(day.questions)).toBe(true);
               expect(day.questions.length).toBeGreaterThan(0);
          });
     });

     describe('POST /api/journeys/skip-stage/:stageIndex', () => {
          let journey;
          let token;

          beforeEach(async () => {
               token = global.testUtils.generateTestToken(testUser._id, testUser.role);

               const response = await request(app)
                    .post('/api/journeys')
                    .set('Authorization', `Bearer ${token}`)
                    .send({ stageIds: [testStages[0]._id.toString(), testStages[1]._id.toString()] });

               journey = response.body.journey;
          });

          it('should skip current stage successfully', async () => {
               const response = await request(app)
                    .post('/api/journeys/skip-stage/0')
                    .set('Authorization', `Bearer ${token}`)
                    .expect(200);

               expect(response.body.message).toContain('skipped');
               expect(response.body.journey.stages[0].state).toBe('SKIPPED');
               expect(response.body.journey.currentStageIndex).toBe(1);
          });

          it('should not skip already completed stage', async () => {
               // Mark stage as completed first
               await UserJourney.findByIdAndUpdate(journey._id, {
                    'stages.0.state': 'COMPLETED'
               });

               const response = await request(app)
                    .post('/api/journeys/skip-stage/0')
                    .set('Authorization', `Bearer ${token}`)
                    .expect(400);

               expect(response.body).toHaveProperty('error');
          });
     });

     describe('Final Test Functionality', () => {
          let journey;
          let token;

          beforeEach(async () => {
               token = global.testUtils.generateTestToken(testUser._id, testUser.role);

               const response = await request(app)
                    .post('/api/journeys')
                    .set('Authorization', `Bearer ${token}`)
                    .send({ stageIds: [testStages[0]._id.toString()] });

               journey = response.body.journey;
          });

          it('should unlock final test after completing all days', async () => {
               // Start and complete all days in stage
               for (let i = 1; i <= testStages[0].days.length; i++) {
                    await request(app)
                         .put(`/api/journeys/start-next-day/0/${i}`)
                         .set('Authorization', `Bearer ${token}`)
                         .expect(200);

                    await request(app)
                         .put(`/api/journeys/complete-day/0/${i}`)
                         .set('Authorization', `Bearer ${token}`)
                         .send({ score: 85 })
                         .expect(200);
               }

               // Check if final test is unlocked
               const response = await request(app)
                    .get('/api/journeys/current')
                    .set('Authorization', `Bearer ${token}`)
                    .expect(200);

               expect(response.body.journey.stages[0].finalTest.unlocked).toBe(true);
          });

          it('should get final test questions', async () => {
               // Unlock final test first
               await UserJourney.findByIdAndUpdate(journey._id, {
                    'stages.0.finalTest.unlocked': true
               });

               const response = await request(app)
                    .get('/api/journeys/final-test/0')
                    .set('Authorization', `Bearer ${token}`)
                    .expect(200);

               expect(response.body).toHaveProperty('questions');
               expect(Array.isArray(response.body.questions)).toBe(true);
          });

          it('should submit final test successfully', async () => {
               // Unlock and start final test
               await UserJourney.findByIdAndUpdate(journey._id, {
                    'stages.0.finalTest.unlocked': true,
                    'stages.0.finalTest.started': true,
                    'stages.0.finalTest.startedAt': new Date()
               });

               const response = await request(app)
                    .put('/api/journeys/submit-final-test/0')
                    .set('Authorization', `Bearer ${token}`)
                    .send({
                         score: 75,
                         answers: [
                              { questionId: testQuestions[0]._id, userAnswer: 'My name is John' }
                         ]
                    })
                    .expect(200);

               expect(response.body.message).toContain('submitted');
               expect(response.body.journey.stages[0].finalTest.completed).toBe(true);
               expect(response.body.journey.stages[0].finalTest.score).toBe(75);
          });
     });

     describe('Progress Tracking', () => {
          let journey;
          let token;

          beforeEach(async () => {
               token = global.testUtils.generateTestToken(testUser._id, testUser.role);

               const response = await request(app)
                    .post('/api/journeys')
                    .set('Authorization', `Bearer ${token}`)
                    .send({ stageIds: [testStages[0]._id.toString()] });

               journey = response.body.journey;
          });

          it('should track journey progress correctly', async () => {
               const response = await request(app)
                    .get(`/api/journeys/progress/${testUser._id}`)
                    .set('Authorization', `Bearer ${global.testUtils.generateTestToken(testAdmin._id, testAdmin.role)}`)
                    .expect(200);

               expect(response.body).toHaveProperty('progress');
               expect(response.body.progress).toHaveProperty('totalStages');
               expect(response.body.progress).toHaveProperty('completedStages');
               expect(response.body.progress).toHaveProperty('currentStage');
          });

          it('should calculate stage completion percentage', async () => {
               // Complete first day
               await request(app)
                    .put('/api/journeys/start-next-day/0/1')
                    .set('Authorization', `Bearer ${token}`)
                    .expect(200);

               await request(app)
                    .put('/api/journeys/complete-day/0/1')
                    .set('Authorization', `Bearer ${token}`)
                    .send({ score: 85 })
                    .expect(200);

               const response = await request(app)
                    .get('/api/journeys/current')
                    .set('Authorization', `Bearer ${token}`)
                    .expect(200);

               const stage = response.body.journey.stages[0];
               const completedDays = stage.days.filter(day => day.completed).length;
               const totalDays = stage.days.length;
               const expectedProgress = Math.round((completedDays / totalDays) * 100);

               expect(completedDays).toBeGreaterThan(0);
               expect(expectedProgress).toBeGreaterThan(0);
          });
     });

     describe('Error Handling', () => {
          it('should handle invalid stage index', async () => {
               const token = global.testUtils.generateTestToken(testUser._id, testUser.role);

               await request(app)
                    .post('/api/journeys')
                    .set('Authorization', `Bearer ${token}`)
                    .send({ stageIds: [testStages[0]._id.toString()] });

               const response = await request(app)
                    .put('/api/journeys/start-next-day/999/1')
                    .set('Authorization', `Bearer ${token}`)
                    .expect(400);

               expect(response.body).toHaveProperty('error');
          });

          it('should handle invalid day number', async () => {
               const token = global.testUtils.generateTestToken(testUser._id, testUser.role);

               await request(app)
                    .post('/api/journeys')
                    .set('Authorization', `Bearer ${token}`)
                    .send({ stageIds: [testStages[0]._id.toString()] });

               const response = await request(app)
                    .put('/api/journeys/start-next-day/0/999')
                    .set('Authorization', `Bearer ${token}`)
                    .expect(400);

               expect(response.body).toHaveProperty('error');
          });

          it('should handle missing journey', async () => {
               const newUser = await global.testUtils.createTestUser({ email: 'new2@example.com' });
               const token = global.testUtils.generateTestToken(newUser._id, newUser.role);

               const response = await request(app)
                    .put('/api/journeys/start-next-day/0/1')
                    .set('Authorization', `Bearer ${token}`)
                    .expect(404);

               expect(response.body).toHaveProperty('error');
          });
     });
}); 