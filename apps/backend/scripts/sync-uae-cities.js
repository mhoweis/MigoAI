#!/usr/bin/env node
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000';

// UAE cities to fetch events from
const UAE_CITIES = [
  { city: 'Dubai', countryCode: 'AE' },
  { city: 'Abu Dhabi', countryCode: 'AE' },
  { city: 'Sharjah', countryCode: 'AE' },
];

async function syncUAEEvents() {
  try {
    // Step 1: Login
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: 'test@example.com',
      password: 'password123',
    });

    const accessToken = loginResponse.data.data.tokens.accessToken;
    console.log('✅ Login successful!\n');

    let totalFetched = 0;
    let totalCreated = 0;
    let totalUpdated = 0;

    // Step 2: Sync events for each UAE city
    for (const location of UAE_CITIES) {
      console.log(`\n🎫 Syncing Ticketmaster events from ${location.city}...`);

      try {
        const syncResponse = await axios.post(
          `${API_BASE_URL}/api/external-events/sync/ticketmaster`,
          {
            city: location.city,
            countryCode: location.countryCode,
            size: 200,
          },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        console.log(`   ✅ ${location.city} sync complete!`);
        console.log(`      - Fetched: ${syncResponse.data.data.fetched} events`);
        console.log(`      - Created: ${syncResponse.data.data.created} new events`);
        console.log(`      - Updated: ${syncResponse.data.data.updated} existing events`);

        totalFetched += syncResponse.data.data.fetched;
        totalCreated += syncResponse.data.data.created;
        totalUpdated += syncResponse.data.data.updated;

        // Wait a bit between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.log(`   ⚠️  Error syncing ${location.city}: ${error.response?.data?.message || error.message}`);
      }
    }

    // Step 3: Show summary
    console.log('\n\n📊 SUMMARY:');
    console.log(`   - Total Fetched: ${totalFetched} events`);
    console.log(`   - Total Created: ${totalCreated} new events`);
    console.log(`   - Total Updated: ${totalUpdated} existing events`);

    // Step 4: Verify total UAE events in database
    console.log('\n🔍 Verifying UAE events in database...');
    const eventsResponse = await axios.get(
      `${API_BASE_URL}/api/events?country=AE&limit=5`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    console.log(`\n✅ Total UAE events in database: ${eventsResponse.data.data.pagination?.total || 0}`);

    if (eventsResponse.data.data.events && eventsResponse.data.data.events.length > 0) {
      console.log('\n📋 Sample UAE events:');
      eventsResponse.data.data.events.slice(0, 5).forEach((event, i) => {
        console.log(`   ${i + 1}. ${event.title} - ${event.city}`);
      });
    }

    console.log('\n✨ Done! UAE events should now appear in the mobile app.');
  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

syncUAEEvents();
