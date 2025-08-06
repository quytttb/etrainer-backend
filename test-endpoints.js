const axios = require('axios');

const BASE_URL = 'https://etrainer-backend.vercel.app';

const testCredentials = {
  email: "admin@gmail.com",
  password: "admin@123"
};

async function testAPIEndpoints() {
  console.log('🚀 Test chi tiết các API endpoints...\n');

  let token = null;

  try {
    // Đăng nhập trước để lấy token
    console.log('🔐 Đăng nhập để lấy token...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, testCredentials);
    token = loginResponse.data.token;
    console.log('✅ Đăng nhập thành công!\n');

    const headers = { 'Authorization': `Bearer ${token}` };

    // Test các endpoints chính
    const endpoints = [
      { name: 'Users', url: '/api/users' },
      { name: 'Vocabulary', url: '/api/vocabulary' },
      { name: 'Grammar', url: '/api/grammar' },
      { name: 'Lessons', url: '/api/lessons' },
      { name: 'Questions', url: '/api/question' },
      { name: 'Exams', url: '/api/exam' },
      { name: 'Practice', url: '/api/practice' },
      { name: 'Stats', url: '/api/stats' },
      { name: 'Notifications', url: '/api/notification' }
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`📡 Testing ${endpoint.name} (${endpoint.url})...`);
        const response = await axios.get(`${BASE_URL}${endpoint.url}`, { headers });
        
        const dataLength = Array.isArray(response.data) ? response.data.length : 
                          response.data.data ? response.data.data.length : 'N/A';
        
        console.log(`✅ ${endpoint.name}: Status ${response.status}, Records: ${dataLength}`);
      } catch (error) {
        console.log(`❌ ${endpoint.name}: Error ${error.response?.status || 'Unknown'} - ${error.response?.data?.message || error.message}`);
      }
    }

    console.log('\n🔍 Kiểm tra user profile...');
    try {
      const profileResponse = await axios.get(`${BASE_URL}/api/users/profile`, { headers });
      console.log('✅ Profile:', {
        id: profileResponse.data._id,
        name: profileResponse.data.name,
        email: profileResponse.data.email,
        role: profileResponse.data.role
      });
    } catch (error) {
      console.log('❌ Profile error:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Lỗi:', error.response?.data || error.message);
  }
}

testAPIEndpoints();
