#!/usr/bin/env node
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000';

async function syncTicketmasterEvents() {
  try {
    // Step 1: Login
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: 'test@example.com',
      password: 'password123',
    });

    const accessToken = loginResponse.data.data.tokens.accessToken;
    console.log('✅ Login successful!\n');

    // Step 2: Sync Ticketmaster events
    console.log('🎫 Syncing Ticketmaster events from Dubai...');
    const syncResponse = await axios.post(
      `${API_BASE_URL}/api/external-events/sync/ticketmaster`,
      {
        city: 'Dubai',
        countryCode: 'AE',
        size: 200,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('\n✅ Sync complete!');
    console.log('\n📊 Results:');
    console.log(`   - Fetched: ${syncResponse.data.data.fetched} events`);
    console.log(`   - Created: ${syncResponse.data.data.created} new events`);
    console.log(`   - Updated: ${syncResponse.data.data.updated} existing events`);
    console.log(`   - Errors: ${syncResponse.data.data.errors}`);

    // Step 3: Verify events in database
    console.log('\n🔍 Verifying events in database...');
    const eventsResponse = await axios.get(
      `${API_BASE_URL}/api/events?city=Dubai&limit=10`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    console.log(`\n✅ Found ${eventsResponse.data.data.events?.length || 0} events in database`);

    if (eventsResponse.data.data.events && eventsResponse.data.data.events.length > 0) {
      console.log('\n📋 Sample events:');
      eventsResponse.data.data.events.slice(0, 3).forEach((event, i) => {
        console.log(`   ${i + 1}. ${event.title} (${event.externalSource || 'local'})`);
      });
    }

    console.log('\n✨ Done! Your events should now appear in the mobile app.');
  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

syncTicketmasterEvents();
