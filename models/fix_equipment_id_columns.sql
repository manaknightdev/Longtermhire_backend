-- Fix equipment_id columns to use VARCHAR instead of INT
-- Run this to update existing tables

-- Check if the chat messages table exists and update equipment_id column
SET @table_exists = (
  SELECT COUNT(*) 
  FROM information_schema.tables 
  WHERE table_schema = DATABASE() 
  AND table_name = 'longtermhire_chat_messages'
);

-- Update chat messages table if it exists
SET @sql = IF(@table_exists > 0, 
  'ALTER TABLE longtermhire_chat_messages MODIFY COLUMN equipment_id VARCHAR(512) NULL',
  'SELECT "Table longtermhire_chat_messages does not exist" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if the equipment requests table exists and update equipment_id column
SET @table_exists = (
  SELECT COUNT(*) 
  FROM information_schema.tables 
  WHERE table_schema = DATABASE() 
  AND table_name = 'longtermhire_equipment_requests'
);

-- Update equipment requests table if it exists
SET @sql = IF(@table_exists > 0, 
  'ALTER TABLE longtermhire_equipment_requests MODIFY COLUMN equipment_id VARCHAR(512) NOT NULL',
  'SELECT "Table longtermhire_equipment_requests does not exist" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT 'Equipment ID columns updated to VARCHAR(512)' as result;
