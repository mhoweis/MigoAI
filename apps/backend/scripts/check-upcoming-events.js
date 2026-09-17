#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUpcomingEvents() {
  try {
    const now = new Date();

    const upcomingEvents = await prisma.event.count({
      where: {
        startDate: { gte: now },
        externalSource: 'ticketmaster',
      },
    });

    const pastEvents = await prisma.event.count({
      where: {
        startDate: { lt: now },
        externalSource: 'ticketmaster',
      },
    });

    console.log(`\n📊 Ticketmaster Events:`);
    console.log(`   Upcoming events (>= ${now.toLocaleDateString()}): ${upcomingEvents}`);
    console.log(`   Past events: ${pastEvents}`);

    if (upcomingEvents > 0) {
      const sampleEvents = await prisma.event.findMany({
        where: {
          startDate: { gte: now },
          externalSource: 'ticketmaster',
        },
        take: 10,
        orderBy: { startDate: 'asc' },
        select: {
          id: true,
          title: true,
          city: true,
          startDate: true,
          status: true,
          visibility: true,
        },
      });

      console.log(`\n📋 Upcoming Ticketmaster Events:`);
      sampleEvents.forEach((event, i) => {
        console.log(`   ${i + 1}. ${event.title}`);
        console.log(`      City: ${event.city || 'N/A'}`);
        console.log(`      Date: ${new Date(event.startDate).toLocaleDateString()}`);
        console.log(`      Status: ${event.status}`);
        console.log(`      Visibility: ${event.visibility}\n`);
      });
    } else {
      console.log(`\n⚠️  No upcoming Ticketmaster events found!`);
      console.log(`   This might mean all synced events are in the past.`);
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkUpcomingEvents();
