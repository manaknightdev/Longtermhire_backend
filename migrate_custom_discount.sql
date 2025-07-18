-- Migration script to add custom discount columns to existing longtermhire_client_pricing table

-- Add custom discount type column (percentage or fixed)
ALTER TABLE `longtermhire_client_pricing`
ADD COLUMN `custom_discount_type` VARCHAR(20) NULL AFTER `assigned_by`;

-- Add custom discount value column (decimal for both percentage and fixed amounts)
ALTER TABLE `longtermhire_client_pricing`
ADD COLUMN `custom_discount_value` DECIMAL(10,2) NULL AFTER `custom_discount_type`;

-- Drop the existing foreign key constraint for pricing_package_id
ALTER TABLE `longtermhire_client_pricing`
DROP FOREIGN KEY `longtermhire_client_pricing_ibfk_2`;

-- Make pricing_package_id nullable for custom discounts
ALTER TABLE `longtermhire_client_pricing`
MODIFY COLUMN `pricing_package_id` INT NULL;

-- Re-add the foreign key constraint but allow NULL values
ALTER TABLE `longtermhire_client_pricing`
ADD CONSTRAINT `longtermhire_client_pricing_ibfk_2`
FOREIGN KEY (`pricing_package_id`) REFERENCES `longtermhire_pricing_package`(`id`) ON DELETE CASCADE;

-- Optional: Add index for better performance on custom discount queries
CREATE INDEX `idx_custom_discount` ON `longtermhire_client_pricing` (`custom_discount_type`, `custom_discount_value`);
