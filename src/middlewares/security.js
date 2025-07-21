const logger = require("../utils/logger");

// Log security events
const logSecurityEvent = (event, req, additionalData = {}) => {
     logger.warn("🔐 Security Event:", {
          event,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          url: req.url,
          method: req.method,
          timestamp: new Date().toISOString(),
          ...additionalData
     });
};

// Log authentication attempts
const logAuthAttempt = (req, res, next) => {
     const originalSend = res.send;

     res.send = function (data) {
          const statusCode = res.statusCode;
          const parsedData = typeof data === 'string' ? JSON.parse(data) : data;

          if (statusCode === 401 || statusCode === 403) {
               logSecurityEvent('FAILED_AUTH', req, {
                    statusCode,
                    email: req.body?.email || 'unknown'
               });
          } else if (statusCode === 200 && req.path.includes('login')) {
               logger.info("✅ Successful login:", {
                    email: req.body?.email || 'unknown',
                    ip: req.ip,
                    timestamp: new Date().toISOString()
               });
          }

          originalSend.call(this, data);
     };

     next();
};

// Log rate limit hits
const logRateLimitHit = (req, res, next) => {
     const rateLimitRemaining = res.get('RateLimit-Remaining');

     if (rateLimitRemaining && parseInt(rateLimitRemaining) < 5) {
          logSecurityEvent('RATE_LIMIT_WARNING', req, {
               remaining: rateLimitRemaining,
               limit: res.get('RateLimit-Limit')
          });
     }

     next();
};

// Log sensitive operations
const logSensitiveOperation = (operation) => {
     return (req, res, next) => {
          logger.info(`🔒 Sensitive Operation: ${operation}`, {
               userId: req.user?.id || req.user?._id || 'anonymous',
               ip: req.ip,
               userAgent: req.get('User-Agent'),
               timestamp: new Date().toISOString()
          });
          next();
     };
};

module.exports = {
     logSecurityEvent,
     logAuthAttempt,
     logRateLimitHit,
     logSensitiveOperation
};
