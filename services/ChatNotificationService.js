const MailService = require("../../../baas/services/MailService");

class ChatNotificationService {
  constructor(config) {
    this.mailService = new MailService(config);
    this.config = config;
  }

  /**
   * Check if we can send a chat notification (rate limiting)
   * @param {number} fromUserId - The sender's user ID
   * @param {number} toUserId - The recipient's user ID
   * @param {Object} sdk - The SDK instance
   * @returns {Promise<boolean>} - True if notification can be sent
   */
  async canSendChatNotification(fromUserId, toUserId, sdk) {
    try {
      console.log(
        "🔍 Checking rate limiting for from:",
        fromUserId,
        "to:",
        toUserId
      );

      const existingRecord = await sdk.findOne("chat_notifications", {
        client_user_id: fromUserId,
        admin_user_id: toUserId,
      });

      console.log("🔍 Existing notification record:", existingRecord);

      if (!existingRecord) {
        console.log("✅ No existing record, can send notification");
        return true; // First notification
      }

      const lastNotification = new Date(existingRecord.last_notification_sent);
      const now = new Date();
      const hoursSinceLastNotification =
        (now - lastNotification) / (1000 * 60 * 60);

      console.log("🔍 Last notification:", lastNotification);
      console.log("🔍 Current time:", now);
      console.log(
        "🔍 Hours since last notification:",
        hoursSinceLastNotification
      );

      // Allow notification if more than 24 hours have passed
      const canSend = hoursSinceLastNotification >= 24;
      console.log("🔍 Can send notification:", canSend);

      return canSend;
    } catch (error) {
      console.error("Error checking chat notification eligibility:", error);
      return false;
    }
  }

  /**
   * Send chat notification email to recipient
   * @param {number} fromUserId - The sender's user ID
   * @param {number} toUserId - The recipient's user ID
   * @param {Object} senderData - Sender information
   * @param {Object} recipientData - Recipient information
   * @param {Object} sdk - The SDK instance
   */
  async sendChatNotification(
    fromUserId,
    toUserId,
    senderData,
    recipientData,
    sdk
  ) {
    try {
      console.log("📧 ChatNotificationService.sendChatNotification called");
      console.log("📧 clientUserId:", clientUserId);
      console.log("📧 adminUserId:", adminUserId);
      console.log("📧 clientData:", clientData);
      console.log("📧 adminData:", adminData);

      // Check rate limiting
      const canSend = await this.canSendChatNotification(
        fromUserId,
        toUserId,
        sdk
      );
      console.log("📧 Rate limiting check result:", canSend);

      if (!canSend) {
        console.log(
          `⏰ Chat notification rate limited for user: ${fromUserId}`
        );
        return false;
      }

      // Create HTML email content
      const htmlContent = `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #292A2B;">
          <div style="background-color: #1F1F20; padding: 30px; border-radius: 8px; border: 2px solid #E5E7EB; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
            
            <!-- Header with Logo -->
            <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #333333;">
              <img src="https://longtermhire.manaknightdigital.com/login-logo.png" 
                   alt="Longterm Hire Logo" 
                   style="width: 240px; height: 135px; margin-bottom: 15px;">
              <h1 style="color: #E5E5E5; margin: 0; font-size: 24px; font-weight: 400;">💬 New Message Available</h1>
              <p style="color: #ADAEBC; margin: 10px 0 0 0; font-size: 16px;">You have a new message from our team</p>
            </div>

            <!-- Message Content -->
            <div style="background: #1C1C1C; padding: 25px; border-radius: 6px; margin: 25px 0; border: 1px solid #444444;">
              <h3 style="color: #E5E5E5; margin-top: 0; font-size: 18px; font-weight: 400;">Hello ${
                recipientData.client_name || recipientData.first_name || "there"
              }!</h3>
              <p style="color: #ADAEBC; line-height: 1.6; margin: 15px 0;">
                You have received a new message from our team at <strong>Longterm Hire</strong>.
              </p>
              
              <div style="background: #292A2B; padding: 15px; border-radius: 4px; border: 1px solid #444444; margin: 15px 0;">
                <p style="color: #E5E5E5; margin: 0; font-size: 14px;"><strong>From:</strong> ${
                  senderData.client_name || senderData.first_name || "User"
                } ${senderData.last_name || ""}</p>
                <p style="color: #ADAEBC; margin: 5px 0 0 0; font-size: 14px;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
              </div>
            </div>

            <!-- Login Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://longtermhire.manaknightdigital.com/client/login" 
                 style="background: #FDCE06; color: #1F1F20; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block; border: 1px solid #FDCE06;">
                🔗 Login to View Message
              </a>
            </div>

            <!-- Notice -->
            <div style="background: #1C1C1C; padding: 20px; border-radius: 6px; margin: 25px 0; border: 1px solid #444444; border-left: 4px solid #FDCE06;">
              <h4 style="color: #FDCE06; margin-top: 0; font-size: 16px; font-weight: 400;">ℹ️ Notification Policy</h4>
              <p style="color: #ADAEBC; margin: 10px 0 0 0; font-size: 14px; line-height: 1.5;">
                To avoid spam, you will only receive one notification per 24 hours. 
                Please log in to view all your messages and respond.
              </p>
            </div>

            <!-- Footer -->
            <div style="border-top: 1px solid #333333; padding-top: 20px; margin-top: 30px; text-align: center;">
              <p style="color: #ADAEBC; font-size: 14px; margin: 0;">
                Need assistance? Contact our support team.<br>
                <small style="color: #666666;">Notification sent on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</small>
              </p>
            </div>
          </div>
        </div>
      `;

      console.log("📧 About to send email to:", recipientData.email);
      console.log("📧 MailService config:", this.config);

      // Send email using correct MailService format (4 parameters)
      const emailResult = await this.mailService.send(
        this.config.mail?.from_mail || "admin@longtermhire.com", // from
        recipientData.email, // to
        "New Message from Longterm Hire Team", // subject
        htmlContent // html
      );
      console.log("📧 Email service result:", emailResult);

      if (emailResult && emailResult.error) {
        console.error("📧 Email service error:", emailResult.error);
        console.error("📧 Email service message:", emailResult.message);
      }

      // Update notification record
      const existingRecord = await sdk.findOne("chat_notifications", {
        client_user_id: fromUserId,
        admin_user_id: toUserId,
      });

      // Format date for MySQL (YYYY-MM-DD HH:MM:SS)
      const currentTime = new Date()
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");

      if (existingRecord) {
        await sdk.update("chat_notifications", {
          id: existingRecord.id,
          last_notification_sent: currentTime,
          notification_count_24h: existingRecord.notification_count_24h + 1,
        });
        console.log("📧 Updated existing notification record");
      } else {
        await sdk.create("chat_notifications", {
          client_user_id: fromUserId,
          admin_user_id: toUserId,
          last_notification_sent: currentTime,
          notification_count_24h: 1,
        });
        console.log("📧 Created new notification record");
      }

      console.log(`📧 Chat notification sent to: ${recipientData.email}`);
      return true;
    } catch (error) {
      console.error("Error sending chat notification:", error);
      return false;
    }
  }
}

module.exports = ChatNotificationService;
