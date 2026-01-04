// Role-Based Access Control middleware
// Reads user role from request header and checks if it's in allowed roles

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    // Read role from request header (typically 'x-user-role' or 'role')
    const userRole = req.headers['x-user-role'] || req.headers['role'];

    if (!userRole) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: No role provided in request header'
      });
    }

    // Check if user's role is in the allowed roles list
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied: Role '${userRole}' does not have permission to access this resource`
      });
    }

    // Role is authorized, proceed to next middleware/route
    req.userRole = userRole;
    next();
  };
};

module.exports = { requireRole };

