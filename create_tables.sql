CREATE TABLE IF NOT EXISTS `longtermhire_uploads` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `url` VARCHAR(512) NOT NULL,
  `caption` VARCHAR(512),
  `user_id` INT,
  `width` INT,
  `height` INT,
  `type` INT DEFAULT 0 NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `longtermhire_tokens` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `token` VARCHAR(512) NOT NULL,
  `code` VARCHAR(512) NOT NULL,
  `type` INT DEFAULT 0 NOT NULL,
  `data` TEXT,
  `status` INT DEFAULT 1 NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `expired_at` TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `longterm-hire_preference` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `first_name` VARCHAR(512),
  `last_name` VARCHAR(512),
  `phone` VARCHAR(512),
  `photo` VARCHAR(512),
  `user_id` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `longtermhire_user` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(512) NOT NULL,
  `password` VARCHAR(100) NOT NULL,
  `login_type` INT DEFAULT 0 NOT NULL,
  `role_id` VARCHAR(512),
  `data` TEXT,
  `status` INT DEFAULT 0 NOT NULL,
  `verify` BOOLEAN DEFAULT '0' NOT NULL,
  `two_factor_authentication` BOOLEAN DEFAULT '0',
  `company_id` INT DEFAULT '0',
  `stripe_uid` VARCHAR(512),
  `reset_otp` VARCHAR(6) DEFAULT NULL,
  `reset_otp_expiry` TIMESTAMP NULL DEFAULT NULL,
  `reset_token` VARCHAR(255) DEFAULT NULL,
  `reset_token_expiry` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `longtermhire_job` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `task` VARCHAR(512) NOT NULL,
  `arguments` TEXT,
  `time_interval` VARCHAR(512) DEFAULT 'once',
  `retries` INT DEFAULT '1',
  `status` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Client Table (extends user info)
CREATE TABLE IF NOT EXISTS `longtermhire_client` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `client_name` VARCHAR(512) NOT NULL,
  `company_name` VARCHAR(512) NOT NULL,
  `phone` VARCHAR(512),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `longtermhire_user`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_user_id` (`user_id`)
);

-- Equipment Table
CREATE TABLE IF NOT EXISTS `longtermhire_equipment_item` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `category_id` VARCHAR(512) NOT NULL,
  `category_name` VARCHAR(512) NOT NULL,
  `equipment_id` VARCHAR(512) NOT NULL,
  `equipment_name` VARCHAR(512) NOT NULL,
  `base_price` VARCHAR(512) NOT NULL,
  `minimum_duration` VARCHAR(512) DEFAULT '3 Months',
  `availability` BOOLEAN DEFAULT '1' NOT NULL,
  `user_id` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `longtermhire_user`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_equipment_id` (`equipment_id`)
);

-- Content Table
-- Content Table
CREATE TABLE IF NOT EXISTS `longtermhire_content` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `equipment_id` VARCHAR(512) NOT NULL,
  `equipment_name` VARCHAR(512) NOT NULL,
  `description` TEXT,
  `banner_description` TEXT,
  `image_url` VARCHAR(512),  -- ← Changed to image_url
  `user_id` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `longtermhire_user`(`id`) ON DELETE CASCADE
);

-- Client Equipment Assignments Table
CREATE TABLE IF NOT EXISTS `longtermhire_client_equipment` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `client_user_id` INT NOT NULL,
  `equipment_id` INT NOT NULL,
  `assigned_by` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`client_user_id`) REFERENCES `longtermhire_user`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`equipment_id`) REFERENCES `longtermhire_equipment_item`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`assigned_by`) REFERENCES `longtermhire_user`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_client_equipment` (`client_user_id`, `equipment_id`)
);

-- Pricing Packages Table
CREATE TABLE IF NOT EXISTS `longtermhire_pricing_package` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `package_id` VARCHAR(512) NOT NULL,
  `name` VARCHAR(512) NOT NULL,
  `description` TEXT,
  `discount_type` INT NOT NULL, -- 0 = percentage, 1 = fixed amount
  `discount_value` DECIMAL(10,2) NOT NULL,
  `created_by` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`created_by`) REFERENCES `longtermhire_user`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_package_id` (`package_id`)
);

-- Client Pricing Assignments Table
CREATE TABLE IF NOT EXISTS `longtermhire_client_pricing` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `client_user_id` INT NOT NULL,
  `pricing_package_id` INT NULL, -- Nullable for custom discounts
  `assigned_by` INT NOT NULL,
  `custom_discount_type` VARCHAR(20) NULL,
  `custom_discount_value` DECIMAL(10,2) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`client_user_id`) REFERENCES `longtermhire_user`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`pricing_package_id`) REFERENCES `longtermhire_pricing_package`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`assigned_by`) REFERENCES `longtermhire_user`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_client_pricing` (`client_user_id`)
);

-- Equipment Requests Table
CREATE TABLE IF NOT EXISTS `longtermhire_request` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `client_user_id` INT NOT NULL,
  `equipment_id` INT NOT NULL,
  `status` INT DEFAULT 0 NOT NULL,
  `notes` TEXT,
  `reviewed_by` INT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`client_user_id`) REFERENCES `longtermhire_user`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`equipment_id`) REFERENCES `longtermhire_equipment_item`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`reviewed_by`) REFERENCES `longtermhire_user`(`id`) ON DELETE SET NULL
);

-- Client login logs table for tracking login activity
CREATE TABLE IF NOT EXISTS `longtermhire_client_login_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `client_id` INT NOT NULL,
  `login_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `ip_address` VARCHAR(45),
  `user_agent` TEXT,
  FOREIGN KEY (`client_id`) REFERENCES `longtermhire_user`(`id`) ON DELETE CASCADE,
  INDEX `idx_client_login_time` (`client_id`, `login_time`),
  INDEX `idx_login_time` (`login_time`)
);

-- Chat activity logs table for tracking chat and equipment request activity
CREATE TABLE IF NOT EXISTS `longtermhire_chat_activity_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `activity_type` ENUM('message_sent', 'equipment_request') NOT NULL,
  `message_id` INT,
  `equipment_id` VARCHAR(50),
  `activity_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `longtermhire_user`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`message_id`) REFERENCES `longtermhire_chat_messages`(`id`) ON DELETE SET NULL,
  INDEX `idx_user_activity_time` (`user_id`, `activity_time`),
  INDEX `idx_activity_time` (`activity_time`),
  INDEX `idx_activity_type` (`activity_type`)
);

