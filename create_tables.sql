CREATE TABLE IF NOT EXISTS longtermhire_job (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `task` VARCHAR(512) NOT NULL,
  `arguments` TEXT,
  `time_interval` VARCHAR(512) DEFAULT 'once',
  `retries` INT DEFAULT '1',
  `status` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS longtermhire_uploads (
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

CREATE TABLE IF NOT EXISTS longtermhire_tokens (
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

CREATE TABLE IF NOT EXISTS longtermhire_preference (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `first_name` VARCHAR(512),
  `last_name` VARCHAR(512),
  `phone` VARCHAR(512),
  `photo` VARCHAR(512),
  `user_id` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS longtermhire_user (
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
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

