/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

CREATE TABLE `longtermhire_chat_activity_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `activity_type` enum('message_sent','conversation_started','equipment_request') DEFAULT 'message_sent',
  `conversation_id` int(11) DEFAULT NULL,
  `message_id` int(11) DEFAULT NULL,
  `equipment_id` varchar(512) DEFAULT NULL,
  `activity_time` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_activity_type` (`activity_type`),
  KEY `idx_activity_time` (`activity_time`)
) ENGINE=InnoDB AUTO_INCREMENT=169 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `longtermhire_chat_conversations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user1_id` int(11) NOT NULL,
  `user2_id` int(11) NOT NULL,
  `last_message_id` int(11) DEFAULT NULL,
  `last_message_text` text DEFAULT NULL,
  `unread_count` int(11) DEFAULT 0,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_conversation` (`user1_id`,`user2_id`),
  KEY `idx_users` (`user1_id`,`user2_id`),
  KEY `idx_conversation_lookup` (`user2_id`,`user1_id`)
) ENGINE=InnoDB AUTO_INCREMENT=181 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `longtermhire_chat_messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `from_user_id` int(11) NOT NULL,
  `to_user_id` int(11) NOT NULL,
  `message` text NOT NULL,
  `message_type` varchar(20) NOT NULL DEFAULT 'text',
  `equipment_id` varchar(512) DEFAULT NULL,
  `equipment_name` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `read_at` timestamp NULL DEFAULT NULL,
  `attachment_url` varchar(512) DEFAULT NULL,
  `attachment_type` varchar(100) DEFAULT NULL,
  `attachment_name` varchar(255) DEFAULT NULL,
  `attachment_size` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_users` (`from_user_id`,`to_user_id`),
  KEY `idx_created` (`created_at`),
  KEY `idx_message_type` (`message_type`)
) ENGINE=InnoDB AUTO_INCREMENT=176 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `longtermhire_chat_notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `client_user_id` int(11) NOT NULL,
  `admin_user_id` int(11) NOT NULL,
  `last_notification_sent` timestamp NOT NULL DEFAULT current_timestamp(),
  `notification_count_24h` int(11) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_client_admin_notification` (`client_user_id`,`admin_user_id`),
  KEY `admin_user_id` (`admin_user_id`),
  KEY `idx_chat_notifications_last_sent` (`last_notification_sent`),
  CONSTRAINT `longtermhire_chat_notifications_ibfk_1` FOREIGN KEY (`client_user_id`) REFERENCES `longtermhire_user` (`id`) ON DELETE CASCADE,
  CONSTRAINT `longtermhire_chat_notifications_ibfk_2` FOREIGN KEY (`admin_user_id`) REFERENCES `longtermhire_user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `longtermhire_client` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `company_id` int(11) DEFAULT NULL,
  `client_name` varchar(512) NOT NULL,
  `company_name` varchar(512) NOT NULL,
  `phone` varchar(512) DEFAULT NULL,
  `address` varchar(512) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_id` (`user_id`),
  KEY `idx_company` (`company_id`),
  CONSTRAINT `fk_client_company` FOREIGN KEY (`company_id`) REFERENCES `longtermhire_company` (`id`) ON DELETE SET NULL,
  CONSTRAINT `longtermhire_client_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `longtermhire_user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `longtermhire_client_equipment` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `client_user_id` int(11) NOT NULL,
  `equipment_id` int(11) NOT NULL,
  `assigned_by` int(11) NOT NULL,
  `custom_base_price` decimal(10,2) DEFAULT NULL COMMENT 'Company-specific base price override. If NULL, uses equipment_item.base_price',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `custom_discount_type` enum('percentage','fixed') DEFAULT NULL,
  `custom_discount_value` decimal(10,2) DEFAULT NULL,
  `discount` decimal(10,2) DEFAULT 0.00 COMMENT 'Primary discount amount',
  `discount_type` varchar(20) DEFAULT '%' COMMENT 'Discount type: % or $',
  `compounding_discount` decimal(10,2) DEFAULT 0.00 COMMENT 'Additional compounding discount',
  `compounding_discount_type` varchar(20) DEFAULT '%' COMMENT 'Compounding discount type: % or $',
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_client_equipment` (`client_user_id`,`equipment_id`),
  KEY `equipment_id` (`equipment_id`),
  KEY `assigned_by` (`assigned_by`),
  CONSTRAINT `longtermhire_client_equipment_ibfk_1` FOREIGN KEY (`client_user_id`) REFERENCES `longtermhire_user` (`id`) ON DELETE CASCADE,
  CONSTRAINT `longtermhire_client_equipment_ibfk_2` FOREIGN KEY (`equipment_id`) REFERENCES `longtermhire_equipment_item` (`id`) ON DELETE CASCADE,
  CONSTRAINT `longtermhire_client_equipment_ibfk_3` FOREIGN KEY (`assigned_by`) REFERENCES `longtermhire_user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=206 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `longtermhire_client_login_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `client_id` int(11) NOT NULL,
  `login_time` timestamp NOT NULL DEFAULT current_timestamp(),
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_client` (`client_id`),
  KEY `idx_login_time` (`login_time`)
) ENGINE=InnoDB AUTO_INCREMENT=130 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `longtermhire_client_pricing` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `client_user_id` int(11) NOT NULL,
  `pricing_package_id` int(11) DEFAULT NULL,
  `assigned_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_client_pricing` (`client_user_id`),
  KEY `pricing_package_id` (`pricing_package_id`),
  KEY `assigned_by` (`assigned_by`),
  CONSTRAINT `longtermhire_client_pricing_ibfk_1` FOREIGN KEY (`client_user_id`) REFERENCES `longtermhire_user` (`id`) ON DELETE CASCADE,
  CONSTRAINT `longtermhire_client_pricing_ibfk_2` FOREIGN KEY (`pricing_package_id`) REFERENCES `longtermhire_pricing_package` (`id`) ON DELETE CASCADE,
  CONSTRAINT `longtermhire_client_pricing_ibfk_3` FOREIGN KEY (`assigned_by`) REFERENCES `longtermhire_user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='DEPRECATED IN V2 - Use longtermhire_client_equipment discount fields';

CREATE TABLE `longtermhire_company` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_name` varchar(512) NOT NULL,
  `company_address` text DEFAULT NULL,
  `company_logo` varchar(512) DEFAULT NULL COMMENT 'URL to uploaded company logo',
  `owner_user_id` int(11) NOT NULL COMMENT 'First user who created the company',
  `ad_text` text DEFAULT NULL COMMENT 'AD text/HTML content for company page',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `ad_text_destination` varchar(50) DEFAULT 'To Sticky Note',
  PRIMARY KEY (`id`),
  KEY `idx_owner` (`owner_user_id`),
  CONSTRAINT `longtermhire_company_ibfk_1` FOREIGN KEY (`owner_user_id`) REFERENCES `longtermhire_user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Companies with multi-user support';

CREATE TABLE `longtermhire_company_member` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `member_name` varchar(512) NOT NULL,
  `member_email` varchar(512) NOT NULL,
  `member_phone` varchar(50) DEFAULT NULL,
  `role` varchar(100) NOT NULL COMMENT 'Company Owner, Engineer, Supervisor, etc.',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_company_user` (`company_id`,`user_id`),
  KEY `idx_company` (`company_id`),
  KEY `idx_user` (`user_id`),
  CONSTRAINT `longtermhire_company_member_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `longtermhire_company` (`id`) ON DELETE CASCADE,
  CONSTRAINT `longtermhire_company_member_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `longtermhire_user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Company team members with roles';

CREATE TABLE `longtermhire_company_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_name` varchar(255) DEFAULT NULL,
  `company_address` text DEFAULT NULL,
  `company_email` varchar(255) DEFAULT NULL,
  `company_phone` varchar(50) DEFAULT NULL,
  `company_logo` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `longtermhire_content` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `equipment_id` varchar(512) NOT NULL,
  `equipment_name` varchar(512) NOT NULL,
  `description` text DEFAULT NULL,
  `banner_description` text DEFAULT NULL,
  `image_url` varchar(512) DEFAULT NULL,
  `user_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `longtermhire_content_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `longtermhire_user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `longtermhire_content_images` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `content_id` int(11) NOT NULL,
  `image_url` varchar(512) NOT NULL,
  `image_order` int(11) DEFAULT 0,
  `is_main` tinyint(1) DEFAULT 0,
  `caption` varchar(512) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_content_images_order` (`content_id`,`image_order`),
  CONSTRAINT `longtermhire_content_images_ibfk_1` FOREIGN KEY (`content_id`) REFERENCES `longtermhire_content` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=88 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `longtermhire_equipment_item` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `category_id` varchar(512) NOT NULL,
  `category_name` varchar(512) NOT NULL,
  `equipment_id` varchar(512) NOT NULL,
  `equipment_name` varchar(512) NOT NULL,
  `base_price` varchar(512) NOT NULL,
  `minimum_duration` varchar(512) DEFAULT '3 Months',
  `availability` tinyint(1) NOT NULL DEFAULT 1,
  `position` int(11) DEFAULT 0 COMMENT 'Position for ordering equipment within category (lower numbers appear first)',
  `unavailability_due_month` varchar(50) DEFAULT NULL,
  `user_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `specs_files` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_equipment_id` (`equipment_id`),
  KEY `user_id` (`user_id`),
  KEY `idx_category_position` (`category_name`,`position`),
  CONSTRAINT `longtermhire_equipment_item_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `longtermhire_user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `longtermhire_equipment_maintenance` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `equipment_id` int(11) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `longtermhire_equipment_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `client_id` int(11) NOT NULL,
  `equipment_id` varchar(512) NOT NULL,
  `message_id` int(11) NOT NULL,
  `status` enum('pending','assigned','declined','completed') DEFAULT 'pending',
  `request_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `response_date` timestamp NULL DEFAULT NULL,
  `notes` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_client` (`client_id`),
  KEY `idx_equipment` (`equipment_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `longtermhire_job` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `task` varchar(512) NOT NULL,
  `arguments` text DEFAULT NULL,
  `time_interval` varchar(512) DEFAULT 'once',
  `retries` int(11) DEFAULT 1,
  `status` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `longtermhire_preference` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `first_name` varchar(512) DEFAULT NULL,
  `last_name` varchar(512) DEFAULT NULL,
  `phone` varchar(512) DEFAULT NULL,
  `photo` varchar(512) DEFAULT NULL,
  `user_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `longterm-hire_preference` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `first_name` varchar(512) DEFAULT NULL,
  `last_name` varchar(512) DEFAULT NULL,
  `phone` varchar(512) DEFAULT NULL,
  `photo` varchar(512) DEFAULT NULL,
  `user_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `longtermhire_pricing_package` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `package_id` varchar(512) NOT NULL,
  `name` varchar(512) NOT NULL,
  `description` text DEFAULT NULL,
  `discount_type` int(11) NOT NULL,
  `discount_value` decimal(10,2) NOT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_package_id` (`package_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `longtermhire_pricing_package_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `longtermhire_user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='DEPRECATED IN V2 - Use per-equipment discounts instead';

CREATE TABLE `longtermhire_quote` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `quote_id` varchar(50) NOT NULL COMMENT 'Quote ID: Q001, Q002, etc.',
  `company_id` int(11) DEFAULT NULL COMMENT 'Link to company if exists',
  `client_user_id` int(11) DEFAULT NULL COMMENT 'Link to specific client user',
  `company_name` varchar(512) DEFAULT NULL,
  `company_address` text DEFAULT NULL,
  `company_email` varchar(512) DEFAULT NULL,
  `company_logo` varchar(512) DEFAULT NULL COMMENT 'URL to company logo',
  `quote_expires_after` int(11) DEFAULT 7 COMMENT 'Days until quote expires',
  `produce_quote_for` int(11) DEFAULT 12 COMMENT 'Months to produce quote for',
  `gst_percentage` decimal(5,2) DEFAULT 15.00,
  `terms_of_hire` text DEFAULT NULL,
  `status` varchar(50) DEFAULT 'Active',
  `created_by` int(11) NOT NULL COMMENT 'Admin user who created quote',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `quote_id` (`quote_id`),
  KEY `created_by` (`created_by`),
  KEY `idx_quote_id` (`quote_id`),
  KEY `idx_company` (`company_id`),
  KEY `idx_client` (`client_user_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `longtermhire_quote_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `longtermhire_company` (`id`) ON DELETE SET NULL,
  CONSTRAINT `longtermhire_quote_ibfk_2` FOREIGN KEY (`client_user_id`) REFERENCES `longtermhire_user` (`id`) ON DELETE SET NULL,
  CONSTRAINT `longtermhire_quote_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `longtermhire_user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Quote configurations';

CREATE TABLE `longtermhire_request` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `client_user_id` int(11) NOT NULL,
  `equipment_id` int(11) NOT NULL,
  `status` int(11) NOT NULL DEFAULT 0,
  `notes` text DEFAULT NULL,
  `reviewed_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `client_user_id` (`client_user_id`),
  KEY `equipment_id` (`equipment_id`),
  KEY `reviewed_by` (`reviewed_by`),
  CONSTRAINT `longtermhire_request_ibfk_1` FOREIGN KEY (`client_user_id`) REFERENCES `longtermhire_user` (`id`) ON DELETE CASCADE,
  CONSTRAINT `longtermhire_request_ibfk_2` FOREIGN KEY (`equipment_id`) REFERENCES `longtermhire_equipment_item` (`id`) ON DELETE CASCADE,
  CONSTRAINT `longtermhire_request_ibfk_3` FOREIGN KEY (`reviewed_by`) REFERENCES `longtermhire_user` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `longtermhire_tokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `token` varchar(512) NOT NULL,
  `code` varchar(512) NOT NULL,
  `type` int(11) NOT NULL DEFAULT 0,
  `data` text DEFAULT NULL,
  `status` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `expired_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `longtermhire_uploads` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `url` varchar(512) NOT NULL,
  `caption` varchar(512) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `width` int(11) DEFAULT NULL,
  `height` int(11) DEFAULT NULL,
  `type` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=183 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `longtermhire_user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(512) NOT NULL,
  `password` varchar(100) NOT NULL,
  `login_type` int(11) NOT NULL DEFAULT 0,
  `role_id` varchar(512) DEFAULT NULL,
  `data` text DEFAULT NULL,
  `status` int(11) NOT NULL DEFAULT 0,
  `verify` tinyint(1) NOT NULL DEFAULT 0,
  `two_factor_authentication` tinyint(1) DEFAULT 0,
  `company_id` int(11) DEFAULT 0,
  `stripe_uid` varchar(512) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `reset_otp` varchar(6) DEFAULT NULL,
  `reset_otp_expiry` timestamp NULL DEFAULT NULL,
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expiry` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;