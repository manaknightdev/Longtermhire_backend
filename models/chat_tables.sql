-- Chat messages table (create without foreign keys first)
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

-- Chat conversations table (create without foreign keys first)
CREATE TABLE IF NOT EXISTS longtermhire_chat_conversations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user1_id INT NOT NULL,
  user2_id INT NOT NULL,
  last_message_id INT NULL,
  last_message_text TEXT NULL,
  unread_count INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users (user1_id, user2_id),
  INDEX idx_conversation_lookup (user2_id, user1_id),
  UNIQUE KEY unique_conversation (user1_id, user2_id)
);

-- Equipment requests log table (create without foreign keys first)
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

-- Note: To prevent duplicate conversations between the same two users,
-- the application logic should handle this by always ordering user IDs
-- (e.g., always put the smaller user_id in user1_id and larger in user2_id)
-- or by checking for existing conversations before creating new ones.

-- Add foreign key constraints after tables are created
-- (Run these only if the referenced tables exist and have the correct structure)

-- Add foreign keys for chat_messages table
-- ALTER TABLE longtermhire_chat_messages
-- ADD CONSTRAINT fk_chat_from_user FOREIGN KEY (from_user_id) REFERENCES longtermhire_user(id) ON DELETE CASCADE,
-- ADD CONSTRAINT fk_chat_to_user FOREIGN KEY (to_user_id) REFERENCES longtermhire_user(id) ON DELETE CASCADE,
-- ADD CONSTRAINT fk_chat_equipment FOREIGN KEY (equipment_id) REFERENCES longtermhire_equipment(id) ON DELETE SET NULL;

-- Add foreign keys for chat_conversations table
-- ALTER TABLE longtermhire_chat_conversations
-- ADD CONSTRAINT fk_conv_user1 FOREIGN KEY (user1_id) REFERENCES longtermhire_user(id) ON DELETE CASCADE,
-- ADD CONSTRAINT fk_conv_user2 FOREIGN KEY (user2_id) REFERENCES longtermhire_user(id) ON DELETE CASCADE,
-- ADD CONSTRAINT fk_conv_last_message FOREIGN KEY (last_message_id) REFERENCES longtermhire_chat_messages(id) ON DELETE SET NULL;

-- Add foreign keys for equipment_requests table
-- ALTER TABLE longtermhire_equipment_requests
-- ADD CONSTRAINT fk_req_client FOREIGN KEY (client_id) REFERENCES longtermhire_user(id) ON DELETE CASCADE,
-- ADD CONSTRAINT fk_req_equipment FOREIGN KEY (equipment_id) REFERENCES longtermhire_equipment(id) ON DELETE CASCADE,
-- ADD CONSTRAINT fk_req_message FOREIGN KEY (message_id) REFERENCES longtermhire_chat_messages(id) ON DELETE CASCADE;
