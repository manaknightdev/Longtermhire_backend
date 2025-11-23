-- ============================================================================
-- LONG TERM HIRE - V2 FEATURE DATABASE MIGRATIONS
-- ============================================================================
-- Date: 2025-10-14
-- Description: Database schema changes for v2 features:
--   1. Equipment unavailability due months (e.g., "Available January 2026")
--   2. Chat file attachments (PDF and images)
--   3. Equipment availability across companies (no schema change needed)
-- ============================================================================

-- Feature 1: Add unavailability_due_month to equipment table
-- This field stores the expected availability month/year (e.g., "January 2026")
-- NULL means equipment is currently available
ALTER TABLE `longtermhire_equipment_item`
ADD COLUMN `unavailability_due_month` VARCHAR(50) NULL DEFAULT NULL
AFTER `availability`;

-- Feature 2: Add file attachment support to chat messages
-- attachment_url: Full URL to the uploaded file
-- attachment_type: File MIME type (e.g., 'application/pdf', 'image/jpeg')
-- attachment_name: Original filename
-- attachment_size: File size in bytes
ALTER TABLE `longtermhire_chat_messages`
ADD COLUMN `attachment_url` VARCHAR(512) NULL DEFAULT NULL,
ADD COLUMN `attachment_type` VARCHAR(100) NULL DEFAULT NULL,
ADD COLUMN `attachment_name` VARCHAR(255) NULL DEFAULT NULL,
ADD COLUMN `attachment_size` INT NULL DEFAULT NULL;

-- Add index for better query performance when filtering by message type
ALTER TABLE `longtermhire_chat_messages`
ADD INDEX `idx_message_type` (`message_type`);

-- Feature 3: Equipment availability across companies
-- No schema change needed! The current structure already supports this:
-- - longtermhire_equipment_item stores the equipment (single record)
-- - longtermhire_client_equipment assigns equipment to multiple clients
-- - Same equipment_id can be assigned to multiple client_user_id values

-- ============================================================================
-- ROLLBACK STATEMENTS (if needed)
-- ============================================================================
-- To rollback these changes, run:
--
-- ALTER TABLE `longtermhire_equipment_item` DROP COLUMN `unavailability_due_month`;
-- ALTER TABLE `longtermhire_chat_messages` DROP COLUMN `attachment_url`;
-- ALTER TABLE `longtermhire_chat_messages` DROP COLUMN `attachment_type`;
-- ALTER TABLE `longtermhire_chat_messages` DROP COLUMN `attachment_name`;
-- ALTER TABLE `longtermhire_chat_messages` DROP COLUMN `attachment_size`;
-- ALTER TABLE `longtermhire_chat_messages` DROP INDEX `idx_message_type`;
-- ============================================================================
