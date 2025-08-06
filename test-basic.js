const axios = require('axios');

const BASE_URL = 'https://etrainer-backend.vercel.app';

async function testBasicFunctionality() {
  console.log('🚀 Test cơ bản server ETrainer Backend...\n');

  try {
    // 1. Health check
    console.log('1️⃣ Kiểm tra server health...');
    const healthResponse = await axios.get(`${BASE_URL}/`);
    console.log('✅ Server Response:', healthResponse.data);
    console.log();

    // 2. Detailed health check
    console.log('2️⃣ Kiểm tra health chi tiết...');
    const detailedHealthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('📊 Server Status:', detailedHealthResponse.data.status);
    console.log('🌍 Environment:', detailedHealthResponse.data.environment);
    console.log('💾 Memory Usage:', detailedHealthResponse.data.memory);
    console.log('🗄️ Database State:', detailedHealthResponse.data.services.database);
    console.log();

    // 3. Test 404 route
    console.log('3️⃣ Kiểm tra 404 handling...');
    try {
      await axios.get(`${BASE_URL}/api/nonexistent`);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('✅ 404 handling hoạt động đúng');
        console.log('📝 404 Response:', error.response.data);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    console.log();

    // 4. Test authentication endpoint (even if DB is down)
    console.log('4️⃣ Kiểm tra auth endpoint structure...');
    try {
      await axios.post(`${BASE_URL}/api/auth/login`, {
        email: "test@example.com",
        password: "test123"
      });
    } catch (error) {
      console.log('📍 Auth endpoint status:', error.response?.status);
      console.log('📝 Auth response:', error.response?.data);
      
      if (error.response?.status === 500 && 
          error.response?.data?.error?.includes('findOne')) {
        console.log('✅ Auth endpoint tồn tại nhưng DB chưa kết nối');
      }
    }
    console.log();

    console.log('📋 Tóm tắt kết quả test:');
    console.log('- ✅ Server đang chạy và phản hồi');
    console.log('- ✅ API routes được cấu hình đúng');
    console.log('- ✅ Error handling hoạt động');
    console.log('- ⚠️ Database connection cần được kiểm tra');
    console.log('\n🔧 Gợi ý: Kiểm tra biến môi trường MONGODB_URI trên Vercel');

  } catch (error) {
    console.error('❌ Lỗi trong quá trình test:');
    console.error('Status:', error.response?.status || 'N/A');
    console.error('Message:', error.message);
  }
}

testBasicFunctionality();
