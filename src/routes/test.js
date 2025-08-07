const express = require('express');
const router = express.Router();

router.post('/test-simple', async (req, res) => {
     try {
          console.log('🔧 Simple test endpoint called');

          res.json({
               message: 'Simple test works!',
               timestamp: new Date().toISOString(),
               body: req.body
          });
     } catch (error) {
          console.error('Simple test error:', error);
          res.status(500).json({ error: error.message });
     }
});

module.exports = router;
