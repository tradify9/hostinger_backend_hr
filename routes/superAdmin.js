const express = require("express");
const router = express.Router();

// 🧩 Controllers
const {
  createAdmin,
  updateAdmin,
  deleteAdmin,
  getAdmins,
  toggleAdminStatus,
  getEmployees,
  toggleEmployeeStatus,
  deleteEmployee,
  getTasks,
  deleteTask,
  getLeaves,
  approveLeave,
  rejectLeave,
  getMessages,
  deleteMessage,
  getReports,
  downloadReport,
  getSettings,
  updateSettings,
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

// ✅ Toggle employee status
router.patch("/employees/:id/status", protect(["superadmin"]), toggleEmployeeStatus);

// ✅ Delete employee
router.delete("/employees/:id", protect(["superadmin"]), deleteEmployee);

// ✅ Get all tasks
router.get("/tasks", protect(["superadmin"]), getTasks);

// ✅ Delete task
router.delete("/tasks/:id", protect(["superadmin"]), deleteTask);

// ✅ Get all leaves
router.get("/leaves", protect(["superadmin"]), getLeaves);

// ✅ Approve leave
router.patch("/leaves/:id/approve", protect(["superadmin"]), approveLeave);

// ✅ Reject leave
router.patch("/leaves/:id/reject", protect(["superadmin"]), rejectLeave);

// ✅ Get all messages
router.get("/messages", protect(["superadmin"]), getMessages);

// ✅ Delete message
router.delete("/messages/:id", protect(["superadmin"]), deleteMessage);

// ✅ Get reports
router.get("/reports", protect(["superadmin"]), getReports);

// ✅ Download report
router.get("/reports/download", protect(["superadmin"]), downloadReport);

// ✅ Get settings
router.get("/settings", protect(["superadmin"]), getSettings);

// ✅ Update settings
router.put("/settings", protect(["superadmin"]), updateSettings);

module.exports = router;
