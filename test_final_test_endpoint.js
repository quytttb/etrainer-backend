const axios = require('axios');

// JWT token for user@gmail.com - updated from latest terminal logs
const JWT_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4NDNlMjBkNjA5MWVlZTY2NGM3YjBiMCIsImVtYWlsIjoidXNlckBnbWFpbC5jb20iLCJpYXQiOjE3Mzc5OTA0MjksImV4cCI6MTc0MDYyMjQyOX0.5y0o-jTcQE6N6lLqPUK_WSDMCGagwGQ8e9YUtpaDVdo";

const BASE_URL = "http://localhost:8080/api";

async function testFinalTestEndpoint() {
     try {
          console.log('🧪 Testing Stage 1 Final Test Endpoints...');

          // Test GET final test info
          console.log('\n1️⃣ GET /journeys/stage-final-test/1');
          const getResponse = await axios.get(`${BASE_URL}/journeys/stage-final-test/1`, {
               headers: {
                    'Authorization': `Bearer ${JWT_TOKEN}`,
                    'Content-Type': 'application/json'
               }
          });

          console.log('✅ GET Response:', {
               finalTestInfo: {
                    totalQuestions: getResponse.data.finalTestInfo.totalQuestions,
                    duration: getResponse.data.finalTestInfo.duration,
                    hasQuestions: getResponse.data.finalTestInfo.questions ? getResponse.data.finalTestInfo.questions.length : 0
               },
               finalTestStatus: getResponse.data.finalTestStatus,
               canTakeTest: getResponse.data.canTakeTest
          });

          // Test POST start final test
          console.log('\n2️⃣ POST /journeys/start-stage-final-test/1');
          const startResponse = await axios.post(`${BASE_URL}/journeys/start-stage-final-test/1`, {}, {
               headers: {
                    'Authorization': `Bearer ${JWT_TOKEN}`,
                    'Content-Type': 'application/json'
               }
          });

          console.log('✅ START Response:', {
               message: startResponse.data.message,
               questionsCount: startResponse.data.finalTest?.totalQuestions || 0,
               hasQuestions: startResponse.data.finalTest?.questions ? startResponse.data.finalTest.questions.length : 0
          });

          // Test GET again after start
          console.log('\n3️⃣ GET /journeys/stage-final-test/1 (after start)');
          const getAfterStartResponse = await axios.get(`${BASE_URL}/journeys/stage-final-test/1`, {
               headers: {
                    'Authorization': `Bearer ${JWT_TOKEN}`,
                    'Content-Type': 'application/json'
               }
          });

          console.log('✅ GET After Start Response:', {
               finalTestInfo: {
                    totalQuestions: getAfterStartResponse.data.finalTestInfo.totalQuestions,
                    duration: getAfterStartResponse.data.finalTestInfo.duration,
                    hasQuestions: getAfterStartResponse.data.finalTestInfo.questions ? getAfterStartResponse.data.finalTestInfo.questions.length : 0
               },
               finalTestStatus: getAfterStartResponse.data.finalTestStatus,
               canTakeTest: getAfterStartResponse.data.canTakeTest
          });

     } catch (error) {
          console.error('❌ Error:', {
               status: error.response?.status,
               statusText: error.response?.statusText,
               data: error.response?.data,
               message: error.message
          });
     }
}

testFinalTestEndpoint(); 