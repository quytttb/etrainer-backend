const axios = require('axios');

async function detailedConnectionTest() {
  console.log('🔍 Detailed Database Connection Test...\n');

  const baseURL = 'https://etrainer-backend.vercel.app';

  try {
    // 1. Test basic health
    console.log('1️⃣ Basic Health Check...');
    const healthResponse = await axios.get(`${baseURL}/health`);
    const dbStatus = healthResponse.data.services.database;

    console.log('Database Status:', dbStatus);
    console.log('Environment:', healthResponse.data.environment);
    console.log('Memory:', healthResponse.data.memory);
    console.log();

    // 2. Test multiple times to see if connection state changes
    console.log('2️⃣ Multiple Connection Attempts...');
    for (let i = 1; i <= 5; i++) {
      try {
        console.log(`Attempt ${i}/5...`);

        // Try to trigger database connection with auth endpoint
        const authResponse = await axios.post(`${baseURL}/api/auth/login`, {
          email: "test@example.com",
          password: "test123"
        });

        console.log(`✅ Attempt ${i}: Unexpected success!`, authResponse.data);
        break;

      } catch (error) {
        const status = error.response?.status;
        const message = error.response?.data?.error || error.response?.data?.message || error.message;

        console.log(`❌ Attempt ${i}: ${status} - ${message}`);

        if (status === 503) {
          console.log('   → Database connection issue');
        } else if (status === 500) {
          console.log('   → Server error (possibly connection buffering issue)');
        } else if (status === 401 || status === 400) {
          console.log('   → ✅ Database connected! (Auth error is expected)');
          break;
        }

        // Wait between attempts
        if (i < 5) {
          console.log('   ⏳ Waiting 3 seconds...');
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
    }

    // 3. Final health check
    console.log('\n3️⃣ Final Health Check...');
    const finalHealth = await axios.get(`${baseURL}/health`);
    const finalDbStatus = finalHealth.data.services.database;

    console.log('Final Database Status:', finalDbStatus);

    // 4. Diagnosis
    console.log('\n📋 DIAGNOSIS:');
    if (finalDbStatus.readyState === 1) {
      console.log('✅ Database connection is working!');
    } else if (finalDbStatus.readyState === 2) {
      console.log('⚠️ Database is trying to connect but failing');
      console.log('   Possible issues:');
      console.log('   - MongoDB URI is incorrect');
      console.log('   - MongoDB Atlas IP whitelist does not include Vercel IPs');
      console.log('   - Database credentials are invalid');
      console.log('   - Network timeout issues');
    } else if (finalDbStatus.readyState === 0) {
      console.log('❌ Database is disconnected');
      console.log('   Possible issues:');
      console.log('   - MONGODB_URI environment variable is missing or invalid');
      console.log('   - MongoDB server is down');
      console.log('   - Severe network issues');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

detailedConnectionTest();
