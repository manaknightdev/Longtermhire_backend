-- Migration script to update content table from 'image' to 'image_url' column
-- This handles the case where the table already exists with the old column name

-- Check if the table exists and has the old 'image' column
-- If so, rename it to 'image_url'
SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'longtermhire_content'
    AND COLUMN_NAME = 'image'
);

SET @new_column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'longtermhire_content'
    AND COLUMN_NAME = 'image_url'
);

-- If the old column exists and the new one doesn't, rename it
SET @sql = IF(@column_exists > 0 AND @new_column_exists = 0,
    'ALTER TABLE longtermhire_content CHANGE COLUMN image image_url VARCHAR(512)',
    'SELECT "Column already updated or table does not exist" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ensure the table exists with the correct structure
CREATE TABLE IF NOT EXISTS `longtermhire_content` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `equipment_id` VARCHAR(512) NOT NULL,
  `equipment_name` VARCHAR(512) NOT NULL,
  `description` TEXT,
  `banner_description` TEXT,
  `image_url` VARCHAR(512),
  `user_id` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `longtermhire_user`(`id`) ON DELETE CASCADE
);
