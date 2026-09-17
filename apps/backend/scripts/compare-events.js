#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function compareEvents() {
  try {
    console.log('🔍 Comparing local vs Ticketmaster events...\n');

    // Get a local event
    const localEvent = await prisma.event.findFirst({
      where: { externalSource: null },
    });

    // Get a Ticketmaster event
    const tmEvent = await prisma.event.findFirst({
      where: {
        externalSource: 'ticketmaster',
        startDate: { gte: new Date() },
      },
    });

    if (!localEvent) {
      console.log('❌ No local events found');
    } else {
      console.log('✅ Local Event:');
      console.log(JSON.stringify(localEvent, null, 2));
    }

    console.log('\n' + '='.repeat(80) + '\n');

    if (!tmEvent) {
      console.log('❌ No Ticketmaster events found');
    } else {
      console.log('✅ Ticketmaster Event:');
      console.log(JSON.stringify(tmEvent, null, 2));
    }

    // Compare key fields
    if (localEvent && tmEvent) {
      console.log('\n' + '='.repeat(80));
      console.log('\n🔎 Key Differences:\n');

      const fields = ['status', 'visibility', 'organizerId', 'title', 'description', 'city', 'startDate'];

      fields.forEach(field => {
        const localVal = localEvent[field];
        const tmVal = tmEvent[field];

        if (localVal !== tmVal && field !== 'title' && field !== 'description' && field !== 'startDate') {
          console.log(`   ${field}:`);
          console.log(`      Local:        ${localVal}`);
          console.log(`      Ticketmaster: ${tmVal}`);
        }
      });
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

compareEvents();
