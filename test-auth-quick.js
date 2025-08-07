const axios = require('axios');

async function testAuth() {
    try {
        console.log('Testing authentication endpoint...');
        
        const response = await axios.post(
            'https://etrainer-backend.vercel.app/api/auth/login',
            {
                email: 'admin@gmail.com',
                password: 'admin@123'
            },
            {
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('✅ Authentication successful!');
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.log('❌ Authentication failed:');
        
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Response:', JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            console.log('No response received (timeout/network error)');
            console.log('Error message:', error.message);
        } else {
            console.log('Error:', error.message);
        }
    }
}

testAuth();
