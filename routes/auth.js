const express = require("express");
const authController = require("../controllers/authController");

const router = express.Router();

// 🔑 Login route
router.post("/login", authController.login);

// 🔑 Forgot password - send OTP to email
router.post("/request-reset", authController.requestReset);

// 🔑 Confirm reset - verify OTP and set new password
router.post("/confirm-reset", authController.confirmReset);

// 🔑 Refresh access token
router.post("/refresh", authController.refreshToken);

module.exports = router;
