-- Add missing 'address' column to 'longtermhire_client' table
ALTER TABLE `longtermhire_client`
ADD COLUMN `address` VARCHAR(512) DEFAULT NULL AFTER `phone`;
