-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(255) NULL,
    `phone` VARCHAR(20) NULL,
    `password` VARCHAR(255) NULL,
    `name` VARCHAR(255) NULL,
    `display_name` VARCHAR(255) NULL,
    `avatar` TEXT NULL,
    `avatar_url` TEXT NULL,
    `bio` TEXT NULL,
    `role` ENUM('USER', 'ADMIN', 'ORGANIZER') NOT NULL DEFAULT 'USER',
    `email_verified` BOOLEAN NOT NULL DEFAULT false,
    `phone_verified` BOOLEAN NOT NULL DEFAULT false,
    `is_verified` BOOLEAN NOT NULL DEFAULT false,
    `is_organizer` BOOLEAN NOT NULL DEFAULT false,
    `is_admin` BOOLEAN NOT NULL DEFAULT false,
    `interests` JSON NULL,
    `preferences` JSON NULL,
    `settings` JSON NULL,
    `event_count` INTEGER NULL DEFAULT 0,
    `wishlist_count` INTEGER NULL DEFAULT 0,
    `follower_count` INTEGER NULL DEFAULT 0,
    `following_count` INTEGER NULL DEFAULT 0,
    `phone_verification_code` VARCHAR(10) NULL,
    `phone_verification_expires` DATETIME(3) NULL,
    `firebase_uid` VARCHAR(255) NULL,
    `auth_method` VARCHAR(50) NULL,
    `google_id` VARCHAR(255) NULL,
    `apple_id` VARCHAR(255) NULL,
    `facebook_id` VARCHAR(255) NULL,
    `website` TEXT NULL,
    `twitter` VARCHAR(255) NULL,
    `instagram` VARCHAR(255) NULL,
    `linkedin` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `last_login_at` DATETIME(3) NULL,
    `last_active_at` DATETIME(3) NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_phone_key`(`phone`),
    UNIQUE INDEX `users_firebase_uid_key`(`firebase_uid`),
    UNIQUE INDEX `users_google_id_key`(`google_id`),
    UNIQUE INDEX `users_apple_id_key`(`apple_id`),
    UNIQUE INDEX `users_facebook_id_key`(`facebook_id`),
    INDEX `users_email_idx`(`email`),
    INDEX `users_phone_idx`(`phone`),
    INDEX `users_role_idx`(`role`),
    INDEX `users_created_at_idx`(`created_at`),
    INDEX `users_is_organizer_idx`(`is_organizer`),
    INDEX `users_is_verified_idx`(`is_verified`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `events` (
    `id` VARCHAR(191) NOT NULL,
    `migo_id` VARCHAR(255) NULL,
    `slug` VARCHAR(255) NULL,
    `title` VARCHAR(255) NOT NULL,
    `tagline` VARCHAR(500) NULL,
    `description` TEXT NOT NULL,
    `short_description` VARCHAR(500) NULL,
    `category` VARCHAR(100) NOT NULL,
    `subcategory` VARCHAR(100) NULL,
    `tags` JSON NULL,
    `start_date` DATETIME(3) NOT NULL,
    `end_date` DATETIME(3) NULL,
    `duration_minutes` INTEGER NULL,
    `timezone` VARCHAR(50) NOT NULL DEFAULT 'UTC',
    `is_recurring` BOOLEAN NOT NULL DEFAULT false,
    `venue_name` VARCHAR(255) NULL,
    `address` TEXT NULL,
    `city` VARCHAR(100) NULL,
    `country` VARCHAR(100) NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `location_type` ENUM('VENUE', 'ONLINE', 'HYBRID') NOT NULL DEFAULT 'VENUE',
    `online_url` TEXT NULL,
    `price_from` DECIMAL(10, 2) NULL,
    `price_to` DECIMAL(10, 2) NULL,
    `currency` VARCHAR(3) NOT NULL DEFAULT 'USD',
    `is_free` BOOLEAN NOT NULL DEFAULT false,
    `ticket_url` TEXT NULL,
    `booking_type` ENUM('FREE', 'PAID', 'DONATION', 'RSVP') NOT NULL DEFAULT 'PAID',
    `capacity` INTEGER NULL DEFAULT 0,
    `tickets_sold` INTEGER NULL DEFAULT 0,
    `tickets_available` INTEGER NULL DEFAULT 0,
    `images` JSON NULL,
    `cover_image` TEXT NULL,
    `thumbnail_image` TEXT NULL,
    `video_url` TEXT NULL,
    `gallery` JSON NULL,
    `is_pet_friendly` BOOLEAN NOT NULL DEFAULT false,
    `is_wheelchair_accessible` BOOLEAN NOT NULL DEFAULT false,
    `has_parking` BOOLEAN NOT NULL DEFAULT false,
    `has_food` BOOLEAN NOT NULL DEFAULT false,
    `has_drinks` BOOLEAN NOT NULL DEFAULT false,
    `has_wifi` BOOLEAN NOT NULL DEFAULT false,
    `facilities` JSON NULL,
    `dress_code` VARCHAR(100) NULL,
    `age_restriction` INTEGER NULL,
    `age_group` VARCHAR(50) NULL,
    `status` ENUM('DRAFT', 'PENDING', 'ACTIVE', 'CANCELLED', 'ARCHIVED', 'DELETED') NOT NULL DEFAULT 'PENDING',
    `visibility` ENUM('PUBLIC', 'UNLISTED', 'PRIVATE') NOT NULL DEFAULT 'PUBLIC',
    `is_featured` BOOLEAN NOT NULL DEFAULT false,
    `is_sponsored` BOOLEAN NOT NULL DEFAULT false,
    `is_verified` BOOLEAN NOT NULL DEFAULT false,
    `featured_order` INTEGER NULL,
    `featured_until` DATETIME(3) NULL,
    `external_id` VARCHAR(255) NULL,
    `external_source` VARCHAR(50) NULL,
    `external_url` TEXT NULL,
    `source` VARCHAR(50) NULL,
    `organizer_email` VARCHAR(255) NULL,
    `organizer_phone` VARCHAR(20) NULL,
    `support_email` VARCHAR(255) NULL,
    `support_phone` VARCHAR(20) NULL,
    `website` TEXT NULL,
    `social_links` JSON NULL,
    `views` INTEGER NULL DEFAULT 0,
    `unique_views` INTEGER NULL DEFAULT 0,
    `wishlist_count` INTEGER NULL DEFAULT 0,
    `share_count` INTEGER NULL DEFAULT 0,
    `click_count` INTEGER NULL DEFAULT 0,
    `rating_average` DOUBLE NULL DEFAULT 0,
    `rating_count` INTEGER NULL DEFAULT 0,
    `organizer_id` VARCHAR(191) NOT NULL,
    `category_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `published_at` DATETIME(3) NULL,
    `approved_at` DATETIME(3) NULL,

    UNIQUE INDEX `events_migo_id_key`(`migo_id`),
    UNIQUE INDEX `events_slug_key`(`slug`),
    UNIQUE INDEX `events_external_id_key`(`external_id`),
    INDEX `events_organizer_id_idx`(`organizer_id`),
    INDEX `events_category_idx`(`category`),
    INDEX `events_subcategory_idx`(`subcategory`),
    INDEX `events_city_idx`(`city`),
    INDEX `events_country_idx`(`country`),
    INDEX `events_start_date_idx`(`start_date`),
    INDEX `events_status_idx`(`status`),
    INDEX `events_visibility_idx`(`visibility`),
    INDEX `events_is_featured_idx`(`is_featured`),
    INDEX `events_is_free_idx`(`is_free`),
    INDEX `events_is_pet_friendly_idx`(`is_pet_friendly`),
    INDEX `events_rating_average_idx`(`rating_average`),
    INDEX `events_wishlist_count_idx`(`wishlist_count`),
    INDEX `events_created_at_idx`(`created_at`),
    INDEX `events_slug_idx`(`slug`),
    INDEX `events_category_id_idx`(`category_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bookings` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `event_id` VARCHAR(191) NOT NULL,
    `ticket_count` INTEGER NOT NULL DEFAULT 1,
    `total_amount` DECIMAL(10, 2) NULL,
    `currency` VARCHAR(3) NOT NULL DEFAULT 'USD',
    `status` ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'REFUNDED', 'CHECKED_IN') NOT NULL DEFAULT 'PENDING',
    `booking_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ticket_url` TEXT NULL,
    `qr_code` TEXT NULL,
    `transaction_id` VARCHAR(255) NULL,
    `payment_method` VARCHAR(50) NULL,
    `notes` TEXT NULL,
    `attendee_name` VARCHAR(255) NULL,
    `attendee_email` VARCHAR(255) NULL,
    `attendee_phone` VARCHAR(20) NULL,
    `checked_in_at` DATETIME(3) NULL,
    `checked_in_by` VARCHAR(255) NULL,

    INDEX `bookings_user_id_idx`(`user_id`),
    INDEX `bookings_event_id_idx`(`event_id`),
    INDEX `bookings_status_idx`(`status`),
    INDEX `bookings_booking_date_idx`(`booking_date`),
    UNIQUE INDEX `bookings_user_id_event_id_key`(`user_id`, `event_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reviews` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `event_id` VARCHAR(191) NOT NULL,
    `overall_rating` TINYINT NOT NULL DEFAULT 5,
    `title` VARCHAR(200) NULL,
    `comment` TEXT NULL,
    `is_recommended` BOOLEAN NOT NULL DEFAULT true,
    `is_featured` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `reviews_user_id_idx`(`user_id`),
    INDEX `reviews_event_id_idx`(`event_id`),
    INDEX `reviews_overall_rating_idx`(`overall_rating`),
    INDEX `reviews_is_featured_idx`(`is_featured`),
    INDEX `reviews_created_at_idx`(`created_at`),
    UNIQUE INDEX `reviews_user_id_event_id_key`(`user_id`, `event_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wishlists` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `event_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `wishlists_user_id_idx`(`user_id`),
    INDEX `wishlists_event_id_idx`(`event_id`),
    UNIQUE INDEX `wishlists_user_id_event_id_key`(`user_id`, `event_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refresh_tokens` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `revoked` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `refresh_tokens_token_key`(`token`),
    INDEX `refresh_tokens_userId_idx`(`userId`),
    INDEX `refresh_tokens_token_idx`(`token`),
    INDEX `refresh_tokens_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `passkeys` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `credentialID` VARCHAR(191) NOT NULL,
    `publicKey` LONGBLOB NOT NULL,
    `counter` BIGINT NOT NULL,
    `deviceType` VARCHAR(50) NULL,
    `backedUp` BOOLEAN NOT NULL DEFAULT false,
    `transports` JSON NULL,
    `lastUsedAt` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `passkeys_credentialID_key`(`credentialID`),
    INDEX `passkeys_userId_idx`(`userId`),
    INDEX `passkeys_credentialID_idx`(`credentialID`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `passkey_challenges` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `challenge` VARCHAR(191) NOT NULL,
    `type` VARCHAR(20) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `passkey_challenges_userId_idx`(`userId`),
    INDEX `passkey_challenges_type_idx`(`type`),
    INDEX `passkey_challenges_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `event_views` (
    `id` VARCHAR(191) NOT NULL,
    `event_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NULL,
    `session_id` VARCHAR(255) NULL,
    `source` VARCHAR(50) NOT NULL,
    `device_type` VARCHAR(50) NULL,
    `user_agent` TEXT NULL,
    `ip_address` VARCHAR(45) NULL,
    `viewed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `event_views_event_id_idx`(`event_id`),
    INDEX `event_views_user_id_idx`(`user_id`),
    INDEX `event_views_viewed_at_idx`(`viewed_at`),
    INDEX `event_views_source_idx`(`source`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `search_logs` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NULL,
    `event_id` VARCHAR(191) NULL,
    `query` VARCHAR(255) NOT NULL,
    `filters` JSON NULL,
    `results_count` INTEGER NOT NULL,
    `device_type` VARCHAR(50) NULL,
    `user_agent` TEXT NULL,
    `ip_address` VARCHAR(45) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `search_logs_user_id_idx`(`user_id`),
    INDEX `search_logs_query_idx`(`query`),
    INDEX `search_logs_created_at_idx`(`created_at`),
    INDEX `search_logs_event_id_idx`(`event_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `organizer_profiles` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `business_name` VARCHAR(255) NOT NULL,
    `business_email` VARCHAR(255) NULL,
    `business_phone` VARCHAR(20) NULL,
    `business_website` TEXT NULL,
    `description` TEXT NULL,
    `logo` TEXT NULL,
    `banner` TEXT NULL,
    `tax_id` VARCHAR(50) NULL,
    `vat_number` VARCHAR(50) NULL,
    `social_links` JSON NULL,
    `total_events` INTEGER NOT NULL DEFAULT 0,
    `total_sales` DECIMAL(12, 2) NULL DEFAULT 0,
    `average_rating` DOUBLE NULL DEFAULT 0,
    `review_count` INTEGER NOT NULL DEFAULT 0,
    `is_verified` BOOLEAN NOT NULL DEFAULT false,
    `verified_at` DATETIME(3) NULL,
    `stripe_account_id` VARCHAR(255) NULL,
    `bank_account` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `organizer_profiles_user_id_key`(`user_id`),
    INDEX `organizer_profiles_user_id_idx`(`user_id`),
    INDEX `organizer_profiles_business_name_idx`(`business_name`),
    INDEX `organizer_profiles_is_verified_idx`(`is_verified`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categories` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `icon` VARCHAR(50) NULL,
    `color` VARCHAR(7) NULL,
    `parent_id` VARCHAR(191) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `categories_name_key`(`name`),
    UNIQUE INDEX `categories_slug_key`(`slug`),
    INDEX `categories_slug_idx`(`slug`),
    INDEX `categories_parent_id_idx`(`parent_id`),
    INDEX `categories_sort_order_idx`(`sort_order`),
    INDEX `categories_is_active_idx`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tags` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `usage_count` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `tags_name_key`(`name`),
    UNIQUE INDEX `tags_slug_key`(`slug`),
    INDEX `tags_slug_idx`(`slug`),
    INDEX `tags_usage_count_idx`(`usage_count`),
    INDEX `tags_is_active_idx`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `data` JSON NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `is_sent` BOOLEAN NOT NULL DEFAULT false,
    `send_at` DATETIME(3) NULL,
    `sent_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `notifications_user_id_idx`(`user_id`),
    INDEX `notifications_type_idx`(`type`),
    INDEX `notifications_is_read_idx`(`is_read`),
    INDEX `notifications_is_sent_idx`(`is_sent`),
    INDEX `notifications_send_at_idx`(`send_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `device_tokens` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `token` VARCHAR(500) NOT NULL,
    `platform` VARCHAR(20) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `device_tokens_token_key`(`token`),
    INDEX `device_tokens_user_id_idx`(`user_id`),
    INDEX `device_tokens_platform_idx`(`platform`),
    INDEX `device_tokens_is_active_idx`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `events` ADD CONSTRAINT `events_organizer_id_fkey` FOREIGN KEY (`organizer_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `events` ADD CONSTRAINT `events_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wishlists` ADD CONSTRAINT `wishlists_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wishlists` ADD CONSTRAINT `wishlists_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `passkeys` ADD CONSTRAINT `passkeys_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `passkey_challenges` ADD CONSTRAINT `passkey_challenges_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_views` ADD CONSTRAINT `event_views_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_views` ADD CONSTRAINT `event_views_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `search_logs` ADD CONSTRAINT `search_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `search_logs` ADD CONSTRAINT `search_logs_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `organizer_profiles` ADD CONSTRAINT `organizer_profiles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `categories` ADD CONSTRAINT `categories_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `device_tokens` ADD CONSTRAINT `device_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
