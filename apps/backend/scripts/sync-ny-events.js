#!/usr/bin/env node
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000';

async function syncNewYorkEvents() {
  try {
    // Login
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: 'test@example.com',
      password: 'password123',
    });
    const accessToken = loginResponse.data.data.tokens.accessToken;
    console.log('✅ Login successful!\n');

    // Sync from multiple cities
    const locations = [
      { city: 'New York', countryCode: 'US' },
      { city: 'Los Angeles', countryCode: 'US' },
      { city: 'London', countryCode: 'GB' },
    ];

    for (const { city, countryCode } of locations) {
      console.log(`\n🎫 Syncing Ticketmaster events from ${city}...`);

      const syncResponse = await axios.post(
        `${API_BASE_URL}/api/external-events/sync/ticketmaster`,
        { city, countryCode, size: 20 },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log(`   ✅ Fetched: ${syncResponse.data.data.fetched} events`);
      console.log(`   ✅ Created: ${syncResponse.data.data.created} new events`);
      console.log(`   ✅ Updated: ${syncResponse.data.data.updated} existing events`);
      if (syncResponse.data.data.errors > 0) {
        console.log(`   ⚠️  Errors: ${syncResponse.data.data.errors}`);
      }
    }

    // Verify events in database
    console.log('\n\n🔍 Verifying events in database...');
    const eventsResponse = await axios.get(`${API_BASE_URL}/api/events?limit=20`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const totalEvents = eventsResponse.data.data.events?.length || 0;
    const externalEvents = eventsResponse.data.data.events?.filter(e => e.externalSource === 'ticketmaster').length || 0;

    console.log(`\n✅ Total events in database: ${totalEvents}`);
    console.log(`✅ Ticketmaster events: ${externalEvents}`);

    if (eventsResponse.data.data.events && externalEvents > 0) {
      console.log('\n📋 Sample Ticketmaster events:');
      eventsResponse.data.data.events
        .filter(e => e.externalSource === 'ticketmaster')
        .slice(0, 5)
        .forEach((event, i) => {
          console.log(`   ${i + 1}. ${event.title}`);
          console.log(`      City: ${event.city || 'N/A'}`);
          console.log(`      Date: ${new Date(event.startDate).toLocaleDateString()}`);
        });
    }

    console.log('\n✨ Done! Events synced successfully.');
    console.log('📱 Your mobile app should now show these events!');
  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Details:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

syncNewYorkEvents();
