const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

router.get('/debug', async (req, res) => {
  try {
    console.log('🔧 Debug endpoint called');
    console.log('🔧 Mongoose default bufferCommands:', mongoose.get('bufferCommands'));
    console.log('🔧 Connection state:', mongoose.connection.readyState);
    console.log('🔧 MONGODB_URI exists:', !!process.env.MONGODB_URI);
    
    res.json({
      message: 'Debug info',
      bufferCommands: mongoose.get('bufferCommands'),
      connectionState: mongoose.connection.readyState,
      hasMongoUri: !!process.env.MONGODB_URI,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
