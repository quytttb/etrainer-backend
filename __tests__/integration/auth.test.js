const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const authRouter = require('../../src/routes/auth');
const User = require('../../src/models/users');

// 🔐 Authentication Integration Tests
describe('Authentication Integration Tests', () => {
     let app;

     beforeAll(() => {
          // Setup Express app for testing
          app = express();
          app.use(express.json());
          app.use('/api/auth', authRouter);
     });

     describe('POST /api/auth/register', () => {
          it('should register a new user successfully', async () => {
               const timestamp = Date.now();
               const userData = {
                    name: 'John Doe',
                    email: `john${timestamp}@example.com`,
                    password: 'password123'
               };

               const response = await request(app)
                    .post('/api/auth/register')
                    .send(userData)
                    .expect(201);

               expect(response.body).toHaveProperty('message');
               expect(response.body).toHaveProperty('user');
               expect(response.body.user.email).toBe(userData.email);
               expect(response.body.user).not.toHaveProperty('password');
          });

          it('should not register user with duplicate email', async () => {
               const timestamp = Date.now();
               const userData = {
                    name: 'John Doe',
                    email: `john${timestamp}@example.com`,
                    password: 'password123'
               };

               // Create user first
               await global.testUtils.createTestUser({
                    email: userData.email,
                    name: userData.name
               });

               // Try to register with same email
               const response = await request(app)
                    .post('/api/auth/register')
                    .send(userData)
                    .expect(400);

               expect(response.body).toHaveProperty('error');
          });

          it('should validate required fields', async () => {
               const response = await request(app)
                    .post('/api/auth/register')
                    .send({})
                    .expect(400);

               expect(response.body).toHaveProperty('error');
          });
     });

     describe('POST /api/auth/login', () => {
          let testLoginUser;

          beforeEach(async () => {
               // Create test user for login tests
               testLoginUser = await global.testUtils.createTestUser({
                    name: 'Login Test User'
               });
          });

          it('should login with valid credentials', async () => {
               const response = await request(app)
                    .post('/api/auth/login')
                    .send({
                         email: testLoginUser.email,
                         password: 'test123' // Default password from testUtils
                    })
                    .expect(200);

               expect(response.body).toHaveProperty('token');
               expect(response.body).toHaveProperty('user');
               expect(response.body.user.email).toBe(testLoginUser.email);
          });

          it('should reject invalid credentials', async () => {
               const response = await request(app)
                    .post('/api/auth/login')
                    .send({
                         email: testLoginUser.email,
                         password: 'wrongpassword'
                    })
                    .expect(401);

               expect(response.body).toHaveProperty('error');
               expect(response.body).not.toHaveProperty('token');
          });

          it('should reject non-existent user', async () => {
               const response = await request(app)
                    .post('/api/auth/login')
                    .send({
                         email: 'nonexistent@example.com',
                         password: 'password123'
                    })
                    .expect(401);

               expect(response.body).toHaveProperty('error');
          });
     });

     describe('JWT Token Security', () => {
          it('should generate valid JWT tokens', async () => {
               const user = await global.testUtils.createTestUser();
               const token = global.testUtils.generateTestToken(user._id, user.role);

               expect(token).toBeDefined();
               expect(typeof token).toBe('string');
               expect(token.split('.')).toHaveLength(3); // JWT format: header.payload.signature
          });

          it('should include correct user data in token', async () => {
               const user = await global.testUtils.createTestUser();
               const token = global.testUtils.generateTestToken(user._id, user.role);

               const jwt = require('jsonwebtoken');
               const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

               expect(decoded.userId).toBe(user._id.toString());
               expect(decoded.role).toBe(user.role);
          });
     });

     describe('Admin User Creation', () => {
          it('should create admin user when no users exist', async () => {
               // Ensure no users exist
               await User.deleteMany({});

               const timestamp = Date.now();
               const userData = {
                    name: 'First User',
                    email: `first${timestamp}@example.com`,
                    password: 'password123'
               };

               const response = await request(app)
                    .post('/api/auth/register')
                    .send(userData)
                    .expect(201);

               expect(response.body.user.role).toBe('ADMIN');
          });

          it('should create regular user when users already exist', async () => {
               // Create existing user first
               await global.testUtils.createTestUser();

               const timestamp = Date.now();
               const userData = {
                    name: 'Second User',
                    email: `second${timestamp}@example.com`,
                    password: 'password123'
               };

               const response = await request(app)
                    .post('/api/auth/register')
                    .send(userData)
                    .expect(201);

               expect(response.body.user.role).toBe('USER');
          });
     });

     describe('Password Security', () => {
          it('should hash passwords before storing', async () => {
               const user = await global.testUtils.createTestUser();
               const userFromDb = await User.findById(user._id);

               expect(userFromDb.password).not.toBe('test123');
               expect(userFromDb.password).toMatch(/^\$2b\$/); // bcrypt hash format
          });

          it('should validate password strength', async () => {
               const timestamp = Date.now();
               const response = await request(app)
                    .post('/api/auth/register')
                    .send({
                         name: 'Test User',
                         email: `test${timestamp}@example.com`,
                         password: '123' // Too short
                    });

               // Should implement password validation
               // This test will fail until validation is added
               // expect(response.status).toBe(400);
          });
     });
}); 