const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * 🔐 Role-based Authentication Middleware
 * @param {Array|string} roles - Allowed roles (e.g. ["superadmin", "admin"])
 */
const protect = (roles = []) => {
  // Always ensure roles is an array
  if (typeof roles === "string") roles = [roles];

  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;

      // 🚫 No token
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          success: false,
          msg: "No authorization token provided. Please login again.",
        });
      }

      const token = authHeader.split(" ")[1];
      let decoded;

      // 🧾 Verify token
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
        if (err.name === "TokenExpiredError") {
          return res.status(401).json({
            success: false,
            msg: "Session expired. Please login again.",
          });
        }
        return res.status(401).json({
          success: false,
          msg: "Invalid authentication token.",
        });
      }

      // 🔍 Fetch user from DB
      const user = await User.findById(decoded.id).select("-password");
      if (!user) {
        return res.status(401).json({
          success: false,
          msg: "User associated with this token no longer exists.",
        });
      }

      // 🚫 Inactive user
      if (user.isActive === false) {
        return res.status(403).json({
          success: false,
          msg: "Your account has been disabled. Please contact the Super Admin.",
        });
      }

      // ✅ Attach user to request
      req.user = user;

      // 🧩 Check role permission (if specified)
      if (roles.length) {
        const userRole = (user.role || "").toLowerCase();
        const allowedRoles = roles.map((r) => r.toLowerCase());

        if (!allowedRoles.includes(userRole)) {
          return res.status(403).json({
            success: false,
            msg: "Access denied: Insufficient permissions.",
          });
        }
      }

      // ✅ Continue
      next();
    } catch (err) {
      console.error("❌ Auth Middleware Error:", err.message);
      return res.status(500).json({
        success: false,
        msg: "Server error in authentication middleware.",
        error: err.message,
      });
    }
  };
};

module.exports = protect;
