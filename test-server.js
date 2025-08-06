const axios = require('axios');

const BASE_URL = 'https://etrainer-backend.vercel.app';

const testCredentials = {
  email: "admin@gmail.com",
  password: "admin@123",
  role: "ADMIN",
  id: "68033a77d3a5025056165bea"
};

async function testServer() {
  console.log('🚀 Bắt đầu test server ETrainer Backend...\n');

  try {
    // Test 1: Health check
    console.log('1️⃣ Kiểm tra server health...');
    const healthResponse = await axios.get(`${BASE_URL}/`);
    console.log('✅ Server đang hoạt động:', healthResponse.data);
    console.log();

    // Test 2: Login
    console.log('2️⃣ Kiểm tra đăng nhập với tài khoản admin...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: testCredentials.email,
      password: testCredentials.password
    });
    
    console.log('✅ Đăng nhập thành công!');
    console.log('Token:', loginResponse.data.token.substring(0, 50) + '...');
    console.log('User:', loginResponse.data.user);
    console.log('Is Admin:', loginResponse.data.isAdmin);
    console.log();

    const token = loginResponse.data.token;

    // Test 3: Check protected route
    console.log('3️⃣ Kiểm tra route được bảo vệ...');
    const usersResponse = await axios.get(`${BASE_URL}/api/users`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Truy cập thành công vào /api/users');
    console.log('Số lượng users:', usersResponse.data.length || 'Unknown');
    console.log();

    // Test 4: Get user profile
    console.log('4️⃣ Kiểm tra profile user...');
    const profileResponse = await axios.get(`${BASE_URL}/api/users/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Lấy profile thành công');
    console.log('Profile:', profileResponse.data);
    console.log();

    console.log('🎉 Tất cả test đã pass! Server hoạt động bình thường.');

  } catch (error) {
    console.error('❌ Lỗi trong quá trình test:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testServer();
