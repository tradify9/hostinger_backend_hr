const express = require("express");
const router = express.Router();

// 🧩 Controllers
const {
  createAdmin,
  updateAdmin,
  deleteAdmin,
  getAdmins,
  toggleAdminStatus,
  getEmployees, // ✅ added
} = require("../controllers/superAdminController");

// 🛡️ Auth Middleware
const protect = require("../middleware/authMiddleware");

/* ======================================================
   🔹 SUPERADMIN ROUTES
   Accessible only by users with role: "superadmin"
====================================================== */

// ✅ Get all admins
router.get("/admins", protect(["superadmin"]), getAdmins);

// ✅ Create new admin
router.post("/admins", protect(["superadmin"]), createAdmin);

// ✅ Update existing admin
router.put("/admins/:id", protect(["superadmin"]), updateAdmin);

// ✅ Delete admin
router.delete("/admins/:id", protect(["superadmin"]), deleteAdmin);

// ✅ Toggle enable / disable admin
router.patch("/admins/:id/status", protect(["superadmin"]), toggleAdminStatus);

// ✅ Get all employees (for SuperAdminDashboard.js)
router.get("/employees", protect(["superadmin"]), getEmployees);

module.exports = router;
