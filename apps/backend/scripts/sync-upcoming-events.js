#!/usr/bin/env node
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000';

async function syncUpcomingEvents() {
  try {
    // Login
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: 'test@example.com',
      password: 'password123',
    });
    const accessToken = loginResponse.data.data.tokens.accessToken;
    console.log('✅ Login successful!\n');

    // Get current date and future date range
    const now = new Date();
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 3); // Next 3 months

    const startDateTime = now.toISOString().split('T')[0] + 'T00:00:00Z';

    console.log(`📅 Fetching events from: ${startDateTime}\n`);

    // Sync from multiple cities with future dates
    const locations = [
      { city: 'New York', countryCode: 'US' },
      { city: 'Los Angeles', countryCode: 'US' },
      { city: 'London', countryCode: 'GB' },
      { city: 'Paris', countryCode: 'FR' },
    ];

    let totalCreated = 0;
    let totalUpdated = 0;

    for (const { city, countryCode } of locations) {
      console.log(`\n🎫 Syncing upcoming events from ${city}...`);

      const syncResponse = await axios.post(
        `${API_BASE_URL}/api/external-events/sync/ticketmaster`,
        {
          city,
          countryCode,
          startDateTime,
          size: 30,
        },
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

      totalCreated += syncResponse.data.data.created;
      totalUpdated += syncResponse.data.data.updated;
    }

    // Verify events in database
    console.log('\n\n🔍 Verifying events in database...');
    const eventsResponse = await axios.get(`${API_BASE_URL}/api/events?limit=50`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const totalEvents = eventsResponse.data.data.events?.length || 0;
    const externalEvents = eventsResponse.data.data.events?.filter(e => e.externalSource === 'ticketmaster').length || 0;

    console.log(`\n✅ Total events returned by API: ${totalEvents}`);
    console.log(`✅ Ticketmaster events: ${externalEvents}`);
    console.log(`\n📊 Sync Summary:`);
    console.log(`   - Total Created: ${totalCreated}`);
    console.log(`   - Total Updated: ${totalUpdated}`);

    if (eventsResponse.data.data.events && externalEvents > 0) {
      console.log('\n📋 Sample Ticketmaster events in API:');
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
    console.log('📱 Your mobile app should now show these upcoming events!');
  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

syncUpcomingEvents();
