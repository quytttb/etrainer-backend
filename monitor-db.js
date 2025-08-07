const axios = require('axios');

const BASE_URL = 'https://etrainer-backend.vercel.app';

async function monitorDatabaseConnection() {
  console.log('🔍 Monitor database connection status...\n');

  const dbStates = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting'
  };

  for (let i = 1; i <= 10; i++) {
    try {
      console.log(`📊 Check ${i}/10...`);

      const healthResponse = await axios.get(`${BASE_URL}/health`);
      const dbState = healthResponse.data.services.database.readyState;
      const uptime = Math.round(healthResponse.data.uptime);

      console.log(`   Database: ${dbStates[dbState]} (${dbState})`);
      console.log(`   Uptime: ${uptime}s`);

      if (dbState === 1) {
        console.log('\n✅ Database đã kết nối! Tiến hành test authentication...');

        // Test login ngay khi database kết nối
        try {
          const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: "admin@gmail.com",
            password: "admin@123"
          });

          console.log('🎉 ĐĂNG NHẬP THÀNH CÔNG!');
          console.log('📊 User info:');
          console.log(`   - ID: ${loginResponse.data.user._id}`);
          console.log(`   - Email: ${loginResponse.data.user.email}`);
          console.log(`   - Role: ${loginResponse.data.user.role}`);
          console.log(`   - Is Admin: ${loginResponse.data.isAdmin}`);

          // Test protected route
          const token = loginResponse.data.token;
          const profileResponse = await axios.get(`${BASE_URL}/api/users/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          console.log('\n✅ Test profile endpoint thành công!');
          console.log(`   Profile: ${profileResponse.data.name} (${profileResponse.data.email})`);

          console.log('\n🚀 Tất cả test PASS! Database và authentication hoạt động bình thường.');
          return;

        } catch (authError) {
          console.log('\n❌ Authentication failed:', authError.response?.data?.error || authError.message);
        }
      }

      // Đợi 15 giây trước khi check tiếp
      if (i < 10) {
        console.log('   ⏳ Waiting 15s...\n');
        await new Promise(resolve => setTimeout(resolve, 15000));
      }

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  console.log('\n❌ Database vẫn chưa kết nối sau 10 lần kiểm tra (2.5 phút)');
  console.log('🔧 Cần kiểm tra cấu hình MongoDB URI trên Vercel dashboard');
}

monitorDatabaseConnection();
