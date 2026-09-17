// migo-backend/scripts/test-ai-complete.js
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api/ai';

async function runCompleteTest() {
  console.log('🚀 MIGO AI COMPLETE TEST SUITE\n');
  console.log('='.repeat(50));
  
  let sessionId = null;
  let testPassed = 0;
  let testFailed = 0;

  const tests = [
    {
      name: '1. Health Check',
      method: 'GET',
      url: `${API_BASE}/health`,
      data: null,
      validate: (response) => response.data.success === true
    },
    {
      name: '2. Capabilities',
      method: 'GET',
      url: `${API_BASE}/capabilities`,
      data: null,
      validate: (response) => response.data.data.length > 0
    },
    {
      name: '3. Dev Setup',
      method: 'POST',
      url: `${API_BASE}/dev/setup`,
      data: {},
      validate: (response) => response.data.success === true && response.data.data.userId
    },
    {
      name: '4. Initialize Chat Session',
      method: 'POST',
      url: `${API_BASE}/chat/initialize`,
      data: {},
      validate: (response) => {
        if (response.data.success && response.data.data.sessionId) {
          sessionId = response.data.data.sessionId;
          return true;
        }
        return false;
      }
    },
    {
      name: '5. AI Chat - Weekend Events',
      method: 'POST',
      url: `${API_BASE}/chat`,
      data: {
        message: "What events are happening this weekend in Dubai?",
        sessionId: () => sessionId
      },
      validate: (response) => response.data.success === true
    },
    {
      name: '6. AI Chat - Free Events',
      method: 'POST',
      url: `${API_BASE}/chat`,
      data: {
        message: "Find me some free events",
        sessionId: () => sessionId
      },
      validate: (response) => response.data.success === true
    },
    {
      name: '7. Get Chat Suggestions',
      method: 'GET',
      url: `${API_BASE}/chat/suggestions`,
      data: null,
      validate: (response) => response.data.data.length > 0
    }
  ];

  for (const test of tests) {
    console.log(`\n${test.name}`);
    console.log('-'.repeat(test.name.length));
    
    try {
      // Prepare data (handle function calls)
      const data = typeof test.data === 'function' ? test.data() : test.data;
      
      const response = await axios({
        method: test.method,
        url: test.url,
        data: test.method !== 'GET' ? data : undefined,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (test.validate(response)) {
        console.log('✅ PASS');
        testPassed++;
        
        // Log useful info
        if (test.name.includes('Health')) {
          console.log(`   Provider: ${response.data.data.aiProvider}`);
          console.log(`   Model: ${response.data.data.model}`);
        } else if (test.name.includes('Initialize')) {
          console.log(`   Session ID: ${sessionId}`);
          console.log(`   Greeting: ${response.data.data.message.substring(0, 50)}...`);
        } else if (test.name.includes('AI Chat')) {
          console.log(`   Response: ${response.data.data.response.substring(0, 100)}...`);
          if (response.data.data.recommendations?.length > 0) {
            console.log(`   Recommendations: ${response.data.data.recommendations.length}`);
          }
        }
      } else {
        console.log('❌ FAIL - Validation failed');
        console.log(`   Response:`, JSON.stringify(response.data, null, 2).substring(0, 200));
        testFailed++;
      }
    } catch (error) {
      console.log('❌ FAIL - Error occurred');
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Message: ${error.response.data?.error || error.message}`);
      } else {
        console.log(`   Error: ${error.message}`);
      }
      testFailed++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY:');
  console.log(`   Total Tests: ${tests.length}`);
  console.log(`   Passed: ${testPassed}`);
  console.log(`   Failed: ${testFailed}`);
  console.log(`   Success Rate: ${Math.round((testPassed / tests.length) * 100)}%`);
  
  if (testFailed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Your AI agent is ready.');
    console.log('\nNext steps:');
    console.log('1. Test the frontend AI chat screen');
    console.log('2. Check event API endpoints');
    console.log('3. Verify database connectivity');
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.');
  }
}

// Run the test
runCompleteTest().catch(console.error);