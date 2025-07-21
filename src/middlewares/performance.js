const dbOptimization = require('../utils/dbOptimization');
const { validate, schemas } = require('./validation');
const Joi = require('joi');

// Pagination middleware
const paginate = (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  // Validate pagination parameters
  const paginationSchema = Joi.object({
    page: Joi.number().integer().min(1).max(1000).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
  });

  const { error, value } = paginationSchema.validate({ page, limit });
  if (error) {
    return res.status(400).json({
      error: 'Invalid pagination parameters',
      message: error.details[0].message
    });
  }

  // Add pagination info to request
  req.pagination = dbOptimization.paginate(value.page, value.limit);
  req.paginationMeta = {
    page: value.page,
    limit: value.limit
  };

  next();
};

// Response formatting for paginated results
const formatPaginatedResponse = (data, total, req) => {
  const { page, limit } = req.paginationMeta;
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: total,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null
    }
  };
};

// Query optimization middleware
const optimizeQuery = (req, res, next) => {
  // Add lean() option for better performance
  req.queryOptions = {
    lean: true, // Return plain objects instead of Mongoose documents
    maxTimeMS: 10000, // 10 second timeout
  };

  // Add sorting options
  if (req.query.sort) {
    const sortFields = req.query.sort.split(',');
    const sortObject = {};

    sortFields.forEach(field => {
      if (field.startsWith('-')) {
        sortObject[field.substring(1)] = -1;
      } else {
        sortObject[field] = 1;
      }
    });

    req.queryOptions.sort = sortObject;
  }

  // Add field selection
  if (req.query.fields) {
    req.queryOptions.select = req.query.fields.replace(/,/g, ' ');
  }

  next();
};

// Performance monitoring middleware
const performanceMonitor = (req, res, next) => {
  const startTime = Date.now();

  // Only set header if response hasn't been sent
  res.on('finish', () => {
    const duration = Date.now() - startTime;

    // Log slow queries (> 1 second)
    if (duration > 1000) {
      console.warn(`🐌 Slow query detected: ${req.method} ${req.originalUrl} - ${duration}ms`);
    }
  });

  next();
};

module.exports = {
  paginate,
  formatPaginatedResponse,
  optimizeQuery,
  performanceMonitor
};
