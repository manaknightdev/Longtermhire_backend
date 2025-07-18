const AuthService = require("../../../baas/services/AuthService");
const PasswordService = require("../../../baas/services/PasswordService");
const JwtService = require("../../../baas/services/JwtService");

const middlewares = [];

const handleLogin = async (req, res, sdk) => {
  try {
    const config = req.app.get("configuration");
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: true,
        message: "Email and password are required",
      });
    }

    // Set project ID
    sdk.setProjectId("longtermhire");

    // Find user by email
    const user = await sdk.findOne("user", {
      email: email,
    });

    if (!user) {
      return res.status(401).json({
        error: true,
        message: "Invalid credentials",
      });
    }

    // For demo purposes - simple password comparison (in production, use bcrypt)
    if (user.password !== password) {
      return res.status(401).json({
        error: true,
        message: "Invalid credentials",
      });
    }

    // Check if user is active
    if (user.status !== 1) {
      return res.status(401).json({
        error: true,
        message: "Account is not active",
      });
    }

    // Check if email is verified
    if (!user.verify) {
      return res.status(401).json({
        error: true,
        message: "Email is not verified",
      });
    }

    // Generate simple token (in production, use JWT)
    const token = "demo_token_" + user.id + "_" + Date.now();

    return res.status(200).json({
      error: false,
      access_token: token,
      user_id: user.id,
      role: user.role_id,
      email: user.email,
      message: "Login successful",
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      error: true,
      message: error.message || "Internal server error",
    });
  }
};

module.exports = function (app) {
  app.post("/v1/api/longtermhire/super_admin/lambda/login", middlewares, async (req, res) => {
    await handleLogin(req, res, app.get("sdk"));
  });
};

// API definition for Postman collection
module.exports.getPostmanDefinition = function () {
  return [
    {
      method: "POST",
      name: "Super Admin Login API",
      url: "/v1/api/longtermhire/super_admin/lambda/login",
      successBody: '{"email": "admin@equipmenthire.com", "password": "admin123"}',
      successPayload: '{"error": false, "access_token": "demo_token_1_1234567890", "user_id": 1, "role": "super_admin", "email": "admin@equipmenthire.com", "message": "Login successful"}',
      errors: [
        {
          name: "400",
          body: '{"email": "", "password": ""}',
          response: '{"error": true, "message": "Email and password are required"}',
        },
        {
          name: "401",
          body: '{"email": "wrong@email.com", "password": "wrongpass"}',
          response: '{"error": true, "message": "Invalid credentials"}',
        },
      ],
      needToken: false,
    },
  ];
};
