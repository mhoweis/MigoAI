// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create system user for external events
  const systemPassword = await bcrypt.hash('system-secure-password-' + Date.now(), 10);

  await prisma.user.upsert({
    where: { email: 'system@migo.events' },
    update: {},
    create: {
      email: 'system@migo.events',
      password: systemPassword,
      name: 'MIGO System',
      phone: '+000000000000',
      preferences: {
        interests: [],
        notifications: false,
        theme: 'dark'
      }
    }
  });

  console.log('✅ System user created');

  // Create test user
  const hashedPassword = await bcrypt.hash('password123', 10);

  await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      password: hashedPassword,
      name: 'Test User',
      phone: '+1234567890',
      preferences: {
        interests: ['Music', 'Technology', 'Sports'],
        notifications: true,
        theme: 'light'
      }
    }
  });

  console.log('✅ Database seeded successfully');
}

main()
  .catch((error) => {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });