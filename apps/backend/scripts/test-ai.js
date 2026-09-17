// scripts/test-ai.js
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api/ai';

async function testAI() {
  console.log('🧪 Testing MIGO AI Service...\n');
  
  try {
    // 1. Test health endpoint
    console.log('1. Testing health endpoint...');
    const health = await axios.get(`${API_BASE}/health`);
    console.log('✅ Health check:', health.data.data.status, '\n');
    
    // 2. Setup dev environment
    console.log('2. Setting up dev environment...');
    const setup = await axios.post(`${API_BASE}/dev/setup`);
    console.log('✅ Dev setup complete:', setup.data.data.message, '\n');
    
    // 3. Test chat initialization
    console.log('3. Initializing chat session...');
    const init = await axios.post(`${API_BASE}/chat/initialize`, {}, {
      headers: {
        'x-dev-token': 'dev-test-token-123'
      }
    });
    console.log('✅ Chat initialized. Session ID:', init.data.data.sessionId, '\n');
    
    // 4. Test chat
    console.log('4. Testing chat...');
    const chat = await axios.post(`${API_BASE}/chat`, {
      message: "What events are happening this weekend in Dubai?",
      sessionId: init.data.data.sessionId
    }, {
      headers: {
        'x-dev-token': 'dev-test-token-123'
      }
    });
    
    console.log('✅ Chat response received');
    console.log('Response:', chat.data.data.response.substring(0, 200) + '...');
    console.log('Suggestions:', chat.data.data.suggestions);
    
  } catch (error) {
    console.error('❌ Test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run test
if (require.main === module) {
  testAI();
}

module.exports = testAI;