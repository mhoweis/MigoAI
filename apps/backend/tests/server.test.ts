import axios from 'axios';
import  config  from '../src/config/env';

const BASE_URL = config.APP_URL;
//const API_VERSION = config.API_VERSION;

async function testServer() {
  console.log('🚀 Testing MIGO Server...');
  
  try {
    // 1. Test Health Endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health:', healthResponse.data.status);
    
    // 2. Test API Docs
    console.log('2. Testing API docs...');
    const docsResponse = await axios.get(`${BASE_URL}/api-docs`);
    console.log('✅ API Docs:', docsResponse.data.name);
    
    // 3. Test Authentication Endpoints
    console.log('3. Testing authentication...');
    
    // Try to register a test user
    const registerData = {
      email: `test${Date.now()}@example.com`,
      name: 'Test User',
      password: 'testpassword123',
    };
    
//|
      
      // const profileResponse = await axios.get(
      //   `${BASE_URL}/api/${API_VERSION}/auth/me`,
      //   {
      //     headers: { Authorization: `Bearer ${token}` }
      //   }
      // );
      // console.log('✅ Profile access:', profileResponse.data.success);
      
      // // 5. Test Events API
      // console.log('5. Testing events API...');
      
      // const eventsResponse = await axios.get(
      //   `${BASE_URL}/api/${API_VERSION}/events`
      // );
      //console.log(`✅ Events fetched: ${eventsResponse.data.data?.length || 0} events`);
      
   // } catch (authError: any) {
   //   console.log('⚠️  Auth test skipped or failed:', authError.response?.data?.message || authError.message);
   // }
    
    console.log('\n🎉 Server tests completed!');
    
  } catch (error: any) {
    console.error('❌ Server test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    process.exit(1);
  }
}

testServer();