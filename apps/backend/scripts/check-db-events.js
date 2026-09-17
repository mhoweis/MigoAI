#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkEvents() {
  try {
    const totalEvents = await prisma.event.count();
    const ticketmasterEvents = await prisma.event.count({
      where: { externalSource: 'ticketmaster' },
    });

    console.log(`\n📊 Database Stats:`);
    console.log(`   Total events: ${totalEvents}`);
    console.log(`   Ticketmaster events: ${ticketmasterEvents}`);

    if (ticketmasterEvents > 0) {
      const sampleEvents = await prisma.event.findMany({
        where: { externalSource: 'ticketmaster' },
        take: 5,
        select: {
          id: true,
          title: true,
          city: true,
          startDate: true,
          status: true,
          visibility: true,
          externalSource: true,
        },
      });

      console.log(`\n📋 Sample Events:`);
      sampleEvents.forEach((event, i) => {
        console.log(`   ${i + 1}. ${event.title}`);
        console.log(`      City: ${event.city || 'N/A'}`);
        console.log(`      Date: ${new Date(event.startDate).toLocaleDateString()}`);
        console.log(`      Status: ${event.status}`);
        console.log(`      Visibility: ${event.visibility}`);
      });
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkEvents();
