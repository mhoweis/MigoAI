#!/usr/bin/env node
/**
 * Test script for external events API
 * Usage: node scripts/test-external-events.js [command] [options]
 */

const axios = require('axios');
const readline = require('readline');

const API_BASE_URL = process.env.API_URL || 'http://localhost:5000';
const ACCESS_TOKEN = process.env.TEST_ACCESS_TOKEN || '';

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Helper to make API calls
async function apiCall(method, endpoint, data = null, params = null) {
  try {
    console.log(`\n📡 ${method.toUpperCase()} ${endpoint}`);
    if (params) console.log('Query params:', params);
    if (data) console.log('Body:', JSON.stringify(data, null, 2));

    const response = await axios({
      method,
      url: `${API_BASE_URL}${endpoint}`,
      data,
      params,
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('✅ Success!');
    console.log(JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    return null;
  }
}

// Test commands
const commands = {
  // Test connection
  async health() {
    console.log('\n🏥 Testing server health...');
    await apiCall('get', '/api/health');
  },

  // Fetch from all sources
  async fetchAll() {
    const city = await question('City (optional, press enter to skip): ');
    const keyword = await question('Keyword (optional, press enter to skip): ');

    await apiCall('get', '/api/external-events/fetch', null, {
      city: city || undefined,
      keyword: keyword || undefined,
    });
  },

  // Fetch from Ticketmaster
  async fetchTicketmaster() {
    const city = await question('City (e.g., Dubai): ');
    const countryCode = await question('Country code (e.g., AE): ');
    const keyword = await question('Keyword (optional): ');

    await apiCall('get', '/api/external-events/ticketmaster', null, {
      city: city || undefined,
      countryCode: countryCode || 'US',
      keyword: keyword || undefined,
      size: 20,
    });
  },

  // Fetch from Eventbrite
  async fetchEventbrite() {
    const location = await question('Location (e.g., Dubai): ');
    const q = await question('Search query (optional): ');

    await apiCall('get', '/api/external-events/eventbrite', null, {
      location: location || 'Dubai',
      q: q || undefined,
    });
  },

  // Fetch from Meetup
  async fetchMeetup() {
    const lat = await question('Latitude (default 25.2048 for Dubai): ');
    const lon = await question('Longitude (default 55.2708 for Dubai): ');
    const text = await question('Search text (optional): ');

    await apiCall('get', '/api/external-events/meetup', null, {
      lat: lat || 25.2048,
      lon: lon || 55.2708,
      radius: 50,
      text: text || undefined,
    });
  },

  // Fetch from Platinumlist
  async fetchPlatinumlist() {
    const city = await question('City (default Dubai): ');
    const category = await question('Category (optional): ');

    await apiCall('get', '/api/external-events/platinumlist', null, {
      city: city || 'Dubai',
      category: category || undefined,
      limit: 20,
    });
  },

  // Sync from all sources
  async syncAll() {
    const city = await question('City (e.g., Dubai): ');
    const country = await question('Country code (e.g., AE): ');
    const keyword = await question('Keyword (optional): ');

    const confirm = await question(`\n⚠️  This will sync events to the database. Continue? (yes/no): `);
    if (confirm.toLowerCase() !== 'yes') {
      console.log('Cancelled.');
      return;
    }

    await apiCall('post', '/api/external-events/sync', {
      city: city || undefined,
      country: country || undefined,
      keyword: keyword || undefined,
    });
  },

  // Sync from specific source
  async syncSource() {
    console.log('\nAvailable sources:');
    console.log('1. ticketmaster');
    console.log('2. eventbrite');
    console.log('3. meetup');
    console.log('4. platinumlist');

    const source = await question('Choose source: ');

    let params = {};

    if (source === 'ticketmaster') {
      const city = await question('City: ');
      const countryCode = await question('Country code: ');
      params = { city, countryCode, size: 50 };
    } else if (source === 'eventbrite') {
      const location = await question('Location: ');
      params = { location };
    } else if (source === 'meetup') {
      const text = await question('Search text: ');
      params = { text };
    } else if (source === 'platinumlist') {
      const city = await question('City (default Dubai): ');
      params = { city: city || 'Dubai' };
    }

    const confirm = await question(`\n⚠️  This will sync ${source} events to the database. Continue? (yes/no): `);
    if (confirm.toLowerCase() !== 'yes') {
      console.log('Cancelled.');
      return;
    }

    await apiCall('post', `/api/external-events/sync/${source}`, params);
  },

  // View synced events
  async viewEvents() {
    const city = await question('City filter (optional): ');
    const limit = await question('Limit (default 10): ');

    await apiCall('get', '/api/events', null, {
      city: city || undefined,
      limit: limit || 10,
    });
  },

  // Login (to get access token)
  async login() {
    const email = await question('Email: ');
    const password = await question('Password: ');

    const response = await apiCall('post', '/api/auth/login', {
      email,
      password,
    });

    if (response?.data?.accessToken) {
      console.log('\n✅ Login successful!');
      console.log('\n🔑 Access Token:', response.data.accessToken);
      console.log('\nTo use this token, either:');
      console.log('1. Set environment variable: export TEST_ACCESS_TOKEN="<token>"');
      console.log('2. Edit this script and paste the token directly');
    }
  },

  // Help
  help() {
    console.log('\n📚 Available Commands:');
    console.log('');
    console.log('  health            - Test server health');
    console.log('  login             - Login to get access token');
    console.log('  fetch-all         - Fetch events from all sources');
    console.log('  fetch-tm          - Fetch from Ticketmaster');
    console.log('  fetch-eb          - Fetch from Eventbrite');
    console.log('  fetch-meetup      - Fetch from Meetup');
    console.log('  fetch-pl          - Fetch from Platinumlist');
    console.log('  sync-all          - Sync events from all sources');
    console.log('  sync-source       - Sync from specific source');
    console.log('  view-events       - View synced events');
    console.log('  help              - Show this help');
    console.log('');
    console.log('Environment Variables:');
    console.log('  API_URL          - API base URL (default: http://localhost:5000)');
    console.log('  TEST_ACCESS_TOKEN - Access token for authentication');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/test-external-events.js health');
    console.log('  node scripts/test-external-events.js login');
    console.log('  TEST_ACCESS_TOKEN="your-token" node scripts/test-external-events.js fetch-all');
    console.log('  TEST_ACCESS_TOKEN="your-token" node scripts/test-external-events.js fetch-pl');
    console.log('');
  }
};

// Main execution
async function main() {
  const command = process.argv[2];

  console.log('🎯 MIGO External Events Test Script');
  console.log('===================================');
  console.log(`API URL: ${API_BASE_URL}`);
  console.log(`Auth Token: ${ACCESS_TOKEN ? '✅ Set' : '❌ Not set (use login command)'}`);

  if (!command || command === 'help') {
    commands.help();
    rl.close();
    return;
  }

  // Map command aliases
  const commandMap = {
    'health': 'health',
    'login': 'login',
    'fetch-all': 'fetchAll',
    'fetch-tm': 'fetchTicketmaster',
    'fetch-ticketmaster': 'fetchTicketmaster',
    'fetch-eb': 'fetchEventbrite',
    'fetch-eventbrite': 'fetchEventbrite',
    'fetch-meetup': 'fetchMeetup',
    'fetch-pl': 'fetchPlatinumlist',
    'fetch-platinumlist': 'fetchPlatinumlist',
    'sync-all': 'syncAll',
    'sync-source': 'syncSource',
    'view-events': 'viewEvents',
    'view': 'viewEvents',
  };

  const commandFn = commands[commandMap[command]];

  if (!commandFn) {
    console.log(`\n❌ Unknown command: ${command}`);
    commands.help();
    rl.close();
    return;
  }

  try {
    await commandFn();
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    rl.close();
  }
}

main().catch(console.error);
