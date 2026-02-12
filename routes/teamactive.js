const express = require("express");
const { getTeamActive } = require("../controllers/employeeController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// GET /api/employee/team-active - Get team active
router.get("/", protect(["employee"]), getTeamActive);

module.exports = router;
