-- Migration to fix messages sent to wrong admin
-- This script will reassign messages to the correct admin based on existing conversations

-- Step 1: Identify messages sent to wrong admin
-- Find messages where the to_user_id doesn't match the conversation participants
CREATE TEMPORARY TABLE mismatched_messages AS
SELECT 
    m.id as message_id,
    m.from_user_id,
    m.to_user_id as current_admin_id,
    c.id as conversation_id,
    CASE 
        WHEN c.user1_id = m.from_user_id THEN c.user2_id 
        ELSE c.user1_id 
    END as correct_admin_id
FROM longtermhire_chat_messages m
JOIN longtermhire_chat_conversations c ON (
    (c.user1_id = m.from_user_id OR c.user2_id = m.from_user_id)
)
JOIN longtermhire_user u1 ON m.to_user_id = u1.id AND u1.role_id = 'super_admin'
JOIN longtermhire_user u2 ON (
    CASE 
        WHEN c.user1_id = m.from_user_id THEN c.user2_id 
        ELSE c.user1_id 
    END
) = u2.id AND u2.role_id = 'super_admin'
WHERE m.to_user_id != CASE 
    WHEN c.user1_id = m.from_user_id THEN c.user2_id 
    ELSE c.user1_id 
END;

-- Step 2: Update messages to point to correct admin
UPDATE longtermhire_chat_messages m
JOIN mismatched_messages mm ON m.id = mm.message_id
SET m.to_user_id = mm.correct_admin_id;

-- Step 3: Update conversation last_message_id if needed
UPDATE longtermhire_chat_conversations c
JOIN (
    SELECT 
        CASE 
            WHEN c2.user1_id = m.from_user_id THEN c2.id
            WHEN c2.user2_id = m.from_user_id THEN c2.id
        END as conversation_id,
        MAX(m.id) as latest_message_id,
        MAX(m.created_at) as latest_time
    FROM longtermhire_chat_messages m
    JOIN longtermhire_chat_conversations c2 ON (
        (c2.user1_id = m.from_user_id AND c2.user2_id = m.to_user_id) OR
        (c2.user2_id = m.from_user_id AND c2.user1_id = m.to_user_id)
    )
    GROUP BY conversation_id
) latest ON c.id = latest.conversation_id
SET 
    c.last_message_id = latest.latest_message_id,
    c.updated_at = latest.latest_time;

-- Step 4: Clean up orphaned conversations (conversations with no messages)
DELETE c FROM longtermhire_chat_conversations c
LEFT JOIN longtermhire_chat_messages m ON (
    (c.user1_id = m.from_user_id AND c.user2_id = m.to_user_id) OR
    (c.user2_id = m.from_user_id AND c.user1_id = m.to_user_id)
)
WHERE m.id IS NULL;

-- Clean up temporary table
DROP TEMPORARY TABLE mismatched_messages;

-- Verification queries (run these to check the fix worked)
-- 1. Check for messages not matching any conversation
-- SELECT COUNT(*) as orphaned_messages
-- FROM longtermhire_chat_messages m
-- LEFT JOIN longtermhire_chat_conversations c ON (
--     (c.user1_id = m.from_user_id AND c.user2_id = m.to_user_id) OR
--     (c.user2_id = m.from_user_id AND c.user1_id = m.to_user_id)
-- )
-- WHERE c.id IS NULL;

-- 2. Check for conversations without messages
-- SELECT COUNT(*) as empty_conversations
-- FROM longtermhire_chat_conversations c
-- LEFT JOIN longtermhire_chat_messages m ON (
--     (c.user1_id = m.from_user_id AND c.user2_id = m.to_user_id) OR
--     (c.user2_id = m.from_user_id AND c.user1_id = m.to_user_id)
-- )
-- WHERE m.id IS NULL;

-- Both queries should return 0 if the fix worked correctly
