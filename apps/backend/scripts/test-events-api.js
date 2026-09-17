#!/usr/bin/env node
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000';

async function testEventsAPI() {
  try {
    // Login
    const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: 'test@example.com',
      password: 'password123',
    });
    const accessToken = loginResponse.data.data.tokens.accessToken;

    console.log('🧪 Testing Events API...\n');

    // Test different queries
    const tests = [
      { name: 'All events (no filters)', params: {} },
      { name: 'Limit 100', params: { limit: 100 } },
      { name: 'City: London', params: { city: 'London', limit: 50 } },
      { name: 'City: New York', params: { city: 'New York', limit: 50 } },
      { name: 'No pagination', params: { page: 1, limit: 100 } },
    ];

    for (const test of tests) {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/events`, {
          params: test.params,
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        const events = response.data.data.events || [];
        const ticketmasterEvents = events.filter(e => e.externalSource === 'ticketmaster');

        console.log(`✅ ${test.name}:`);
        console.log(`   Total events: ${events.length}`);
        console.log(`   Ticketmaster events: ${ticketmasterEvents.length}`);

        if (ticketmasterEvents.length > 0) {
          console.log(`   Sample: ${ticketmasterEvents[0].title} (${ticketmasterEvents[0].city})`);
        }

        if (events.length > 0 && ticketmasterEvents.length === 0) {
          console.log(`   Other sources: ${events.map(e => e.externalSource || 'local').join(', ')}`);
        }

        console.log('');
      } catch (error) {
        console.log(`❌ ${test.name}: ${error.message}\n`);
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testEventsAPI();
