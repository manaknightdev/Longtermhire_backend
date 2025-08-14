const TokenMiddleware = require("../../../baas/middleware/TokenMiddleware");
const RoleMiddleware = require("../middleware/RoleMiddleware");
const JwtService = require("../../../baas/services/JwtService");
const bcrypt = require("bcryptjs");

module.exports = function (app) {
  // Admin Login
  app.post("/v1/api/longtermhire/admin/login", async (req, res) => {
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
      console.log("🔍 Looking for user with email:", email);
      const user = await sdk.findOne("user", {
        email: email,
      });

      if (!user) {
        console.log("❌ User not found with email:", email);
        return res.status(401).json({
          error: true,
          message: "Invalid credentials",
        });
      }

      console.log("✅ User found:", {
        id: user.id,
        email: user.email,
        role_id: user.role_id,
        status: user.status,
        verify: user.verify,
        password_hash: user.password,
      });

      // Verify password using bcrypt
      console.log("🔐 Comparing password:", password);
      console.log("🔐 Against hash:", user.password);
      const isValidPassword = await bcrypt.compare(password, user.password);
      console.log("🔐 Password comparison result:", isValidPassword);

      if (!isValidPassword) {
        console.log("❌ Password verification failed");
        return res.status(401).json({
          error: true,
          message: "Invalid credentials",
        });
      }

      console.log("✅ Password verification successful");

      // Check if user is active
      console.log("🔍 Checking user status:", user.status);
      if (user.status !== 1) {
        console.log("❌ User account is not active");
        return res.status(401).json({
          error: true,
          message: "Account is not active",
        });
      }

      // Check if email is verified
      console.log("🔍 Checking email verification:", user.verify);
      if (!user.verify) {
        console.log("❌ Email is not verified");
        return res.status(401).json({
          error: true,
          message: "Email is not verified",
        });
      }

      // Check if user has admin role
      console.log("🔍 Checking user role:", user.role_id);
      if (user.role_id !== "super_admin") {
        console.log("❌ User does not have super_admin role");
        return res.status(403).json({
          error: true,
          message: "Access denied. Admin privileges required",
        });
      }

      console.log("✅ All checks passed, generating token...");

      // Generate JWT token
      const tokenPayload = {
        user_id: user.id,
        role: user.role_id,
      };

      const accessToken = JwtService.createAccessToken(
        tokenPayload,
        60 * 60 * 24 * 1000,
        config.jwt_key
      );

      return res.status(200).json({
        error: false,
        access_token: accessToken,
        token: accessToken, // For compatibility with frontend
        user_id: user.id,
        role: user.role_id,
        email: user.email,
        expire_at: 60 * 60 * 24 * 1000,
        message: "Login successful",
      });
    } catch (error) {
      console.error("Admin login error:", error);
      return res.status(500).json({
        error: true,
        message: error.message || "Internal server error",
      });
    }
  });

  // Admin Logout
  app.post(
    "/v1/api/longtermhire/admin/logout",
    TokenMiddleware(),
    RoleMiddleware(["super_admin"]),
    async (req, res) => {
      try {
        // In a real app, you'd invalidate the token in database
        return res.status(200).json({
          error: false,
          message: "Logged out successfully",
        });
      } catch (error) {
        console.error("Admin logout error:", error);
        return res.status(500).json({
          error: true,
          message: error.message || "Internal server error",
        });
      }
    }
  );

  // Get Admin Profile
  app.get(
    "/v1/api/longtermhire/admin/profile",
    TokenMiddleware(),
    RoleMiddleware(["super_admin"]),
    async (req, res) => {
      try {
        const sdk = app.get("sdk");
        sdk.setProjectId("longtermhire");

        const user = await sdk.findOne("user", {
          id: req.user_id,
        });

        if (!user) {
          return res.status(404).json({
            error: true,
            message: "User not found",
          });
        }

        // Remove password from response
        const { password, ...userProfile } = user;

        return res.status(200).json({
          error: false,
          data: userProfile,
        });
      } catch (error) {
        console.error("Get admin profile error:", error);
        return res.status(500).json({
          error: true,
          message: error.message || "Internal server error",
        });
      }
    }
  );

  // Update Admin Profile
  app.put(
    "/v1/api/longtermhire/admin/profile",
    TokenMiddleware(),
    RoleMiddleware(["super_admin"]),
    async (req, res) => {
      try {
        const sdk = app.get("sdk");
        sdk.setProjectId("longtermhire");

        const { data } = req.body;

        if (!data) {
          return res.status(400).json({
            error: true,
            message: "Profile data is required",
          });
        }

        console.log("Updating admin profile with data:", data);

        // Get current user to verify they exist
        const user = await sdk.findOne("user", {
          id: req.user_id,
        });

        if (!user) {
          return res.status(404).json({
            error: true,
            message: "User not found",
          });
        }

        // Update user profile using raw SQL to avoid SDK issues
        const currentTime = new Date()
          .toISOString()
          .slice(0, 19)
          .replace("T", " ");

        const updateSQL = `
          UPDATE longtermhire_user
          SET data = ?, updated_at = ?
          WHERE id = ?
        `;

        await sdk.rawQuery(updateSQL, [
          JSON.stringify(data),
          currentTime,
          req.user_id,
        ]);

        console.log("✅ Admin profile updated successfully");

        return res.status(200).json({
          error: false,
          message: "Profile updated successfully",
        });
      } catch (error) {
        console.error("Update admin profile error:", error);
        return res.status(500).json({
          error: true,
          message: error.message || "Internal server error",
        });
      }
    }
  );

  // Change Admin Password
  app.put(
    "/v1/api/longtermhire/admin/reset-password",
    TokenMiddleware(),
    RoleMiddleware(["super_admin"]),
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

        console.log("Updating admin password for user ID:", req.user_id);

        await sdk.rawQuery(updatePasswordSQL, [
          hashedNewPassword,
          currentTime,
          req.user_id,
        ]);

        console.log("✅ Admin password updated successfully");

        return res.status(200).json({
          error: false,
          message: "Password changed successfully",
        });
      } catch (error) {
        console.error("Change password error:", error);
        return res.status(500).json({
          error: true,
          message: error.message || "Internal server error",
        });
      }
    }
  );
};
