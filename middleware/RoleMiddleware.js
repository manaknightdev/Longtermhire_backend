/**
 * Role-based access control middleware
 * Checks if the authenticated user has the required role(s) to access a route
 */

module.exports = function (allowedRoles = []) {
  return function (req, res, next) {
    // Check if user is authenticated (should be done by TokenMiddleware first)
    if (!req.user_id || !req.role) {
      return res.status(401).json({
        error: true,
        message: "UNAUTHORIZED",
        code: "UNAUTHORIZED",
      });
    }

    // If no specific roles are required, allow access
    if (!allowedRoles || allowedRoles.length === 0) {
      return next();
    }

    // Check if user's role is in the allowed roles list
    if (!allowedRoles.includes(req.role)) {
      return res.status(403).json({
        error: true,
        message: "FORBIDDEN - Insufficient permissions",
        code: "FORBIDDEN",
        required_roles: allowedRoles,
        user_role: req.role,
      });
    }

    // User has required role, proceed
    next();
  };
};
