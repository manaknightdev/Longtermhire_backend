-- Simple chat tables without foreign key constraints
-- Run this first to create the basic structure

-- Chat messages table
CREATE TABLE IF NOT EXISTS longtermhire_chat_messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  from_user_id INT NOT NULL,
  to_user_id INT NOT NULL,
  message TEXT NOT NULL,
  message_type ENUM('text', 'equipment_request', 'system') DEFAULT 'text',
  equipment_id VARCHAR(512) NULL,
  equipment_name VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP NULL,
  INDEX idx_users (from_user_id, to_user_id),
  INDEX idx_created (created_at)
);

-- Chat conversations table
CREATE TABLE IF NOT EXISTS longtermhire_chat_conversations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user1_id INT NOT NULL,
  user2_id INT NOT NULL,
  last_message_id INT NULL,
  last_message_text TEXT NULL,
  unread_count INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_conversation (user1_id, user2_id),
  INDEX idx_users (user1_id, user2_id),
  INDEX idx_conversation_lookup (user2_id, user1_id)
);

-- Equipment requests log table
CREATE TABLE IF NOT EXISTS longtermhire_equipment_requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  client_id INT NOT NULL,
  equipment_id VARCHAR(512) NOT NULL,
  message_id INT NOT NULL,
  status ENUM('pending', 'assigned', 'declined', 'completed') DEFAULT 'pending',
  request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  response_date TIMESTAMP NULL,
  notes TEXT NULL,
  INDEX idx_client (client_id),
  INDEX idx_equipment (equipment_id),
  INDEX idx_status (status)
);

-- Client login logs table
CREATE TABLE IF NOT EXISTS longtermhire_client_login_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  client_id INT NOT NULL,
  login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  INDEX idx_client (client_id),
  INDEX idx_login_time (login_time)
);

-- Chat activity logs table
CREATE TABLE IF NOT EXISTS longtermhire_chat_activity_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  activity_type ENUM('message_sent', 'conversation_started', 'equipment_request') DEFAULT 'message_sent',
  conversation_id INT NULL,
  message_id INT NULL,
  equipment_id VARCHAR(512) NULL,
  activity_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id),
  INDEX idx_activity_type (activity_type),
  INDEX idx_activity_time (activity_time)
);
