# External Events Integration Guide

This guide explains how to use the external events integration to fetch and sync events from Ticketmaster, Eventbrite, Meetup, and Platinumlist APIs.

## Setup

### 1. Add API Keys to .env

Copy the API keys you obtained to your `.env` file:

```bash
# Event Data APIs
TICKETMASTER_API_KEY="your-actual-ticketmaster-api-key"
EVENTBRITE_API_KEY="your-actual-eventbrite-oauth-token"
MEETUP_API_KEY="your-actual-meetup-api-key"
PLATINUMLIST_API_KEY="your-actual-platinumlist-api-key"
```

### 2. Run Database Seed

Create the system user required for external events:

```bash
cd apps/backend
npm run prisma:seed
```

Or manually with:

```bash
npx prisma db seed
```

### 3. Start the Server

```bash
npm run dev
```

## API Endpoints

All endpoints require authentication (Bearer token).

### 1. Fetch Events from All Sources

**GET** `/api/external-events/fetch`

Fetches events from Ticketmaster, Eventbrite, and Meetup in parallel.

**Query Parameters:**
- `city` (optional): Filter by city (e.g., "Dubai", "New York")
- `country` (optional): Filter by country code (e.g., "AE", "US")
- `keyword` (optional): Search keyword (e.g., "concert", "tech")

**Example:**
```bash
curl -X GET "http://localhost:5000/api/external-events/fetch?city=Dubai&keyword=music" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "count": 45,
  "data": [
    {
      "externalId": "tm123",
      "externalSource": "ticketmaster",
      "name": "Concert at Dubai Opera",
      "description": "Amazing concert...",
      "startDate": "2024-03-20T19:00:00.000Z",
      "city": "Dubai",
      "country": "AE",
      "price": 250,
      "currency": "AED"
    }
  ]
}
```

### 2. Fetch from Specific Source

#### Ticketmaster
**GET** `/api/external-events/ticketmaster`

**Query Parameters:**
- `city`: City name
- `countryCode`: Country code (e.g., "US", "AE")
- `keyword`: Search term
- `startDateTime`: ISO date string
- `size`: Number of results (max 100)

**Example:**
```bash
curl -X GET "http://localhost:5000/api/external-events/ticketmaster?city=Dubai&countryCode=AE&size=20" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Eventbrite
**GET** `/api/external-events/eventbrite`

**Query Parameters:**
- `location`: Location name
- `q`: Search query
- `startDate`: ISO date string

**Example:**
```bash
curl -X GET "http://localhost:5000/api/external-events/eventbrite?location=Dubai&q=technology" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Meetup
**GET** `/api/external-events/meetup`

**Query Parameters:**
- `lat`: Latitude (default: 25.2048 for Dubai)
- `lon`: Longitude (default: 55.2708 for Dubai)
- `radius`: Search radius in km (default: 50)
- `text`: Search text

**Example:**
```bash
curl -X GET "http://localhost:5000/api/external-events/meetup?lat=25.2048&lon=55.2708&radius=25&text=tech" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Platinumlist
**GET** `/api/external-events/platinumlist`

**Query Parameters:**
- `city`: City name (default: "Dubai")
- `category`: Event category
- `date`: Date filter
- `limit`: Number of results (default: 20)

**Example:**
```bash
curl -X GET "http://localhost:5000/api/external-events/platinumlist?city=Dubai&category=nightlife&limit=20" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 3. Sync Events to Database

#### Sync from All Sources
**POST** `/api/external-events/sync`

Fetches events from all sources and saves them to the database.

**Body:**
```json
{
  "city": "Dubai",
  "country": "AE",
  "keyword": "music"
}
```

**Example:**
```bash
curl -X POST "http://localhost:5000/api/external-events/sync" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "city": "Dubai",
    "keyword": "concert"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Events synced successfully",
  "data": {
    "fetched": 45,
    "created": 38,
    "updated": 7,
    "errors": 0
  }
}
```

#### Sync from Specific Source
**POST** `/api/external-events/sync/:source`

**Parameters:**
- `source`: One of `ticketmaster`, `eventbrite`, or `meetup`

**Body:** Same as the fetch endpoint for that source

**Example:**
```bash
curl -X POST "http://localhost:5000/api/external-events/sync/ticketmaster" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "city": "Dubai",
    "countryCode": "AE",
    "size": 50
  }'
```

## Usage Workflow

### Initial Setup

1. **Add API Keys**: Add your API keys to `.env` file
2. **Seed Database**: Run `npm run prisma:seed` to create system user
3. **Test Connection**: Test each API individually first

### Testing Individual APIs

Test each API separately to ensure your keys are working:

```bash
# Test Ticketmaster
curl -X GET "http://localhost:5000/api/external-events/ticketmaster?city=Dubai&countryCode=AE" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test Eventbrite
curl -X GET "http://localhost:5000/api/external-events/eventbrite?location=Dubai" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test Meetup
curl -X GET "http://localhost:5000/api/external-events/meetup?text=tech" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test Platinumlist
curl -X GET "http://localhost:5000/api/external-events/platinumlist?city=Dubai" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Syncing Events

Once APIs are working, sync events to your database:

```bash
# Sync all events from Dubai
curl -X POST "http://localhost:5000/api/external-events/sync" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"city": "Dubai", "country": "AE"}'
```

### Viewing Synced Events

Events will be available through the regular events API:

```bash
# Get all events (including external)
curl -X GET "http://localhost:5000/api/events?city=Dubai" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Filter by external source
curl -X GET "http://localhost:5000/api/events?city=Dubai&search=ticketmaster" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Data Mapping

External events are automatically mapped to your database schema:

| External Field | Database Field | Notes |
|---------------|---------------|-------|
| Event ID | `externalId` | Unique identifier from source |
| Source | `externalSource` | "ticketmaster", "eventbrite", "meetup" |
| Name | `name` | Event title |
| Description | `description` | Event details |
| Start Time | `startDate` | DateTime |
| End Time | `endDate` | DateTime (optional) |
| Venue | `location` | Venue name |
| Address | `address` | Full address |
| City | `city` | City name |
| Country | `country` | Country code |
| Coordinates | `latitude`, `longitude` | GPS coordinates |
| Image | `imageUrl` | Primary image URL |
| Price | `price` | Minimum price |
| Currency | `currency` | Price currency |
| Category | `category` | Mapped to EventCategory enum |
| URL | `externalUrl` | Link to original event |

## Category Mapping

External categories are automatically mapped to your EventCategory enum:

- Music → MUSIC
- Sports → SPORTS
- Arts/Theater → ART
- Family → FAMILY
- Food → FOOD
- Nightlife → NIGHTLIFE
- Business → BUSINESS
- Tech/Technology → TECHNOLOGY
- Education → EDUCATION
- Health/Fitness → HEALTH
- Community → COMMUNITY
- Others → OTHER

## Duplicate Prevention

The system prevents duplicate events by checking `externalId` and `externalSource`:

- **New Event**: Creates new record with `organizerId` set to system user
- **Existing Event**: Updates the existing record with latest data
- **External ID**: Unique constraint ensures no duplicates per source

## Scheduled Syncing

To keep events up-to-date, you can set up automated syncing:

### Option 1: Cron Job (Linux/Mac)

```bash
# Edit crontab
crontab -e

# Add daily sync at 2 AM
0 2 * * * curl -X POST "http://localhost:5000/api/external-events/sync" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"city": "Dubai"}'
```

### Option 2: Node Scheduler (In your app)

Install `node-cron`:
```bash
npm install node-cron
```

Create `apps/backend/src/schedulers/event-sync.ts`:
```typescript
import cron from 'node-cron';
import externalEventsService from '../services/external-events.service';
import logger from '../utils/logger';

// Sync events daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  logger.info('Starting scheduled event sync...');

  const events = await externalEventsService.fetchAllEvents({
    city: 'Dubai',
    country: 'AE',
  });

  const result = await externalEventsService.syncEventsToDatabase(events);

  logger.info('Scheduled sync complete:', result);
});
```

## Error Handling

The service handles errors gracefully:

- **Missing API Key**: Logs warning and returns empty array
- **API Timeout**: Logs error and continues with other sources
- **Invalid Response**: Skips invalid events and continues
- **Database Error**: Increments error count but continues processing

Check logs for detailed error information:
```bash
tail -f logs/app.log
```

## Rate Limiting

Be aware of API rate limits:

- **Ticketmaster**: 5,000 requests/day (free tier)
- **Eventbrite**: Varies by plan
- **Meetup**: 200 requests/hour (standard)
- **Platinumlist**: Contact provider for limits

Consider:
- Caching responses
- Limiting sync frequency
- Using webhooks when available

## Troubleshooting

### No Events Returned

1. Check API keys are correct in `.env`
2. Verify API key has necessary permissions
3. Check API status pages for outages
4. Review server logs for error messages

### Events Not Syncing

1. Ensure system user exists: `SELECT * FROM User WHERE email='system@migo.events'`
2. Check database connection
3. Verify Prisma schema matches database
4. Review sync endpoint response for errors

### Categories Not Mapping

Categories are mapped using keyword matching. If events have wrong categories:
1. Update `mapToEventCategory()` in `external-events.service.ts`
2. Add more category keywords
3. Handle specific API category formats

## Next Steps

1. **Add More Sources**: Extend the service to include Platinumlist and PredictHQ
2. **Webhooks**: Implement webhook listeners for real-time updates
3. **Caching**: Add Redis caching for frequently requested events
4. **Analytics**: Track which sources provide most popular events
5. **User Preferences**: Sync based on user location and interests
6. **Mobile Integration**: Add sync triggers from mobile app

## Support

For API-specific issues:
- **Ticketmaster**: https://developer.ticketmaster.com/support/
- **Eventbrite**: https://www.eventbrite.com/platform/docs/
- **Meetup**: https://www.meetup.com/api/
- **Platinumlist**: support@platinumlist.net
