const Joi = require('joi');

// Validation middleware factory
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error } = schema.validate(req[property], {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return res.status(400).json({
        error: 'Validation Error',
        message: errorMessage,
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    next();
  };
};

// Common validation schemas
const schemas = {
  // MongoDB ObjectId validation
  mongoId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),

  // Email validation
  email: Joi.string().email().required(),

  // Password validation
  password: Joi.string().min(6).max(128).required(),

  // Pagination
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
  }),

  // User registration
  userRegistration: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(128).required(),
    fullName: Joi.string().min(2).max(100).required(),
    phoneNumber: Joi.string().pattern(/^[0-9+\-\s()]+$/).optional()
  }),

  // User login
  userLogin: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  // Practice submission
  practiceSubmission: Joi.object({
    questionId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
    selectedAnswer: Joi.string().required(),
    timeSpent: Joi.number().min(0).max(300000).required(), // max 5 minutes per question
    isCorrect: Joi.boolean().required()
  }),

  // Update user profile
  updateProfile: Joi.object({
    fullName: Joi.string().min(2).max(100).optional(),
    phoneNumber: Joi.string().pattern(/^[0-9+\-\s()]+$/).optional(),
    avatar: Joi.string().uri().optional(),
    learningGoal: Joi.string().valid('beginner', 'intermediate', 'advanced').optional()
  }),

  // Question creation/update
  question: Joi.object({
    questionText: Joi.string().min(10).max(1000).required(),
    options: Joi.array().items(Joi.string().min(1).max(200)).min(2).max(6).required(),
    correctAnswer: Joi.string().required(),
    explanation: Joi.string().max(500).optional(),
    difficulty: Joi.string().valid('easy', 'medium', 'hard').required(),
    category: Joi.string().min(2).max(50).required(),
    tags: Joi.array().items(Joi.string().max(30)).max(10).optional()
  }),

  // Exam submission
  examSubmission: Joi.object({
    examId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
    answers: Joi.array().items(
      Joi.object({
        questionId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
        selectedAnswer: Joi.string().required(),
        timeSpent: Joi.number().min(0).max(300000).required()
      })
    ).min(1).required(),
    totalTimeSpent: Joi.number().min(0).required()
  }),

  // Journey operation
  journeyOperation: Joi.object({
    stageIndex: Joi.number().integer().min(0).max(10).required(),
    dayNumber: Joi.number().integer().min(1).max(30).optional(),
    score: Joi.number().min(0).max(100).optional()
  }),

  // Reminder creation
  reminder: Joi.object({
    hour: Joi.number().integer().min(0).max(23).required(),
    minute: Joi.number().integer().min(0).max(59).required(),
    isActive: Joi.boolean().default(true)
  })
};

// Sanitize input to prevent XSS
const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return obj.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    }
    if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        obj[key] = sanitize(obj[key]);
      }
    }
    return obj;
  };

  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);

  next();
};

module.exports = {
  validate,
  schemas,
  sanitizeInput
};
