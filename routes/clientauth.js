const TokenMiddleware = require("../../../baas/middleware/TokenMiddleware");
const RoleMiddleware = require("../middleware/RoleMiddleware");
const JwtService = require("../../../baas/services/JwtService");
const bcrypt = require("bcryptjs");

module.exports = function (app) {
  // Client Login
  app.post("/v1/api/longtermhire/client/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          error: true,
          message: "Email and password are required",
        });
      }

      const config = app.get("configuration");
      const sdk = app.get("sdk");
      sdk.setProjectId("longtermhire");

      // Find user by email
      console.log("🔍 Client login attempt for email:", email);
      const user = await sdk.findOne("user", {
        email: email,
      });

      if (!user) {
        console.log("❌ Client user not found with email:", email);
        return res.status(401).json({
          error: true,
          message: "Invalid credentials",
        });
      }

      console.log("✅ Client user found:", {
        id: user.id,
        email: user.email,
        role_id: user.role_id,
        status: user.status,
        verify: user.verify,
      });

      // Verify password using bcrypt
      console.log("🔐 Comparing client password");
      const isValidPassword = await bcrypt.compare(password, user.password);
      console.log("🔐 Client password comparison result:", isValidPassword);

      if (!isValidPassword) {
        console.log("❌ Client password verification failed");
        return res.status(401).json({
          error: true,
          message: "Invalid credentials",
        });
      }

      console.log("✅ Client password verification successful");

      // Check if user is active
      console.log("🔍 Checking client user status:", user.status);
      if (user.status !== 1) {
        console.log("❌ Client account is not active");
        return res.status(401).json({
          error: true,
          message: "Account is not active",
        });
      }

      // Check if email is verified
      console.log("🔍 Checking client email verification:", user.verify);
      if (!user.verify) {
        console.log("❌ Client email is not verified");
        return res.status(401).json({
          error: true,
          message: "Email is not verified",
        });
      }

      // Check if user has member role (clients use member role)
      console.log("🔍 Checking client user role:", user.role_id);
      if (user.role_id !== "member") {
        console.log("❌ User does not have member role");
        return res.status(403).json({
          error: true,
          message: "Access denied. Client privileges required",
        });
      }

      console.log("✅ All client checks passed, generating token...");

      // Generate JWT token
      const tokenPayload = {
        user_id: user.id,
        role: user.role_id,
      };

      const accessToken = JwtService.createAccessToken(
        tokenPayload,
        config.access_jwt_expire,
        config.jwt_key
      );

      // Get client profile information
      let clientProfile = null;
      try {
        clientProfile = await sdk.findOne("client", {
          user_id: user.id,
        });
      } catch (error) {
        console.log("⚠️ No client profile found for user:", user.id);
      }

      console.log("🎉 Client login successful for:", email);

      // Log client login activity
      try {
        const loginLogSQL = `
          INSERT INTO longtermhire_client_login_logs
          (client_id, login_time, ip_address, user_agent)
          VALUES (?, NOW(), ?, ?)
        `;

        const clientIp =
          req.ip ||
          req.connection.remoteAddress ||
          req.headers["x-forwarded-for"] ||
          "unknown";
        const userAgent = req.headers["user-agent"] || "unknown";

        await sdk.rawQuery(loginLogSQL, [user.id, clientIp, userAgent]);

        console.log("📝 Client login logged for user:", user.id);
      } catch (logError) {
        console.error("⚠️ Failed to log client login:", logError);
        // Don't fail the login if logging fails
      }

      return res.status(200).json({
        error: false,
        access_token: accessToken,
        token: accessToken, // For compatibility with frontend
        user_id: user.id,
        role: user.role_id,
        email: user.email,
        client_profile: clientProfile,
        expire_at: config.access_jwt_expire,
        message: "Login successful",
      });
    } catch (error) {
      console.error("Client login error:", error);
      return res.status(500).json({
        error: true,
        message: error.message || "Internal server error",
      });
    }
  });

  // Client Logout
  app.post(
    "/v1/api/longtermhire/client/logout",
    TokenMiddleware(),
    RoleMiddleware(["member"]),
    async (req, res) => {
      try {
        console.log("🚪 Client logout for user:", req.user_id);
        // In a real app, you'd invalidate the token in database
        return res.status(200).json({
          error: false,
          message: "Logout successful",
        });
      } catch (error) {
        console.error("Client logout error:", error);
        return res.status(500).json({
          error: true,
          message: error.message || "Internal server error",
        });
      }
    }
  );

  // Get Client Profile
  app.get(
    "/v1/api/longtermhire/client/profile",
    TokenMiddleware(),
    RoleMiddleware(["member"]),
    async (req, res) => {
      try {
        const sdk = app.get("sdk");
        sdk.setProjectId("longtermhire");

        // Get user information
        const user = await sdk.findOne("user", {
          id: req.user_id,
        });

        if (!user) {
          return res.status(404).json({
            error: true,
            message: "User not found",
          });
        }

        // Get client profile
        let clientProfile = null;
        try {
          clientProfile = await sdk.findOne("client", {
            user_id: req.user_id,
          });
        } catch (error) {
          console.log("⚠️ No client profile found for user:", req.user_id);
        }

        // Remove password from response
        const { password, ...userProfile } = user;

        return res.status(200).json({
          error: false,
          data: {
            user: userProfile,
            client_profile: clientProfile,
          },
        });
      } catch (error) {
        console.error("Get client profile error:", error);
        return res.status(500).json({
          error: true,
          message: error.message || "Internal server error",
        });
      }
    }
  );

  // Update Client Profile
  app.put(
    "/v1/api/longtermhire/client/profile",
    TokenMiddleware(),
    RoleMiddleware(["member"]),
    async (req, res) => {
      try {
        const sdk = app.get("sdk");
        sdk.setProjectId("longtermhire");

        const { client_name, name } = req.body;

        if (!client_name && !name) {
          return res.status(400).json({
            error: true,
            message: "Client name is required",
          });
        }

        // Get current user
        const user = await sdk.findOne("user", {
          id: req.user_id,
        });

        if (!user) {
          return res.status(404).json({
            error: true,
            message: "User not found",
          });
        }

        // Get client profile
        let clientProfile = await sdk.findOne("client", {
          user_id: req.user_id,
        });

        if (!clientProfile) {
          return res.status(404).json({
            error: true,
            message: "Client profile not found",
          });
        }

        // Update client profile using raw SQL to avoid SDK issues
        const currentTime = new Date()
          .toISOString()
          .slice(0, 19)
          .replace("T", " ");

        const updateSQL = `
          UPDATE longtermhire_client
          SET client_name = ?, updated_at = ?
          WHERE id = ?
        `;

        console.log("Updating client profile:", {
          client_id: clientProfile.id,
          new_name: client_name || name,
          sql: updateSQL,
        });

        await sdk.rawQuery(updateSQL, [
          client_name || name,
          currentTime,
          clientProfile.id,
        ]);

        console.log("✅ Client profile updated successfully");

        return res.status(200).json({
          error: false,
          message: "Profile updated successfully",
        });
      } catch (error) {
        console.error("Update client profile error:", error);
        return res.status(500).json({
          error: true,
          message: error.message || "Internal server error",
        });
      }
    }
  );

  // Change Client Password
  app.put(
    "/v1/api/longtermhire/client/change-password",
    TokenMiddleware(),
    RoleMiddleware(["member"]),
    async (req, res) => {
      try {
        const sdk = app.get("sdk");
        sdk.setProjectId("longtermhire");

        const { current_password, new_password } = req.body;

        if (!current_password || !new_password) {
          return res.status(400).json({
            error: true,
            message: "Current password and new password are required",
          });
        }

        // Get current user
        const user = await sdk.findOne("user", {
          id: req.user_id,
        });

        if (!user) {
          return res.status(404).json({
            error: true,
            message: "User not found",
          });
        }

        // Verify current password with bcrypt
        const isCurrentPasswordValid = await bcrypt.compare(
          current_password,
          user.password
        );
        if (!isCurrentPasswordValid) {
          return res.status(401).json({
            error: true,
            message: "Current password is incorrect",
          });
        }

        // Hash the new password
        const hashedNewPassword = await bcrypt.hash(new_password, 10);

        // Update password using raw SQL to avoid SDK issues
        const currentTime = new Date()
          .toISOString()
          .slice(0, 19)
          .replace("T", " ");

        const updatePasswordSQL = `
          UPDATE longtermhire_user
          SET password = ?, updated_at = ?
          WHERE id = ?
        `;

        console.log("Updating client password for user ID:", req.user_id);

        await sdk.rawQuery(updatePasswordSQL, [
          hashedNewPassword,
          currentTime,
          req.user_id,
        ]);

        console.log("✅ Client password updated successfully");

        return res.status(200).json({
          error: false,
          message: "Password changed successfully",
        });
      } catch (error) {
        console.error("Change client password error:", error);
        return res.status(500).json({
          error: true,
          message: error.message || "Internal server error",
        });
      }
    }
  );
};
