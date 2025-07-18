const bcrypt = require("bcryptjs");

module.exports = function (app) {
  // Test endpoint to generate password hash
  app.get("/v1/api/longtermhire/test/hash/:password", async (req, res) => {
    try {
      const { password } = req.params;
      
      console.log("🔐 Generating hash for password:", password);
      
      // Generate hash
      const hash = await bcrypt.hash(password, 10);
      
      console.log("✅ Generated hash:", hash);
      
      // Test the hash
      const isValid = await bcrypt.compare(password, hash);
      
      return res.status(200).json({
        error: false,
        password: password,
        hash: hash,
        verification: isValid,
        sql_update: `UPDATE longtermhire_user SET password = '${hash}' WHERE email = 'admin@equipmenthire.com';`
      });
      
    } catch (error) {
      console.error("❌ Hash generation error:", error);
      return res.status(500).json({
        error: true,
        message: error.message
      });
    }
  });
};
