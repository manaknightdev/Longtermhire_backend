const MailService = require("../../../baas/services/MailService");

class ChatNotificationService {
  constructor(config) {
    this.mailService = new MailService(config);
    this.config = config;
  }

  /**
   * Check if we can send a chat notification (rate limiting)
   * @param {number} clientUserId - The client's user ID
   * @param {number} adminUserId - The admin's user ID
   * @param {Object} sdk - The SDK instance
   * @returns {Promise<boolean>} - True if notification can be sent
   */
  async canSendChatNotification(clientUserId, adminUserId, sdk) {
    try {
      const existingRecord = await sdk.findOne("chat_notifications", {
        client_user_id: clientUserId,
        admin_user_id: adminUserId,
      });

      if (!existingRecord) {
        return true; // First notification
      }

      const lastNotification = new Date(existingRecord.last_notification_sent);
      const now = new Date();
      const hoursSinceLastNotification =
        (now - lastNotification) / (1000 * 60 * 60);

      // Allow notification if more than 24 hours have passed
      return hoursSinceLastNotification >= 24;
    } catch (error) {
      console.error("Error checking chat notification eligibility:", error);
      return false;
    }
  }

  /**
   * Send chat notification email to client
   * @param {number} clientUserId - The client's user ID
   * @param {number} adminUserId - The admin's user ID
   * @param {Object} clientData - Client information
   * @param {Object} adminData - Admin information
   * @param {Object} sdk - The SDK instance
   */
  async sendChatNotification(
    clientUserId,
    adminUserId,
    clientData,
    adminData,
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
        clientUserId,
        adminUserId,
        sdk
      );
      console.log("📧 Rate limiting check result:", canSend);

      if (!canSend) {
        console.log(
          `⏰ Chat notification rate limited for client: ${clientUserId}`
        );
        return false;
      }

      const emailData = {
        to: clientData.email,
        subject: "New Message from Longterm Hire Team",
        html: `
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
                  clientData.client_name || "there"
                }!</h3>
                <p style="color: #ADAEBC; line-height: 1.6; margin: 15px 0;">
                  You have received a new message from our team at <strong>Longterm Hire</strong>.
                </p>
                
                <div style="background: #292A2B; padding: 15px; border-radius: 4px; border: 1px solid #444444; margin: 15px 0;">
                  <p style="color: #E5E5E5; margin: 0; font-size: 14px;"><strong>From:</strong> ${
                    adminData.first_name || "Admin"
                  } ${adminData.last_name || ""}</p>
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
        `,
      };

      console.log("📧 About to send email with data:", emailData);
      const emailResult = await this.mailService.send(emailData);
      console.log("📧 Email service result:", emailResult);

      // Update notification record
      const existingRecord = await sdk.findOne("chat_notifications", {
        client_user_id: clientUserId,
        admin_user_id: adminUserId,
      });

      if (existingRecord) {
        await sdk.update("chat_notifications", {
          id: existingRecord.id,
          last_notification_sent: new Date().toISOString(),
          notification_count_24h: existingRecord.notification_count_24h + 1,
        });
        console.log("📧 Updated existing notification record");
      } else {
        await sdk.create("chat_notifications", {
          client_user_id: clientUserId,
          admin_user_id: adminUserId,
          last_notification_sent: new Date().toISOString(),
          notification_count_24h: 1,
        });
        console.log("📧 Created new notification record");
      }

      console.log(`📧 Chat notification sent to client: ${clientData.email}`);
      return true;
    } catch (error) {
      console.error("Error sending chat notification:", error);
      return false;
    }
  }
}

module.exports = ChatNotificationService;
