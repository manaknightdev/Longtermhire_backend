const AuthService = require("../../baas/services/AuthService");
const TokenMiddleware = require("../../baas/middleware/TokenMiddleware");

// Import route modules
const adminAuthRoutes = require("./routes/adminauth");
const clientRoutes = require("./routes/client");
const equipmentRoutes = require("./routes/equipment");
const assignmentRoutes = require("./routes/assignment");
const pricingRoutes = require("./routes/pricing");
const requestRoutes = require("./routes/request");
const contentRoutes = require("./routes/content");

module.exports = function (app) {
  // Initialize all route modules
  adminAuthRoutes(app);
  clientRoutes(app);
  equipmentRoutes(app);
  assignmentRoutes(app);
  pricingRoutes(app);
  requestRoutes(app);
  contentRoutes(app);
};
