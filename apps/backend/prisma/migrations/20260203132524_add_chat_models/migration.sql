-- CreateTable
CREATE TABLE `chat_sessions` (
    `id` VARCHAR(191) NOT NULL,
    `session_id` VARCHAR(255) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(255) NULL,
    `context` JSON NULL,
    `message_count` INTEGER NOT NULL DEFAULT 0,
    `token_count` INTEGER NOT NULL DEFAULT 0,
    `duration_minutes` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `is_archived` BOOLEAN NOT NULL DEFAULT false,
    `archived_at` DATETIME(3) NULL,
    `last_message_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `chat_sessions_session_id_key`(`session_id`),
    INDEX `chat_sessions_user_id_idx`(`user_id`),
    INDEX `chat_sessions_session_id_idx`(`session_id`),
    INDEX `chat_sessions_is_active_idx`(`is_active`),
    INDEX `chat_sessions_is_archived_idx`(`is_archived`),
    INDEX `chat_sessions_last_message_at_idx`(`last_message_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chat_messages` (
    `id` VARCHAR(191) NOT NULL,
    `session_id` VARCHAR(191) NOT NULL,
    `role` VARCHAR(20) NOT NULL,
    `content` TEXT NOT NULL,
    `tokens` INTEGER NULL DEFAULT 0,
    `ai_model` VARCHAR(100) NULL,
    `ai_response_time` INTEGER NULL,
    `ai_usage` JSON NULL,
    `context` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `chat_messages_session_id_idx`(`session_id`),
    INDEX `chat_messages_role_idx`(`role`),
    INDEX `chat_messages_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `chat_sessions` ADD CONSTRAINT `chat_sessions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chat_messages` ADD CONSTRAINT `chat_messages_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `chat_sessions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
