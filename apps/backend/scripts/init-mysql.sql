-- Create database
CREATE DATABASE IF NOT EXISTS event_booking_db;
USE event_booking_db;

-- Create users table
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20) UNIQUE,
    name VARCHAR(255),
    avatar TEXT,
    preferences JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    auth_provider VARCHAR(50),
    provider_id VARCHAR(255),
    passkey_id VARCHAR(255) UNIQUE,
    passkey_public_key TEXT,
    INDEX idx_email (email),
    INDEX idx_phone (phone)
);

-- Create events table
CREATE TABLE events (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    date DATETIME NOT NULL,
    location JSON NOT NULL,
    price_range JSON NOT NULL,
    images JSON NOT NULL,
    facilities JSON NOT NULL,
    age_restriction INT,
    dress_code VARCHAR(100),
    organizer_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    external_id VARCHAR(255) UNIQUE,
    external_source VARCHAR(50),
    INDEX idx_category (category),
    INDEX idx_date (date),
    INDEX idx_organizer (organizer_id),
    FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create bookings table
CREATE TABLE bookings (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    event_id VARCHAR(255) NOT NULL,
    ticket_count INT DEFAULT 1,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ticket_url TEXT,
    INDEX idx_user (user_id),
    INDEX idx_event (event_id),
    INDEX idx_status (status),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- Create reviews table
CREATE TABLE reviews (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    event_id VARCHAR(255) NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_event (user_id, event_id),
    INDEX idx_user (user_id),
    INDEX idx_event (event_id),
    INDEX idx_rating (rating),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- Create wishlists table
CREATE TABLE wishlists (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    event_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_event (user_id, event_id),
    INDEX idx_user (user_id),
    INDEX idx_event (event_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_events_organizer_date ON events(organizer_id, date);
CREATE INDEX idx_bookings_user_date ON bookings(user_id, booking_date);
CREATE INDEX idx_reviews_event_rating ON reviews(event_id, rating);