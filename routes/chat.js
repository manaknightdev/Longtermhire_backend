const TokenMiddleware = require("../../../baas/middleware/TokenMiddleware");
const RoleMiddleware = require("../middleware/RoleMiddleware");
const chatService = require("../services/ChatService");

module.exports = function (app) {
  console.log("Loading chat routes...");

  // Set user as online
  app.post(
    "/v1/api/longtermhire/chat/online",
    TokenMiddleware(),
    RoleMiddleware(["super_admin", "member"]),
    async (req, res) => {
      try {
        const userId = req.user_id;
        await chatService.setUserOnline(userId);

        return res.status(200).json({
          error: false,
          message: "User marked as online",
        });
      } catch (error) {
        console.error("Set online error:", error);
        return res.status(500).json({
          error: true,
          message: error.message || "Internal server error",
        });
      }
    }
  );

  // Set user as offline
  app.post(
    "/v1/api/longtermhire/chat/offline",
    TokenMiddleware(),
    RoleMiddleware(["super_admin", "member"]),
    async (req, res) => {
      try {
        const userId = req.user_id;
        await chatService.setUserOffline(userId);

        return res.status(200).json({
          error: false,
          message: "User marked as offline",
        });
      } catch (error) {
        console.error("Set offline error:", error);
        return res.status(500).json({
          error: true,
          message: error.message || "Internal server error",
        });
      }
    }
  );

  // Send heartbeat to maintain online status
  app.post(
    "/v1/api/longtermhire/chat/heartbeat",
    TokenMiddleware(),
    RoleMiddleware(["super_admin", "member"]),
    async (req, res) => {
      try {
        const userId = req.user_id;
        await chatService.setUserOnline(userId);

        return res.status(200).json({
          error: false,
          message: "Heartbeat received",
        });
      } catch (error) {
        console.error("Heartbeat error:", error);
        return res.status(500).json({
          error: true,
          message: error.message || "Internal server error",
        });
      }
    }
  );

  // Check if any admin is online
  app.get(
    "/v1/api/longtermhire/chat/admin-status",
    TokenMiddleware(),
    RoleMiddleware(["super_admin", "member"]),
    async (req, res) => {
      try {
        const onlineUsers = await chatService.getOnlineUsers();
        const sdk = app.get("sdk");
        sdk.setProjectId("longtermhire");

        // Get admin user IDs
        const adminSQL = `SELECT id FROM longtermhire_user WHERE role_id = 'super_admin'`;
        const admins = await sdk.rawQuery(adminSQL);
        const adminIds = admins.map((admin) => admin.id.toString());

        // Check if any admin is online
        const onlineAdmins = onlineUsers.filter((userId) =>
          adminIds.includes(userId)
        );
        const hasOnlineAdmin = onlineAdmins.length > 0;

        return res.status(200).json({
          error: false,
          data: {
            has_online_admin: hasOnlineAdmin,
            online_admin_count: onlineAdmins.length,
            total_admin_count: adminIds.length,
          },
        });
      } catch (error) {
        console.error("Admin status check error:", error);
        return res.status(500).json({
          error: true,
          message: error.message || "Internal server error",
        });
      }
    }
  );

  // Get chat conversations for a user
  app.get(
    "/v1/api/longtermhire/chat/conversations",
    TokenMiddleware(),
    RoleMiddleware(["super_admin", "member"]),
    async (req, res) => {
      try {
        const sdk = app.get("sdk");
        sdk.setProjectId("longtermhire");

        const userId = req.user_id;
        const userRole = req.role;

        console.log(
          `Getting conversations for user ${userId} with role ${userRole}`
        );

        let conversationsSQL;
        let params;

        if (userRole === "super_admin") {
          // Admin sees all conversations
          conversationsSQL = `
            SELECT
              c.id,
              c.user1_id,
              c.user2_id,
              c.last_message_text,
              c.unread_count,
              c.updated_at,
              COALESCE(cl1.client_name, u1.email) as user1_name,
              COALESCE(cl2.client_name, u2.email) as user2_name,
              CASE
                WHEN c.user1_id = ? THEN COALESCE(cl2.client_name, u2.email)
                ELSE COALESCE(cl1.client_name, u1.email)
              END as other_user_name,
              CASE
                WHEN c.user1_id = ? THEN c.user2_id
                ELSE c.user1_id
              END as other_user_id
            FROM longtermhire_chat_conversations c
            LEFT JOIN longtermhire_user u1 ON c.user1_id = u1.id
            LEFT JOIN longtermhire_user u2 ON c.user2_id = u2.id
            LEFT JOIN longtermhire_client cl1 ON u1.id = cl1.user_id
            LEFT JOIN longtermhire_client cl2 ON u2.id = cl2.user_id
            WHERE c.user1_id = ? OR c.user2_id = ?
            GROUP BY c.id
            ORDER BY c.updated_at DESC
          `;
          params = [userId, userId, userId, userId];
        } else {
          // Client only sees conversations with admin
          conversationsSQL = `
            SELECT DISTINCT
              c.id,
              c.user1_id,
              c.user2_id,
              c.last_message_text,
              c.unread_count,
              c.updated_at,
              COALESCE(cl1.client_name, u1.email) as user1_name,
              COALESCE(cl2.client_name, u2.email) as user2_name,
              'Admin' as other_user_name,
              CASE
                WHEN c.user1_id = ? THEN c.user2_id
                ELSE c.user1_id
              END as other_user_id
            FROM longtermhire_chat_conversations c
            LEFT JOIN longtermhire_user u1 ON c.user1_id = u1.id
            LEFT JOIN longtermhire_user u2 ON c.user2_id = u2.id
            LEFT JOIN longtermhire_client cl1 ON u1.id = cl1.user_id
            LEFT JOIN longtermhire_client cl2 ON u2.id = cl2.user_id
            WHERE (c.user1_id = ? OR c.user2_id = ?)
            AND (u1.role_id = 'super_admin' OR u2.role_id = 'super_admin')
            ORDER BY c.updated_at DESC
          `;
          params = [userId, userId, userId];
        }

        const conversations = await sdk.rawQuery(conversationsSQL, params);

        return res.status(200).json({
          error: false,
          data: conversations || [],
        });
      } catch (error) {
        console.error("Get conversations error:", error);
        return res.status(500).json({
          error: true,
          message: error.message || "Internal server error",
        });
      }
    }
  );

  // Get messages for a conversation
  app.get(
    "/v1/api/longtermhire/chat/messages/:conversationId",
    TokenMiddleware(),
    RoleMiddleware(["super_admin", "member"]),
    async (req, res) => {
      try {
        const sdk = app.get("sdk");
        sdk.setProjectId("longtermhire");

        const { conversationId } = req.params;
        const { page = 1, limit = 30 } = req.query;
        const userId = req.user_id;
        const offset = (page - 1) * limit;

        // First get the conversation to verify access and get participants
        const conversationSQL = `
          SELECT user1_id, user2_id
          FROM longtermhire_chat_conversations
          WHERE id = ? AND (user1_id = ? OR user2_id = ?)
        `;

        const conversation = await sdk.rawQuery(conversationSQL, [
          conversationId,
          userId,
          userId,
        ]);

        if (!conversation || conversation.length === 0) {
          return res.status(404).json({
            error: true,
            message: "Conversation not found or access denied",
          });
        }

        const { user1_id, user2_id } = conversation[0];

        // Get messages for the conversation with pagination (latest first, then reverse for WhatsApp style)
        const messagesSQL = `
          SELECT
            m.id,
            m.from_user_id,
            m.to_user_id,
            m.message,
            m.message_type,
            m.equipment_id,
            m.equipment_name,
            m.created_at,
            m.read_at,
            COALESCE(cl.client_name, u.email) as from_user_name
          FROM longtermhire_chat_messages m
          LEFT JOIN longtermhire_user u ON m.from_user_id = u.id
          LEFT JOIN longtermhire_client cl ON u.id = cl.user_id
          WHERE ((m.from_user_id = ? AND m.to_user_id = ?) OR (m.from_user_id = ? AND m.to_user_id = ?))
          ORDER BY m.created_at DESC
          LIMIT ? OFFSET ?
        `;

        const messages = await sdk.rawQuery(messagesSQL, [
          user1_id,
          user2_id,
          user2_id,
          user1_id,
          parseInt(limit),
          parseInt(offset),
        ]);

        // Reverse to show oldest first (WhatsApp style)
        const reversedMessages = messages ? messages.reverse() : [];

        // Mark messages as read (only for this conversation)
        const markReadSQL = `
          UPDATE longtermhire_chat_messages
          SET read_at = NOW()
          WHERE to_user_id = ? AND read_at IS NULL
          AND ((from_user_id = ? AND to_user_id = ?) OR (from_user_id = ? AND to_user_id = ?))
        `;
        await sdk.rawQuery(markReadSQL, [
          userId,
          user1_id,
          user2_id,
          user2_id,
          user1_id,
        ]);

        return res.status(200).json({
          error: false,
          data: reversedMessages,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            hasMore: messages && messages.length === parseInt(limit),
          },
        });
      } catch (error) {
        console.error("Get messages error:", error);
        return res.status(500).json({
          error: true,
          message: error.message || "Internal server error",
        });
      }
    }
  );

  // Send a chat message
  app.post(
    "/v1/api/longtermhire/chat/send",
    TokenMiddleware(),
    RoleMiddleware(["super_admin", "member"]),
    async (req, res) => {
      try {
        const sdk = app.get("sdk");
        sdk.setProjectId("longtermhire");

        const fromUserId = req.user_id;
        const { to_user_id, message, message_type = "text" } = req.body;

        if (!to_user_id || !message) {
          return res.status(400).json({
            error: true,
            message: "to_user_id and message are required",
          });
        }

        // Check if sender is a client and if any admin is online
        const senderRoleSQL = `SELECT role_id FROM longtermhire_user WHERE id = ?`;
        const senderRole = await sdk.rawQuery(senderRoleSQL, [fromUserId]);
        const isClient = senderRole[0]?.role_id === "member";

        let shouldSendAutoResponse = false;
        let autoResponseMessageId = null;

        if (isClient) {
          // Check if any admin is online
          const onlineUsers = await chatService.getOnlineUsers();
          const adminSQL = `SELECT id FROM longtermhire_user WHERE role_id = 'super_admin'`;
          const admins = await sdk.rawQuery(adminSQL);
          const adminIds = admins.map((admin) => admin.id.toString());
          const onlineAdmins = onlineUsers.filter((userId) =>
            adminIds.includes(userId)
          );

          if (onlineAdmins.length === 0) {
            shouldSendAutoResponse = true;
          }
        }

        // Insert original message into database
        const insertSQL = `
          INSERT INTO longtermhire_chat_messages 
          (from_user_id, to_user_id, message, message_type, created_at)
          VALUES (?, ?, ?, ?, NOW())
        `;

        const result = await sdk.rawQuery(insertSQL, [
          fromUserId,
          to_user_id,
          message,
          message_type,
        ]);
        const messageId = result.insertId;

        // Log chat activity
        try {
          const chatActivitySQL = `
            INSERT INTO longtermhire_chat_activity_logs
            (user_id, activity_type, message_id, activity_time)
            VALUES (?, 'message_sent', ?, NOW())
          `;

          await sdk.rawQuery(chatActivitySQL, [fromUserId, messageId]);
        } catch (logError) {
          console.error("⚠️ Failed to log chat activity:", logError);
        }

        // Update or create conversation
        const upsertConversationSQL = `
          INSERT INTO longtermhire_chat_conversations 
          (user1_id, user2_id, last_message_id, last_message_text, updated_at)
          VALUES (LEAST(?, ?), GREATEST(?, ?), ?, ?, NOW())
          ON DUPLICATE KEY UPDATE
          last_message_id = VALUES(last_message_id),
          last_message_text = VALUES(last_message_text),
          updated_at = VALUES(updated_at)
        `;

        await sdk.rawQuery(upsertConversationSQL, [
          fromUserId,
          to_user_id,
          fromUserId,
          to_user_id,
          messageId,
          message,
        ]);

        // Send auto-response if no admin is online
        if (shouldSendAutoResponse) {
          try {
            // Get any admin user ID for auto-response
            const adminSQL = `SELECT id FROM longtermhire_user WHERE role_id = 'super_admin' LIMIT 1`;
            const adminResult = await sdk.rawQuery(adminSQL);

            if (adminResult && adminResult.length > 0) {
              const adminId = adminResult[0].id;
              const autoResponseText =
                "Thank you for your message. Our team is currently offline, but we'll respond within 24 hours during business hours.";

              // Insert auto-response message
              const autoResponseSQL = `
                INSERT INTO longtermhire_chat_messages 
                (from_user_id, to_user_id, message, message_type, created_at)
                VALUES (?, ?, ?, 'auto_response', NOW())
              `;

              const autoResponseResult = await sdk.rawQuery(autoResponseSQL, [
                adminId,
                fromUserId,
                autoResponseText,
              ]);

              autoResponseMessageId = autoResponseResult.insertId;

              // Update conversation with auto-response
              await sdk.rawQuery(upsertConversationSQL, [
                adminId,
                fromUserId,
                adminId,
                fromUserId,
                autoResponseMessageId,
                autoResponseText,
              ]);

              // Send auto-response via Redis
              await chatService.sendMessage(adminId, fromUserId, {
                id: autoResponseMessageId,
                message: autoResponseText,
                message_type: "auto_response",
              });

              console.log(
                `✅ Auto-response sent to client ${fromUserId} - no admin online`
              );
            }
          } catch (autoResponseError) {
            console.error(
              "⚠️ Failed to send auto-response:",
              autoResponseError
            );
          }
        }

        // Send real-time message via Redis
        await chatService.sendMessage(fromUserId, to_user_id, {
          id: messageId,
          message,
          message_type,
        });

        return res.status(200).json({
          error: false,
          message: "Message sent successfully",
          data: {
            id: messageId,
            auto_response_sent: shouldSendAutoResponse,
            auto_response_id: autoResponseMessageId,
          },
        });
      } catch (error) {
        console.error("Send message error:", error);
        return res.status(500).json({
          error: true,
          message: error.message || "Internal server error",
        });
      }
    }
  );

  // Send equipment request
  app.post(
    "/v1/api/longtermhire/chat/equipment-request",
    TokenMiddleware(),
    RoleMiddleware(["member"]),
    async (req, res) => {
      try {
        const sdk = app.get("sdk");
        sdk.setProjectId("longtermhire");

        const clientId = req.user_id;
        const { equipment_id, equipment_name, message } = req.body;

        if (!equipment_id || !equipment_name) {
          return res.status(400).json({
            error: true,
            message: "equipment_id and equipment_name are required",
          });
        }

        // Check if client has existing conversation with any admin
        const existingConversationSQL = `
          SELECT
            c.user1_id,
            c.user2_id,
            CASE
              WHEN c.user1_id = ? THEN c.user2_id
              ELSE c.user1_id
            END as admin_id
          FROM longtermhire_chat_conversations c
          JOIN longtermhire_user u ON (
            (c.user1_id = u.id AND c.user2_id = ?) OR
            (c.user2_id = u.id AND c.user1_id = ?)
          )
          WHERE u.role_id = 'super_admin'
          LIMIT 1
        `;

        const existingConversation = await sdk.rawQuery(
          existingConversationSQL,
          [clientId, clientId, clientId]
        );

        let adminId;

        if (existingConversation && existingConversation.length > 0) {
          // Use admin from existing conversation
          adminId = existingConversation[0].admin_id;
        } else {
          // No existing conversation, get any admin
          const adminSQL = `SELECT id FROM longtermhire_user WHERE role_id = 'super_admin' LIMIT 1`;
          const adminResult = await sdk.rawQuery(adminSQL);

          if (!adminResult || adminResult.length === 0) {
            return res.status(404).json({
              error: true,
              message: "Admin not found",
            });
          }

          adminId = adminResult[0].id;
        }
        const requestMessage =
          message ||
          `I would like to request the ${equipment_name} (ID: ${equipment_id}).`;

        // Insert chat message
        const insertMessageSQL = `
          INSERT INTO longtermhire_chat_messages 
          (from_user_id, to_user_id, message, message_type, equipment_id, equipment_name, created_at)
          VALUES (?, ?, ?, 'equipment_request', ?, ?, NOW())
        `;

        const messageResult = await sdk.rawQuery(insertMessageSQL, [
          clientId,
          adminId,
          requestMessage,
          equipment_id,
          equipment_name,
        ]);
        const messageId = messageResult.insertId;

        // Log the equipment request
        const insertRequestSQL = `
          INSERT INTO longtermhire_equipment_requests 
          (client_id, equipment_id, message_id, status, request_date)
          VALUES (?, ?, ?, 'pending', NOW())
        `;

        await sdk.rawQuery(insertRequestSQL, [
          clientId,
          equipment_id,
          messageId,
        ]);

        // Update or create conversation (use same logic as regular chat)
        const upsertConversationSQL = `
          INSERT INTO longtermhire_chat_conversations
          (user1_id, user2_id, last_message_id, last_message_text, updated_at)
          VALUES (LEAST(?, ?), GREATEST(?, ?), ?, ?, NOW())
          ON DUPLICATE KEY UPDATE
          last_message_id = VALUES(last_message_id),
          last_message_text = VALUES(last_message_text),
          updated_at = VALUES(updated_at)
        `;

        await sdk.rawQuery(upsertConversationSQL, [
          clientId,
          adminId,
          clientId,
          adminId,
          messageId,
          requestMessage,
        ]);

        // Send real-time equipment request via Redis
        await chatService.sendEquipmentRequest(
          clientId,
          adminId,
          {
            equipment_id,
            equipment_name,
          },
          messageId
        );

        // Log equipment request activity
        try {
          const equipmentActivitySQL = `
            INSERT INTO longtermhire_chat_activity_logs
            (user_id, activity_type, message_id, equipment_id, activity_time)
            VALUES (?, 'equipment_request', ?, ?, NOW())
          `;

          await sdk.rawQuery(equipmentActivitySQL, [
            clientId,
            messageId,
            equipment_id,
          ]);
        } catch (logError) {
          console.error(
            "⚠️ Failed to log equipment request activity:",
            logError
          );
        }

        console.log(
          `✅ Equipment request sent: Client ${clientId} requested equipment ${equipment_id}`
        );

        return res.status(200).json({
          error: false,
          message: "Equipment request sent successfully",
          data: {
            message_id: messageId,
            request_status: "pending",
          },
        });
      } catch (error) {
        console.error("Equipment request error:", error);
        return res.status(500).json({
          error: true,
          message: error.message || "Internal server error",
        });
      }
    }
  );

  // Get all clients (for admin to start conversations)
  app.get(
    "/v1/api/longtermhire/chat/clients",
    TokenMiddleware(),
    RoleMiddleware(["super_admin"]),
    async (req, res) => {
      try {
        const sdk = app.get("sdk");
        sdk.setProjectId("longtermhire");

        // Get all clients with their details (only users who have client profiles)
        const clientsSQL = `
          SELECT DISTINCT
            u.id as user_id,
            u.email,
            COALESCE(cl.client_name, u.email) as name,
            cl.company_name,
            cl.phone,
            u.created_at,
            CASE
              WHEN conv.id IS NOT NULL THEN 1
              ELSE 0
            END as has_conversation
          FROM longtermhire_user u
          INNER JOIN longtermhire_client cl ON u.id = cl.user_id
          LEFT JOIN longtermhire_chat_conversations conv ON
            (conv.user1_id = u.id OR conv.user2_id = u.id)
          WHERE u.role_id = 'member' AND cl.id IS NOT NULL
          ORDER BY cl.client_name ASC, u.email ASC
        `;

        const clients = await sdk.rawQuery(clientsSQL);

        return res.status(200).json({
          error: false,
          data: clients || [],
        });
      } catch (error) {
        console.error("Get clients error:", error);
        return res.status(500).json({
          error: true,
          message: error.message || "Internal server error",
        });
      }
    }
  );

  // Start a new conversation (admin with client)
  app.post(
    "/v1/api/longtermhire/chat/start-conversation",
    TokenMiddleware(),
    RoleMiddleware(["super_admin"]),
    async (req, res) => {
      try {
        const sdk = app.get("sdk");
        sdk.setProjectId("longtermhire");

        const adminId = req.user_id;
        const { client_id, initial_message } = req.body;

        if (!client_id) {
          return res.status(400).json({
            error: true,
            message: "Client ID is required",
          });
        }

        // Verify client exists
        const clientCheckSQL = `
          SELECT id FROM longtermhire_user
          WHERE id = ? AND role_id = 'member'
        `;

        const clientExists = await sdk.rawQuery(clientCheckSQL, [client_id]);

        if (!clientExists || clientExists.length === 0) {
          return res.status(404).json({
            error: true,
            message: "Client not found",
          });
        }

        // Check if conversation already exists (using LEAST/GREATEST for consistency)
        const existingConversationSQL = `
          SELECT id FROM longtermhire_chat_conversations
          WHERE user1_id = LEAST(?, ?) AND user2_id = GREATEST(?, ?)
        `;

        const existingConversation = await sdk.rawQuery(
          existingConversationSQL,
          [adminId, client_id, adminId, client_id]
        );

        let conversationId;

        if (existingConversation && existingConversation.length > 0) {
          conversationId = existingConversation[0].id;
        } else {
          // Create new conversation using LEAST/GREATEST for consistency
          const insertConversationSQL = `
            INSERT INTO longtermhire_chat_conversations
            (user1_id, user2_id, last_message_text, updated_at)
            VALUES (LEAST(?, ?), GREATEST(?, ?), ?, NOW())
          `;

          const conversationResult = await sdk.rawQuery(insertConversationSQL, [
            adminId,
            client_id,
            adminId,
            client_id,
            initial_message || "Conversation started",
          ]);

          conversationId = conversationResult.insertId;
        }

        // Send initial message if provided
        if (initial_message) {
          const insertMessageSQL = `
            INSERT INTO longtermhire_chat_messages
            (from_user_id, to_user_id, message, created_at)
            VALUES (?, ?, ?, NOW())
          `;

          const messageResult = await sdk.rawQuery(insertMessageSQL, [
            adminId,
            client_id,
            initial_message,
          ]);

          // Update conversation with the message
          const updateConversationSQL = `
            UPDATE longtermhire_chat_conversations
            SET last_message_id = ?, last_message_text = ?, updated_at = NOW()
            WHERE id = ?
          `;

          await sdk.rawQuery(updateConversationSQL, [
            messageResult.insertId,
            initial_message,
            conversationId,
          ]);
        }

        return res.status(200).json({
          error: false,
          message: "Conversation started successfully",
          data: {
            conversation_id: conversationId,
          },
        });
      } catch (error) {
        console.error("Start conversation error:", error);
        return res.status(500).json({
          error: true,
          message: error.message || "Internal server error",
        });
      }
    }
  );

  // Get dashboard statistics (for admin dashboard)
  app.get(
    "/v1/api/longtermhire/dashboard/stats",
    TokenMiddleware(),
    RoleMiddleware(["super_admin"]),
    async (req, res) => {
      try {
        const sdk = app.get("sdk");
        sdk.setProjectId("longtermhire");

        // Get recent equipment requests (last 7 days)
        const recentRequestsSQL = `
          SELECT
            er.id,
            er.client_id,
            COALESCE(cl.client_name, u.email) as client_name,
            er.equipment_id,
            er.status,
            er.request_date
          FROM longtermhire_equipment_requests er
          LEFT JOIN longtermhire_user u ON er.client_id = u.id
          LEFT JOIN longtermhire_client cl ON u.id = cl.user_id
          WHERE er.request_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
          ORDER BY er.request_date DESC
          LIMIT 10
        `;

        // Get recent chat activity (last 7 days)
        const recentChatSQL = `
          SELECT
            cal.user_id,
            COALESCE(cl.client_name, u.email) as user_name,
            cal.activity_type,
            cal.equipment_id,
            cal.activity_time
          FROM longtermhire_chat_activity_logs cal
          LEFT JOIN longtermhire_user u ON cal.user_id = u.id
          LEFT JOIN longtermhire_client cl ON u.id = cl.user_id
          WHERE cal.activity_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)
          AND cal.activity_type IN ('message_sent', 'equipment_request')
          ORDER BY cal.activity_time DESC
          LIMIT 10
        `;

        // Get statistics counts
        const statsSQL = `
          SELECT
            (SELECT COUNT(*) FROM longtermhire_user WHERE role_id = 'member') as total_clients,
            (SELECT COUNT(*) FROM longtermhire_equipment_item) as total_equipment,
            (SELECT COUNT(*) FROM longtermhire_chat_messages WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) AND read_at IS NULL) as recent_messages,
            (SELECT COUNT(*) FROM longtermhire_equipment_requests WHERE status = 'pending') as pending_requests
        `;

        // Execute all queries
        const [recentRequests, recentChat, stats] = await Promise.all([
          sdk.rawQuery(recentRequestsSQL),
          sdk.rawQuery(recentChatSQL),
          sdk.rawQuery(statsSQL),
        ]);

        return res.status(200).json({
          error: false,
          data: {
            stats: stats[0] || {},
            recent_requests: recentRequests || [],
            recent_chat_activity: recentChat || [],
          },
        });
      } catch (error) {
        console.error("Dashboard stats error:", error);
        return res.status(500).json({
          error: true,
          message: error.message || "Internal server error",
        });
      }
    }
  );

  // Clear activity logs
  app.delete(
    "/v1/api/longtermhire/dashboard/logs",
    TokenMiddleware(),
    RoleMiddleware(["super_admin"]),
    async (req, res) => {
      try {
        const sdk = app.get("sdk");
        sdk.setProjectId("longtermhire");

        // Clear various activity logs
        const clearQueries = [
          "DELETE FROM longtermhire_client_login_logs WHERE login_time < DATE_SUB(NOW(), INTERVAL 1 DAY)",
          "DELETE FROM longtermhire_chat_activity_logs WHERE activity_time < DATE_SUB(NOW(), INTERVAL 1 DAY)",
          "DELETE FROM longtermhire_equipment_requests WHERE status = 'completed' AND request_date < DATE_SUB(NOW(), INTERVAL 7 DAY)",
        ];

        // Execute all clear queries
        await Promise.all(clearQueries.map((query) => sdk.rawQuery(query)));

        return res.status(200).json({
          error: false,
          message: "Activity logs cleared successfully",
        });
      } catch (error) {
        console.error("Clear logs error:", error);
        return res.status(500).json({
          error: true,
          message: error.message || "Internal server error",
        });
      }
    }
  );

  // Mark messages as read
  app.put(
    "/v1/api/longtermhire/dashboard/messages/read",
    TokenMiddleware(),
    RoleMiddleware(["super_admin"]),
    async (req, res) => {
      try {
        const sdk = app.get("sdk");
        sdk.setProjectId("longtermhire");

        const { messageIds } = req.body;

        if (
          !messageIds ||
          !Array.isArray(messageIds) ||
          messageIds.length === 0
        ) {
          return res.status(400).json({
            error: true,
            message: "messageIds array is required",
          });
        }

        // Mark messages as read
        const placeholders = messageIds.map(() => "?").join(",");
        const updateSQL = `
          UPDATE longtermhire_chat_messages
          SET read_at = NOW()
          WHERE id IN (${placeholders}) AND read_at IS NULL
        `;

        await sdk.rawQuery(updateSQL, messageIds);

        return res.status(200).json({
          error: false,
          message: "Messages marked as read successfully",
        });
      } catch (error) {
        console.error("Mark messages as read error:", error);
        return res.status(500).json({
          error: true,
          message: error.message || "Internal server error",
        });
      }
    }
  );
};
