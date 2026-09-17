// scripts/setup-env.js
const fs = require('fs');
const crypto = require('crypto');

console.log('🔧 Setting up Migo Backend Environment...');

// Generate random secrets
const generateSecret = () => crypto.randomBytes(32).toString('hex');

const envContent = `# ============================================
# Migo Backend - Environment Variables
# ============================================

# Application
NODE_ENV=development
PORT=5000
APP_URL=http://localhost:5000
CLIENT_URL=http://localhost:3000

# Database (MySQL)
DATABASE_URL="mysql://root:password@localhost:3306/migo_eventfinder"

# Authentication
JWT_SECRET=${generateSecret()}
JWT_REFRESH_SECRET=${generateSecret()}
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Cookie
COOKIE_SECRET=${generateSecret()}

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Redis
REDIS_URL=redis://localhost:6379

# Optional APIs (add your keys here)
# GEMINI_API_KEY=your_key_here
# STRIPE_SECRET_KEY=your_key_here
# TICKETMASTER_API_KEY=your_key_here
`;

fs.writeFileSync('.env', envContent);

console.log('✅ .env file created successfully!');
console.log('\n📋 Next steps:');
console.log('1. Update DATABASE_URL with your MySQL credentials');
console.log('2. Run: npm run prisma:migrate');
console.log('3. Run: npm run dev');
console.log('\n⚠️  Note:');
console.log('- Database should be running on MySQL');
console.log('- Redis is optional but recommended for caching');
console.log('- Add API keys to .env as needed');