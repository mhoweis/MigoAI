#!/usr/bin/env node
/**
 * Platinumlist CSV Import Script
 *
 * Usage:
 *   node scripts/import-platinumlist.js /path/to/platinumlist-export.csv
 *
 * Expected columns (15 columns total, tab or comma separated):
 *   Column 0  → Event ID
 *   Column 1  → Event name
 *   Column 2  → URL
 *   Column 3  → All categories
 *   Column 4  → Venue
 *   Column 5  → City           (separate column)
 *   Column 6  → Country        (separate column)
 *   Column 7  → Img 1600x615
 *   Column 8  → Img 768x768
 *   Column 9  → Min price
 *   Column 10 → Currency
 *   Column 11 → Commission
 *   Column 12 → Start datetime (separate column)
 *   Column 13 → End datetime   (separate column)
 *   Column 14 → Description
 *
 * Affiliate ref: nmu2yjg
 * Events are upserted using externalId = "pl-{Event ID}" so re-running is safe.
 */

const fs   = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ─── Affiliate config ─────────────────────────────────────────────────────────
const PLATINUMLIST_REF  = 'nmu2yjg';
const PLATINUMLIST_BASE = 'https://platinumlist.net';
const AFF_BASE          = `https://platinumlist.net/aff/?ref=${PLATINUMLIST_REF}&link=`;

function affiliateUrl(eventUrl) {
  const dest = (eventUrl || '').trim() || PLATINUMLIST_BASE;
  return `${AFF_BASE}${encodeURIComponent(dest)}`;
}

// ─── Category mapper ──────────────────────────────────────────────────────────
function mapCategory(rawCategories) {
  const raw = (rawCategories || '').toLowerCase();
  if (raw.includes('music') || raw.includes('concert') || raw.includes('dj'))         return 'Music';
  if (raw.includes('sport') || raw.includes('fitness') || raw.includes('marathon'))   return 'Sports';
  if (raw.includes('art') || raw.includes('exhibition') || raw.includes('gallery'))   return 'Art';
  if (raw.includes('food') || raw.includes('iftar') || raw.includes('suhoor') ||
      raw.includes('dining') || raw.includes('brunch') || raw.includes('restaurant')) return 'Food';
  if (raw.includes('tech') || raw.includes('digital') || raw.includes('startup'))     return 'Tech';
  if (raw.includes('business') || raw.includes('conference') || raw.includes('seminar')) return 'Business';
  if (raw.includes('kids') || raw.includes('family') || raw.includes('children'))     return 'Family';
  if (raw.includes('theater') || raw.includes('theatrical') || raw.includes('comedy') ||
      raw.includes('play') || raw.includes('show') || raw.includes('stand-up'))       return 'Theater';
  if (raw.includes('ramadan'))  return 'Food';
  if (raw.includes('wellness') || raw.includes('yoga') || raw.includes('spa'))        return 'Wellness';
  // Extract first readable subcategory as fallback
  const firstGroup = (rawCategories || '').split(';')[0] || '';
  const parts      = firstGroup.split(',');
  const sub        = (parts[parts.length - 1] || parts[0] || 'Other').trim();
  return sub || 'Other';
}

// ─── Date parser ──────────────────────────────────────────────────────────────
// Handles Platinumlist format: "Feb 21, 2026, 2:15:00 PM"
// Also handles truncated formats from Looker Studio: "Feb 21 2026 2:15:…"
function parseDate(raw) {
  if (!raw || raw.trim() === '') return null;

  let cleaned = raw.trim();

  // Remove the extra comma: "Feb 21, 2026, 2:15:00 PM" → "Feb 21, 2026 2:15:00 PM"
  cleaned = cleaned.replace(/(\d{4}),\s*/, '$1 ');

  // Remove ellipsis character (Looker Studio truncation): "Feb 21 2026 2:15:…" → "Feb 21 2026 2:15:"
  cleaned = cleaned.replace(/…/g, '');

  // If the time is incomplete (ends with : or no AM/PM), try to fix it
  if (cleaned.match(/\d{1,2}:\d{0,2}:?\s*$/)) {
    // Has time but no AM/PM, likely truncated - add default time completion
    cleaned = cleaned.replace(/:$/, ':00'); // Remove trailing colon
    if (!cleaned.match(/[AP]M/i)) {
      cleaned += ' PM'; // Most events are PM
    }
  }

  const d = new Date(cleaned);
  return isNaN(d.getTime()) ? null : d;
}

// ─── CSV/TSV parser ───────────────────────────────────────────────────────────
// Handles tab-separated (TSV) as primary; falls back to comma-separated with
// proper quote handling for CSV files.
function parseRows(content) {
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  if (lines.length === 0) return [];

  // Detect separator: if the header line has more tabs than commas, use TSV
  const headerLine = lines[0];
  const tabCount   = (headerLine.match(/\t/g) || []).length;
  const commaCount = (headerLine.match(/,/g) || []).length;
  const sep        = tabCount >= commaCount ? '\t' : null; // null = use CSV parser

  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    let cols;
    if (sep === '\t') {
      cols = line.split('\t');
    } else {
      // Minimal RFC 4180 CSV parser
      cols = [];
      let cur = '';
      let inQ = false;
      for (let c = 0; c < line.length; c++) {
        const ch = line[c];
        if (inQ) {
          if (ch === '"') {
            if (line[c + 1] === '"') { cur += '"'; c++; } // escaped quote
            else inQ = false;
          } else {
            cur += ch;
          }
        } else {
          if (ch === '"') { inQ = true; }
          else if (ch === ',') { cols.push(cur); cur = ''; }
          else { cur += ch; }
        }
      }
      cols.push(cur);
    }

    rows.push(cols.map(c => c.trim()));
  }

  return rows;
}

// ─── Column indices (0-based) — matching the order in the user's export ───────
const COL = {
  EVENT_ID:    0,
  NAME:        1,
  URL:         2,
  CATEGORIES:  3,
  VENUE:       4,
  CITY:        5,
  COUNTRY:     6,
  IMG_WIDE:    7,
  IMG_SQUARE:  8,
  MIN_PRICE:   9,
  CURRENCY:    10,
  COMMISSION:  11,
  START_DATE:  12,
  END_DATE:    13,
  DESCRIPTION: 14,
};

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('❌  Usage: node scripts/import-platinumlist.js <path-to-csv>');
    process.exit(1);
  }

  const absPath = path.resolve(filePath);
  if (!fs.existsSync(absPath)) {
    console.error(`❌  File not found: ${absPath}`);
    process.exit(1);
  }

  // Get the system user that owns all external events
  const systemUser = await prisma.user.findUnique({
    where: { email: 'system@migo.events' },
  });

  if (!systemUser) {
    console.error('❌  System user (system@migo.events) not found.');
    console.error('    Run: npm run prisma:seed');
    process.exit(1);
  }

  const content = fs.readFileSync(absPath, 'utf-8');
  const rows    = parseRows(content);

  console.log(`\n📂  File : ${absPath}`);
  console.log(`📊  Rows : ${rows.length} events to import\n`);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    const rawId       = (row[COL.EVENT_ID]    || '').trim();
    const rawName     = (row[COL.NAME]         || '').trim();
    const rawUrl      = (row[COL.URL]          || '').trim();
    const rawCats     = (row[COL.CATEGORIES]   || '').trim();
    const rawVenue    = (row[COL.VENUE]        || '').trim();
    const rawCity     = (row[COL.CITY]         || '').trim();
    const rawCountry  = (row[COL.COUNTRY]      || '').trim();
    const rawImgWide  = (row[COL.IMG_WIDE]     || '').trim();
    const rawImgSq    = (row[COL.IMG_SQUARE]   || '').trim();
    const rawPrice    = (row[COL.MIN_PRICE]    || '0').trim();
    const rawCurrency = (row[COL.CURRENCY]     || 'AED').trim();
    const rawStart    = (row[COL.START_DATE]   || '').trim();
    const rawEnd      = (row[COL.END_DATE]     || '').trim();
    const rawDesc     = (row[COL.DESCRIPTION]  || '').trim();

    if (!rawId || !rawName) { skipped++; continue; }

    const startDate = parseDate(rawStart);
    if (!startDate) {
      console.warn(`  ⚠️  Row ${i + 2}: skipping "${rawName}" — invalid date: "${rawStart}"`);
      skipped++;
      continue;
    }

    const minPrice  = parseFloat(rawPrice) || 0;
    const isFree    = minPrice === 0;
    const externalId = `pl-${rawId}`;

    // Description: if empty or just punctuation, use a fallback
    const description = rawDesc && rawDesc.replace(/[.]/g, '').trim()
      ? rawDesc
      : `${rawName} at ${rawVenue || rawCity || 'the venue'}.`;

    const eventData = {
      title:          rawName,
      description,
      category:       mapCategory(rawCats),
      venueName:      rawVenue   || null,
      city:           rawCity    || null,
      country:        rawCountry || null,
      coverImage:     rawImgWide  || null,
      thumbnailImage: rawImgSq    || null,
      priceFrom:      isFree ? null : minPrice,
      currency:       rawCurrency || 'AED',
      isFree,
      startDate,
      endDate:        parseDate(rawEnd) || null,
      externalId,
      externalSource: 'platinumlist',
      externalUrl:    affiliateUrl(rawUrl),
      source:         'platinumlist',
      status:         'ACTIVE',
      visibility:     'PUBLIC',
      isVerified:     true,
      organizerId:    systemUser.id,
      bookingType:    isFree ? 'FREE' : 'PAID',
    };

    try {
      const existing = await prisma.event.findUnique({ where: { externalId } });

      if (existing) {
        await prisma.event.update({ where: { externalId }, data: eventData });
        updated++;
        process.stdout.write(`  ✏️  Updated : ${rawName}\n`);
      } else {
        await prisma.event.create({ data: eventData });
        created++;
        process.stdout.write(`  ✅  Created : ${rawName}\n`);
      }
    } catch (err) {
      console.error(`  ❌  Failed  : ${rawName} — ${err.message}`);
      skipped++;
    }
  }

  console.log('\n─────────────────────────────────────');
  console.log(`✅  Created : ${created}`);
  console.log(`✏️   Updated : ${updated}`);
  console.log(`⚠️   Skipped : ${skipped}`);
  console.log(`📦  Total   : ${rows.length}`);
  console.log('─────────────────────────────────────\n');
}

main()
  .catch(err => {
    console.error('❌  Fatal error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
