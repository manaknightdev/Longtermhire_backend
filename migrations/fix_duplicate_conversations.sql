-- Migration to fix duplicate conversations caused by inconsistent user ordering
-- This script will merge duplicate conversations and ensure consistent ordering

-- Step 1: Create a temporary table to identify duplicates
CREATE TEMPORARY TABLE conversation_duplicates AS
SELECT 
    LEAST(user1_id, user2_id) as min_user_id,
    GREATEST(user1_id, user2_id) as max_user_id,
    COUNT(*) as conversation_count,
    GROUP_CONCAT(id ORDER BY updated_at DESC) as conversation_ids,
    MAX(updated_at) as latest_update
FROM longtermhire_chat_conversations
GROUP BY LEAST(user1_id, user2_id), GREATEST(user1_id, user2_id)
HAVING COUNT(*) > 1;

-- Step 2: For each set of duplicates, keep the most recent conversation and delete others
-- Update messages to point to the kept conversation
UPDATE longtermhire_chat_messages m
JOIN conversation_duplicates cd ON (
    (m.from_user_id = cd.min_user_id AND m.to_user_id = cd.max_user_id) OR
    (m.from_user_id = cd.max_user_id AND m.to_user_id = cd.min_user_id)
)
JOIN longtermhire_chat_conversations c ON c.id = SUBSTRING_INDEX(cd.conversation_ids, ',', 1)
SET m.conversation_id = c.id
WHERE cd.conversation_count > 1;

-- Step 3: Delete duplicate conversations (keep only the first one from each group)
DELETE c FROM longtermhire_chat_conversations c
JOIN conversation_duplicates cd ON (
    (c.user1_id = cd.min_user_id AND c.user2_id = cd.max_user_id) OR
    (c.user1_id = cd.max_user_id AND c.user2_id = cd.min_user_id) OR
    (c.user2_id = cd.min_user_id AND c.user1_id = cd.max_user_id) OR
    (c.user2_id = cd.max_user_id AND c.user1_id = cd.min_user_id)
)
WHERE FIND_IN_SET(c.id, cd.conversation_ids) > 1;

-- Step 4: Normalize all remaining conversations to use consistent ordering
UPDATE longtermhire_chat_conversations 
SET 
    user1_id = LEAST(user1_id, user2_id),
    user2_id = GREATEST(user1_id, user2_id)
WHERE user1_id > user2_id;

-- Step 5: Add the unique constraint to prevent future duplicates
ALTER TABLE longtermhire_chat_conversations 
ADD CONSTRAINT unique_conversation UNIQUE (user1_id, user2_id);

-- Clean up temporary table
DROP TEMPORARY TABLE conversation_duplicates;

-- Verification query (run this to check the fix worked)
-- SELECT 
--     LEAST(user1_id, user2_id) as min_user,
--     GREATEST(user1_id, user2_id) as max_user,
--     COUNT(*) as count
-- FROM longtermhire_chat_conversations
-- GROUP BY LEAST(user1_id, user2_id), GREATEST(user1_id, user2_id)
-- HAVING COUNT(*) > 1;
-- This should return no rows if the fix worked correctly
