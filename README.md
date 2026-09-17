# Migo - Event Discovery App

Migo is a mobile application for discovering, booking, and managing events. Built with React Native for the frontend and Node.js/Express for the backend.

## Features

- 🔐 User Authentication (Email/Password, Social Login)
- 📅 Event Discovery with Advanced Filtering
- 💰 Online Ticket Booking & Payments
- 🤖 AI Chat Assistant for Recommendations
- 👤 User Profiles with Interests
- 📱 Cross-platform (iOS & Android)

## Tech Stack

### Frontend
- React Native
- TypeScript
- Expo
- React Navigation
- Zustand (State Management)
- React Native Vector Icons

### Backend
- Node.js
- Express.js
- TypeScript
- MySQL Database
- Prisma ORM
- JWT Authentication
- Zod Validation

## Project Structure
MigoEvent/
├── frontend/ # React Native app
│ ├── src/
│ │ ├── screens/
│ │ ├── services/
│ │ ├── store/
│ │ └── utils/
│ └── package.json
├── backend/ # Node.js/Express API
│ ├── src/
│ │ ├── api/
│ │ ├── config/
│ │ ├── services/
│ │ └── utils/
│ └── package.json
└── README.md


## Getting Started

### Prerequisites
- Node.js 16+
- MySQL 8+
- Expo CLI
- iOS Simulator (Mac) or Android Studio

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/MigoEvent.git
cd MigoEvent

### Backend Setup

cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npx prisma db push
npm run dev


### Frontend Setup

cd frontend
npm install
expo start

API Documentation
Authentication
POST /api/auth/register - Register new user

POST /api/auth/login - Login user

POST /api/auth/refresh-token - Refresh JWT token

POST /api/auth/logout - Logout user

Events
GET /api/events - Get events with filters

GET /api/events/:id - Get event details

POST /api/events - Create event (organizer)

PUT /api/events/:id - Update event

DELETE /api/events/:id - Delete event

Database Schema
Key tables:

users - User accounts and profiles

events - Event listings

bookings - Event bookings

reviews - User reviews

wishlists - Saved events

payments - Payment records

License
This project is proprietary and confidential.

Support
For support, email support@migoapp.com or open an issue in the GitHub repository.
