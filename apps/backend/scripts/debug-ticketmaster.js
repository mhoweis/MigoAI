#!/usr/bin/env node
const axios = require('axios');
require('dotenv').config();

async function testTicketmasterDirect() {
  const apiKey = process.env.TICKETMASTER_API_KEY;

  console.log('🔍 Testing Ticketmaster API directly...');
  console.log(`API Key: ${apiKey ? apiKey.substring(0, 10) + '...' : 'NOT FOUND'}\n`);

  try {
    const response = await axios.get('https://app.ticketmaster.com/discovery/v2/events.json', {
      params: {
        apikey: apiKey,
        city: 'New York',
        countryCode: 'US',
        size: 5,
      },
      timeout: 10000,
    });

    console.log('✅ Ticketmaster API Response:');
    console.log(`   Status: ${response.status}`);
    console.log(`   Total Events: ${response.data.page?.totalElements || 0}`);
    console.log(`   Events in Response: ${response.data._embedded?.events?.length || 0}\n`);

    if (response.data._embedded?.events) {
      console.log('📋 Sample Events:');
      response.data._embedded.events.slice(0, 3).forEach((event, i) => {
        console.log(`   ${i + 1}. ${event.name}`);
        console.log(`      Date: ${event.dates.start.localDate}`);
        console.log(`      Venue: ${event._embedded?.venues?.[0]?.name || 'N/A'}\n`);
      });
    }
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.error('\n⚠️  Authentication Error: Your API key might be invalid.');
      console.error('   Please check your TICKETMASTER_API_KEY in .env file');
    }
  }
}

testTicketmasterDirect();
