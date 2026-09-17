#!/usr/bin/env node
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000';

async function testCities() {
  try {
    // Login
    const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: 'test@example.com',
      password: 'password123',
    });
    const accessToken = loginResponse.data.data.tokens.accessToken;

    // Test different cities
    const cities = [
      { city: 'New York', countryCode: 'US' },
      { city: 'Los Angeles', countryCode: 'US' },
      { city: 'London', countryCode: 'GB' },
      { city: 'Dubai', countryCode: 'AE' },
    ];

    console.log('🌍 Testing Ticketmaster API with different cities...\n');

    for (const { city, countryCode } of cities) {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/external-events/ticketmaster`,
          {
            params: { city, countryCode, size: 5 },
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        console.log(`✅ ${city}, ${countryCode}: Found ${response.data.count} events`);
        if (response.data.count > 0) {
          console.log(`   Sample: ${response.data.data[0].name}\n`);
        }
      } catch (error) {
        console.log(`❌ ${city}, ${countryCode}: ${error.response?.data?.message || error.message}\n`);
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testCities();
