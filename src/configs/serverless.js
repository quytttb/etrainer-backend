// Serverless optimization for Vercel/Netlify deployment
const isServerless = process.env.VERCEL || process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME;

if (isServerless) {
     // Disable clustering in serverless environments
     process.env.ENABLE_CLUSTERING = 'false';

     // Optimize for cold starts
     console.log('🔧 Serverless environment detected - optimizing...');

     // Warm-up function
     global.keepWarm = setInterval(() => {
          // Keep serverless function warm
          if (process.env.NODE_ENV === 'production') {
               const http = require('http');
               http.get(process.env.VERCEL_URL || 'http://localhost:8080/health')
                    .on('error', () => { }); // Ignore errors
          }
     }, 14 * 60 * 1000); // Every 14 minutes
}

// Connection pooling optimization for serverless
if (isServerless) {
     // Reduce MongoDB connection pool size
     process.env.MONGODB_MAX_POOL_SIZE = '5';
     process.env.MONGODB_MIN_POOL_SIZE = '1';

     // Disable some heavy features
     process.env.AGENDA_PROCESS_EVERY = '30 seconds';
     process.env.AGENDA_MAX_CONCURRENCY = '3';
}

module.exports = {
     isServerless,
     optimizeForServerless: () => {
          if (isServerless) {
               console.log('✅ Serverless optimizations applied');
          }
     }
};
