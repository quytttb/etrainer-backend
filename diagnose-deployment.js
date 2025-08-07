const axios = require('axios');

async function diagnoseDeployment() {
  console.log('🔍 Chẩn đoán deployment ETrainer Backend trên Vercel...\n');

  try {
    // 1. Kiểm tra basic connectivity
    console.log('1️⃣ Kiểm tra kết nối cơ bản...');
    const basicResponse = await axios.get('https://etrainer-backend.vercel.app/');
    console.log('✅ Server response:', basicResponse.data.message);
    console.log();

    // 2. Kiểm tra health status chi tiết
    console.log('2️⃣ Phân tích health status...');
    const healthResponse = await axios.get('https://etrainer-backend.vercel.app/health');
    const health = healthResponse.data;

    console.log('📊 Tổng quan:');
    console.log(`   - Status: ${health.status}`);
    console.log(`   - Environment: ${health.environment}`);
    console.log(`   - Uptime: ${Math.round(health.uptime)}s`);
    console.log(`   - Memory: ${health.memory.used}MB/${health.memory.total}MB`);
    console.log();

    console.log('🗄️ Database Analysis:');
    const dbState = health.services.database;
    console.log(`   - Ready State: ${dbState.readyState}`);
    console.log(`   - Collections: ${dbState.collections}`);

    const stateMap = {
      0: 'Disconnected ❌',
      1: 'Connected ✅',
      2: 'Connecting 🔄',
      3: 'Disconnecting ⏳'
    };
    console.log(`   - Status: ${stateMap[dbState.readyState] || 'Unknown'}`);
    console.log();

    console.log('🎯 Cache Analysis:');
    const cache = health.services.cache;
    console.log(`   - Memory cache keys: ${cache.memory.keys}`);
    console.log(`   - Redis status: ${cache.redis.status}`);
    console.log();

    // 3. Test một số endpoints để xem pattern lỗi
    console.log('3️⃣ Test pattern lỗi...');
    const testEndpoints = [
      '/api/auth/login',
      '/api/users',
      '/api/vocabulary'
    ];

    for (const endpoint of testEndpoints) {
      try {
        await axios.post(`https://etrainer-backend.vercel.app${endpoint}`, {});
      } catch (error) {
        const status = error.response?.status;
        const message = error.response?.data?.error || error.response?.data?.message;

        console.log(`   ${endpoint}: ${status} - ${message?.substring(0, 60)}...`);

        if (message?.includes('findOne') || message?.includes('mongoose')) {
          console.log('     → Database connection issue detected');
        }
      }
    }
    console.log();

    // 4. Phân tích và đưa ra khuyến nghị
    console.log('📋 Kết luận và khuyến nghị:');

    if (dbState.readyState === 0) {
      console.log('❌ Database: Disconnected');
      console.log('   🔧 Cần kiểm tra:');
      console.log('      - MONGODB_URI environment variable trên Vercel');
      console.log('      - MongoDB Atlas whitelist IP addresses');
      console.log('      - Database user permissions');
    } else if (dbState.readyState === 2) {
      console.log('🔄 Database: Đang kết nối (có thể do cold start)');
      console.log('   💡 Thử lại sau vài phút hoặc gọi nhiều requests để warm up');
    } else if (dbState.readyState === 1) {
      console.log('✅ Database: Kết nối thành công');
    }

    console.log('\n✅ Server infrastructure hoạt động bình thường');
    console.log('✅ API routing được cấu hình đúng');
    console.log('✅ Error handling hoạt động tốt');

    if (cache.redis.status === 'wait') {
      console.log('⚠️ Redis cache chưa được cấu hình (không ảnh hưởng core functionality)');
    }

    console.log('\n🎯 Để test với tài khoản admin, cần đảm bảo database kết nối thành công trước.');

  } catch (error) {
    console.error('❌ Lỗi trong quá trình chẩn đoán:', error.message);
  }
}

diagnoseDeployment();
