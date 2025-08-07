const axios = require('axios');

async function warmUpAndTest() {
  console.log('🔥 Warm-up server và test kết nối database...\n');

  const baseURL = 'https://etrainer-backend.vercel.app';

  try {
    // 1. Warm up bằng nhiều requests liên tiếp
    console.log('1️⃣ Warm-up server với multiple requests...');
    for (let i = 1; i <= 5; i++) {
      console.log(`   Request ${i}/5...`);
      await axios.get(`${baseURL}/health`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    }
    console.log('✅ Warm-up completed\n');

    // 2. Kiểm tra database state sau warm-up
    console.log('2️⃣ Kiểm tra database state sau warm-up...');
    const healthCheck = await axios.get(`${baseURL}/health`);
    const dbState = healthCheck.data.services.database.readyState;

    console.log(`Database state: ${dbState}`);

    if (dbState === 1) {
      console.log('✅ Database đã kết nối! Tiến hành test authentication...\n');

      // 3. Test authentication với tài khoản admin
      console.log('3️⃣ Test authentication với tài khoản admin...');
      try {
        const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
          email: "admin@gmail.com",
          password: "admin@123"
        });

        console.log('🎉 ĐĂNG NHẬP THÀNH CÔNG!');
        console.log('📊 Thông tin user:');
        console.log(`   - ID: ${loginResponse.data.user._id}`);
        console.log(`   - Email: ${loginResponse.data.user.email}`);
        console.log(`   - Role: ${loginResponse.data.user.role}`);
        console.log(`   - Is Admin: ${loginResponse.data.isAdmin}`);
        console.log(`   - Token: ${loginResponse.data.token.substring(0, 50)}...`);
        console.log();

        // 4. Test một vài protected endpoints
        const token = loginResponse.data.token;
        const headers = { 'Authorization': `Bearer ${token}` };

        console.log('4️⃣ Test protected endpoints...');

        try {
          const profileResponse = await axios.get(`${baseURL}/api/users/profile`, { headers });
          console.log('✅ Profile endpoint: Success');
          console.log(`   User: ${profileResponse.data.name} (${profileResponse.data.email})`);
        } catch (err) {
          console.log('❌ Profile endpoint:', err.response?.data?.message || err.message);
        }

        try {
          const usersResponse = await axios.get(`${baseURL}/api/users`, { headers });
          console.log('✅ Users endpoint: Success');
          console.log(`   Total users: ${Array.isArray(usersResponse.data) ? usersResponse.data.length : 'Unknown'}`);
        } catch (err) {
          console.log('❌ Users endpoint:', err.response?.data?.message || err.message);
        }

        console.log('\n🎯 KẾT QUẢ CUỐI CÙNG:');
        console.log('✅ Server deployment thành công');
        console.log('✅ Database kết nối thành công');
        console.log('✅ Authentication hoạt động');
        console.log('✅ Tài khoản admin có thể đăng nhập');
        console.log('\n🚀 Server sẵn sàng sử dụng!');

      } catch (authError) {
        console.log('❌ Authentication failed:');
        console.log(`   Status: ${authError.response?.status}`);
        console.log(`   Error: ${authError.response?.data?.error || authError.message}`);
      }

    } else {
      console.log('❌ Database vẫn chưa kết nối sau warm-up');
      console.log('🔧 Cần kiểm tra cấu hình MongoDB trên Vercel dashboard');
    }

  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  }
}

warmUpAndTest();
