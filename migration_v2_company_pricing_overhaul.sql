-- ============================================================================
-- LONG TERM HIRE - V2 COMPANY & PRICING OVERHAUL MIGRATION
-- ============================================================================
-- Date: 2025-01-20
-- Description: Major v2 database schema changes:
--   1. Company management with multi-user support
--   2. Per-equipment discount system (replacing pricing packages)
--   3. Quote management system
--   4. Unread message tracking
--   5. Enhanced admin profile fields
-- ============================================================================
-- IMPORTANT: Test on development environment first!
-- ============================================================================


-- ============================================================================
-- STEP 1: CREATE COMPANY TABLE
-- ============================================================================
-- Companies can have multiple team members
-- First created user is the owner
CREATE TABLE IF NOT EXISTS `longtermhire_company` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `company_name` VARCHAR(512) NOT NULL,
  `company_address` TEXT,
  `company_logo` VARCHAR(512) COMMENT 'URL to uploaded company logo',
  `owner_user_id` INT NOT NULL COMMENT 'First user who created the company',
  `ad_text` TEXT COMMENT 'AD text/HTML content for company page',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`owner_user_id`) REFERENCES `longtermhire_user`(`id`) ON DELETE CASCADE,
  INDEX `idx_owner` (`owner_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Companies with multi-user support';

-- ============================================================================
-- STEP 2: CREATE COMPANY MEMBERS TABLE
-- ============================================================================
-- Track all users belonging to a company with their roles
CREATE TABLE IF NOT EXISTS `longtermhire_company_member` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `company_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `member_name` VARCHAR(512) NOT NULL,
  `member_email` VARCHAR(512) NOT NULL,
  `member_phone` VARCHAR(50),
  `role` VARCHAR(100) NOT NULL COMMENT 'Company Owner, Engineer, Supervisor, etc.',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`company_id`) REFERENCES `longtermhire_company`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `longtermhire_user`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_company_user` (`company_id`, `user_id`),
  INDEX `idx_company` (`company_id`),
  INDEX `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Company team members with roles';

-- ============================================================================
-- STEP 3: MODIFY CLIENT TABLE - ADD COMPANY REFERENCE
-- ============================================================================
-- Link clients to companies
ALTER TABLE `longtermhire_client`
ADD COLUMN `company_id` INT NULL AFTER `user_id`,
ADD CONSTRAINT `fk_client_company`
  FOREIGN KEY (`company_id`) REFERENCES `longtermhire_company`(`id`)
  ON DELETE SET NULL,
ADD INDEX `idx_company` (`company_id`);

-- ============================================================================
-- STEP 4: MODIFY CLIENT_EQUIPMENT TABLE - ADD DISCOUNT FIELDS
-- ============================================================================
-- Per-equipment discount system (replaces pricing packages)
ALTER TABLE `longtermhire_client_equipment`
ADD COLUMN `discount` DECIMAL(10,2) DEFAULT 0 COMMENT 'Primary discount amount',
ADD COLUMN `discount_type` VARCHAR(20) DEFAULT '%' COMMENT 'Discount type: % or $',
ADD COLUMN `compounding_discount` DECIMAL(10,2) DEFAULT 0 COMMENT 'Additional compounding discount',
ADD COLUMN `compounding_discount_type` VARCHAR(20) DEFAULT '%' COMMENT 'Compounding discount type: % or $',
ADD COLUMN `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- ============================================================================
-- STEP 5: CREATE QUOTE TABLE
-- ============================================================================
-- Store quote configurations (PDF generated on frontend)
CREATE TABLE IF NOT EXISTS `longtermhire_quote` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `quote_id` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Quote ID: Q001, Q002, etc.',
  `company_id` INT NULL COMMENT 'Link to company if exists',
  `client_user_id` INT NULL COMMENT 'Link to specific client user',
  `company_name` VARCHAR(512),
  `company_address` TEXT,
  `company_email` VARCHAR(512),
  `company_logo` VARCHAR(512) COMMENT 'URL to company logo',
  `quote_expires_after` INT DEFAULT 7 COMMENT 'Days until quote expires',
  `produce_quote_for` INT DEFAULT 12 COMMENT 'Months to produce quote for',
  `gst_percentage` DECIMAL(5,2) DEFAULT 15.00,
  `terms_of_hire` TEXT,
  `status` VARCHAR(50) DEFAULT 'Active',
  `created_by` INT NOT NULL COMMENT 'Admin user who created quote',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`company_id`) REFERENCES `longtermhire_company`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`client_user_id`) REFERENCES `longtermhire_user`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`created_by`) REFERENCES `longtermhire_user`(`id`) ON DELETE CASCADE,
  INDEX `idx_quote_id` (`quote_id`),
  INDEX `idx_company` (`company_id`),
  INDEX `idx_client` (`client_user_id`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Quote configurations';

-- ============================================================================
-- STEP 6: ADD UNREAD MESSAGE TRACKING
-- ============================================================================
-- Simple boolean flag approach (Option 1 - recommended for single admin)
-- For multi-admin support, use the separate table approach (commented below)
ALTER TABLE `longtermhire_chat_messages`
ADD COLUMN `is_read_by_admin` BOOLEAN DEFAULT FALSE COMMENT 'Has admin read this message',
ADD INDEX `idx_unread_admin` (`is_read_by_admin`, `sender_id`, `conversation_id`);

-- ============================================================================
-- OPTION 2: SEPARATE READ STATUS TABLE (for multi-admin support)
-- ============================================================================
-- Uncomment this if you need multi-admin read tracking
/*
CREATE TABLE IF NOT EXISTS `longtermhire_message_read_status` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `message_id` INT NOT NULL,
  `user_id` INT NOT NULL COMMENT 'Admin who read the message',
  `read_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`message_id`) REFERENCES `longtermhire_chat_messages`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `longtermhire_user`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_message_reader` (`message_id`, `user_id`),
  INDEX `idx_message` (`message_id`),
  INDEX `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Track which admins read which messages';
*/

-- ============================================================================
-- STEP 7: DATA MIGRATION - CREATE COMPANIES FOR EXISTING CLIENTS
-- ============================================================================
-- Automatically create a company for each existing client
INSERT INTO `longtermhire_company` (`company_name`, `owner_user_id`, `created_at`, `updated_at`)
SELECT
  c.company_name,
  c.user_id,
  c.created_at,
  c.updated_at
FROM `longtermhire_client` c
WHERE NOT EXISTS (
  SELECT 1 FROM `longtermhire_company` co WHERE co.owner_user_id = c.user_id
);

-- ============================================================================
-- STEP 8: DATA MIGRATION - LINK CLIENTS TO THEIR COMPANIES
-- ============================================================================
UPDATE `longtermhire_client` c
JOIN `longtermhire_company` co ON co.owner_user_id = c.user_id
SET c.company_id = co.id
WHERE c.company_id IS NULL;

-- ============================================================================
-- STEP 9: DATA MIGRATION - CREATE COMPANY MEMBER ENTRIES
-- ============================================================================
-- Create company member entry for each client (as owner)
INSERT INTO `longtermhire_company_member`
  (`company_id`, `user_id`, `member_name`, `member_email`, `member_phone`, `role`, `created_at`, `updated_at`)
SELECT
  co.id AS company_id,
  c.user_id,
  c.client_name AS member_name,
  u.email AS member_email,
  c.phone AS member_phone,
  'Company Owner' AS role,
  c.created_at,
  c.updated_at
FROM `longtermhire_client` c
JOIN `longtermhire_company` co ON co.id = c.company_id
JOIN `longtermhire_user` u ON u.id = c.user_id
WHERE NOT EXISTS (
  SELECT 1 FROM `longtermhire_company_member` cm
  WHERE cm.company_id = co.id AND cm.user_id = c.user_id
);

-- ============================================================================
-- STEP 10: DATA MIGRATION - SET DEFAULT DISCOUNTS FOR EXISTING ASSIGNMENTS
-- ============================================================================
-- Set default 0 discount for all existing equipment assignments
UPDATE `longtermhire_client_equipment`
SET
  discount = 0,
  discount_type = '%',
  compounding_discount = 0,
  compounding_discount_type = '%'
WHERE discount IS NULL;

-- ============================================================================
-- STEP 11: MARK OLD TABLES AS DEPRECATED (OPTIONAL)
-- ============================================================================
-- Keep these tables for rollback safety but mark as deprecated
ALTER TABLE `longtermhire_pricing_package`
COMMENT = 'DEPRECATED IN V2 - Use per-equipment discounts instead';

ALTER TABLE `longtermhire_client_pricing`
COMMENT = 'DEPRECATED IN V2 - Use longtermhire_client_equipment discount fields';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify migration success:

-- Check all clients have companies
-- SELECT c.id, c.client_name, c.company_id, co.company_name
-- FROM longtermhire_client c
-- LEFT JOIN longtermhire_company co ON co.id = c.company_id;

-- Check all companies have members
-- SELECT co.id, co.company_name, COUNT(cm.id) as member_count
-- FROM longtermhire_company co
-- LEFT JOIN longtermhire_company_member cm ON cm.company_id = co.id
-- GROUP BY co.id;

-- Check equipment assignments have discount fields
-- SELECT ce.*, e.equipment_name, e.base_price
-- FROM longtermhire_client_equipment ce
-- JOIN longtermhire_equipment_item e ON e.id = ce.equipment_id
-- LIMIT 10;

-- ============================================================================
-- ROLLBACK SCRIPT
-- ============================================================================
-- Save this for emergency rollback!
/*

-- Drop new tables
DROP TABLE IF EXISTS `longtermhire_quote`;
DROP TABLE IF EXISTS `longtermhire_company_member`;
DROP TABLE IF EXISTS `longtermhire_company`;
-- DROP TABLE IF EXISTS `longtermhire_message_read_status`; -- If using Option 2

-- Remove new columns from client_equipment
ALTER TABLE `longtermhire_client_equipment`
DROP COLUMN `discount`,
DROP COLUMN `discount_type`,
DROP COLUMN `compounding_discount`,
DROP COLUMN `compounding_discount_type`,
DROP COLUMN `updated_at`;

-- Remove new columns from client
ALTER TABLE `longtermhire_client`
DROP FOREIGN KEY `fk_client_company`,
DROP INDEX `idx_company`,
DROP COLUMN `company_id`;

-- Remove new columns from chat_messages
ALTER TABLE `longtermhire_chat_messages`
DROP COLUMN `is_read_by_admin`,
DROP INDEX `idx_unread_admin`;

-- Restore table comments
ALTER TABLE `longtermhire_pricing_package`
COMMENT = '';

ALTER TABLE `longtermhire_client_pricing`
COMMENT = '';

*/

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Next steps:
-- 1. Verify all tables created successfully
-- 2. Run verification queries
-- 3. Test on staging environment
-- 4. Update backend API to use new schema
-- 5. Test frontend integration
-- ============================================================================

SELECT 'V2 Migration Complete! Run verification queries above.' AS Status;
