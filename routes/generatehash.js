const bcrypt = require("bcryptjs");

module.exports = function (app) {
  // Generate hash for any password - GET request for easy browser testing
  app.get("/v1/api/longtermhire/test/generate-hash/:password", async (req, res) => {
    try {
      const { password } = req.params;
      
      console.log("🔐 Generating hash for password:", password);
      
      // Generate hash with salt rounds 10 (same as your system)
      const hash = await bcrypt.hash(password, 10);
      
      console.log("✅ Generated hash:", hash);
      
      // Test the hash to make sure it works
      const isValid = await bcrypt.compare(password, hash);
      
      console.log("🧪 Hash verification test:", isValid);
      
      return res.status(200).json({
        error: false,
        password: password,
        hash: hash,
        verification_test: isValid,
        sql_update_command: `UPDATE longtermhire_user SET password = '${hash}' WHERE email = 'admin@equipmenthire.com';`,
        message: `Hash generated successfully for password: ${password}`
      });
      
    } catch (error) {
      console.error("❌ Hash generation error:", error);
      return res.status(500).json({
        error: true,
        message: error.message
      });
    }
  });

  // Generate hash for admin123 specifically
  app.get("/v1/api/longtermhire/test/generate-admin-hash", async (req, res) => {
    try {
      const password = "admin123";
      
      console.log("🔐 Generating hash for admin password:", password);
      
      const hash = await bcrypt.hash(password, 10);
      
      console.log("✅ Generated admin hash:", hash);
      
      const isValid = await bcrypt.compare(password, hash);
      
      return res.status(200).json({
        error: false,
        password: password,
        hash: hash,
        verification_test: isValid,
        sql_update_command: `UPDATE longtermhire_user SET password = '${hash}' WHERE email = 'admin@equipmenthire.com';`,
        message: "Admin hash generated successfully"
      });
      
    } catch (error) {
      console.error("❌ Admin hash generation error:", error);
      return res.status(500).json({
        error: true,
        message: error.message
      });
    }
  });
};
