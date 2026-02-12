const express = require("express");
const router = express.Router();
const {
  sendNotification,
  getNotifications,
  markAsRead,
  getAllNotifications,
} = require("../controllers/notificationController");
const authMiddleware = require("../middleware/authMiddleware");

// Admin - Send Notification
router.post("/", authMiddleware, sendNotification);

// Employee - Get Notifications
router.get("/:employeeId", authMiddleware, getNotifications);

// Employee - Mark as Read
router.put("/read/:notificationId", authMiddleware, markAsRead);

// Admin - Get All Notifications
router.get("/", authMiddleware, getAllNotifications);

module.exports = router;
