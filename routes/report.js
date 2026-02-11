const express = require("express");
const { submitReport, getReports } = require("../controllers/employeeController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// POST /api/employee/reports - Submit report
router.post("/", protect(["employee"]), submitReport);

// GET /api/employee/reports - Get reports
router.get("/", protect(["employee"]), getReports);

module.exports = router;
