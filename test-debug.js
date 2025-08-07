const axios = require('axios');

async function testDebugEndpoint() {
  try {
    console.log('🔍 Testing debug endpoint...');
    
    const response = await axios.get('https://etrainer-backend.vercel.app/api/debug/env', {
      timeout: 30000
    });
    
    console.log('✅ Debug response:', response.data);
    
  } catch (error) {
    console.error('❌ Debug test failed:', error.response?.data || error.message);
  }
}

testDebugEndpoint();
