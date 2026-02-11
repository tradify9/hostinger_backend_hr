const express = require("express");
const { requestReimbursement, getReimbursements } = require("../controllers/employeeController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// POST /api/employee/reimbursements - Request reimbursement
router.post("/", protect(["employee"]), requestReimbursement);

// GET /api/employee/reimbursements - Get reimbursements
router.get("/", protect(["employee"]), getReimbursements);

module.exports = router;
