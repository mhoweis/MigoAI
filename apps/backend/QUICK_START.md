# External Events - Quick Start Guide

Get up and running with external events in 5 minutes!

## Step 1: Add API Keys (2 minutes)

Open `apps/backend/.env` and add your API keys:

```bash
# Copy these from your .env.example
TICKETMASTER_API_KEY="your-actual-ticketmaster-key"
EVENTBRITE_API_KEY="your-actual-eventbrite-oauth-token"
MEETUP_API_KEY="your-actual-meetup-key"
```

**Don't have API keys yet?** See the "Getting API Keys" section below.

## Step 2: Create System User (30 seconds)

```bash
cd apps/backend
npm run prisma:seed
```

You should see:
```
✅ System user created
✅ Database seeded successfully
```

## Step 3: Start the Server (30 seconds)

```bash
npm run dev
```

Server should start at `http://localhost:5000`

## Step 4: Test It! (2 minutes)

### Option A: Using the Test Script (Recommended)

```bash
# Login to get access token
node scripts/test-external-events.js login

# Enter test@example.com / password123
# Copy the access token from response

# Set token in environment
export TEST_ACCESS_TOKEN="paste-token-here"

# Test health
node scripts/test-external-events.js health

# Fetch events from all sources
node scripts/test-external-events.js fetch-all
# Enter: Dubai for city, leave keyword blank

# Sync to database
node scripts/test-external-events.js sync-all
# Enter: Dubai for city, AE for country
```

### Option B: Using curl

```bash
# 1. Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Copy the accessToken from response

# 2. Fetch events (replace YOUR_TOKEN)
curl -X GET "http://localhost:5000/api/external-events/fetch?city=Dubai" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Sync to database
curl -X POST http://localhost:5000/api/external-events/sync \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"city":"Dubai","country":"AE"}'
```

## Step 5: View Events in Your App

The synced events are now available through your regular events API:

```bash
curl -X GET "http://localhost:5000/api/events?city=Dubai" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

You should see a mix of local and external events!

## From Mobile App

```typescript
import { api } from './services/api';

// Fetch live external events
const fetchExternalEvents = async () => {
  const response = await api.get('/external-events/fetch', {
    params: { city: 'Dubai', keyword: 'music' }
  });
  console.log(response.data);
};

// Sync events to database
const syncEvents = async () => {
  const response = await api.post('/external-events/sync', {
    city: 'Dubai',
    country: 'AE'
  });
  console.log(`Created: ${response.data.data.created}`);
  console.log(`Updated: ${response.data.data.updated}`);
};

// View all events (local + external)
const viewAllEvents = async () => {
  const response = await api.get('/events', {
    params: { city: 'Dubai', limit: 20 }
  });
  console.log(response.data.data.events);
};
```

---

## Getting API Keys

### Ticketmaster (5 minutes)
1. Go to https://developer.ticketmaster.com/
2. Sign up for free account
3. Click "Get your API key"
4. Create an app
5. Copy the "Consumer Key" (this is your API key)

### Eventbrite (5 minutes)
1. Go to https://www.eventbrite.com/platform/api
2. Sign in or create account
3. Click "Create Private Token"
4. Give it a name (e.g., "MIGO App")
5. Copy the OAuth token

### Meetup (10 minutes)
1. Go to https://www.meetup.com/
2. Sign in or create account
3. Go to https://secure.meetup.com/meetup_api/oauth_consumers/
4. Click "Create New OAuth Consumer"
5. Fill in details:
   - App name: MIGO
   - Website: http://localhost:5000
   - Redirect URI: http://localhost:5000/callback
6. Get your API Key

### Platinumlist (Contact Required)
- Email: support@platinumlist.net
- Subject: "API Access Request for MIGO App"
- Wait for response (may take 1-2 days)

---

## Common Issues

### "System user not found"
**Solution**: Run `npm run prisma:seed`

### "Unauthorized" errors
**Solution**: Make sure you're using a valid access token from login

### No events returned
**Solutions**:
- Check API keys are correct in `.env`
- Try different cities (e.g., "New York", "London", "Dubai")
- Check API provider status pages

### Events not syncing to database
**Solutions**:
- Verify system user exists: `SELECT * FROM User WHERE email='system@migo.events'`
- Check database connection
- Review server logs for errors

---

## What's Next?

1. **Test with Your Location**: Try fetching events for your city
2. **Set Up Automated Sync**: Add a cron job to sync events daily
3. **Mobile Integration**: Connect your React Native app to external events
4. **Add More Sources**: Extend to include Platinumlist when you have access

---

## Need Help?

- 📖 Full documentation: `EXTERNAL_EVENTS_GUIDE.md`
- 🔧 Implementation details: `IMPLEMENTATION_SUMMARY.md`
- 💬 Test commands: `node scripts/test-external-events.js help`

---

## Quick Commands Reference

```bash
# Seed database
npm run prisma:seed

# Start server
npm run dev

# Test script commands
node scripts/test-external-events.js login
node scripts/test-external-events.js health
node scripts/test-external-events.js fetch-all
node scripts/test-external-events.js sync-all
node scripts/test-external-events.js view-events
node scripts/test-external-events.js help

# Check database
mysql -u root -p
USE migo;
SELECT COUNT(*) FROM Event WHERE externalSource IS NOT NULL;
```

That's it! You're ready to aggregate events from multiple sources! 🎉
