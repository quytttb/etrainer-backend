// Test endpoint to check environment variables (for debugging only)
app.get('/debug/env', (req, res) => {
  if (process.env.NODE_ENV !== 'production') {
    return res.status(403).json({ error: 'Debug endpoint disabled in production' });
  }

  // Only show if MONGODB_URI exists (but not the actual value for security)
  res.json({
    mongodb_uri_exists: !!process.env.MONGODB_URI,
    mongodb_uri_length: process.env.MONGODB_URI ? process.env.MONGODB_URI.length : 0,
    mongodb_uri_starts_with: process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 20) + '...' : 'Not found',
    jwt_secret_exists: !!process.env.JWT_SECRET_KEY,
    node_env: process.env.NODE_ENV,
    vercel_env: !!process.env.VERCEL
  });
});
