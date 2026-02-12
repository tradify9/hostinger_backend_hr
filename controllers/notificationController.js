const Notification = require("../models/Notification");
const User = require("../models/User");

// Admin - Send Notification
exports.sendNotification = async (req, res) => {
  try {
    const { recipientId, recipientName, subject, message, type } = req.body;
    const senderId = req.user._id; // From auth middleware
    const senderName = req.user.name || "Admin";

    if (!recipientId || !recipientName || !subject || !message) {
      return res.status(400).json({
        success: false,
        msg: "All fields are required",
      });
    }

    const notification = new Notification({
      senderId,
      senderName,
      recipientId,
      recipientName,
      subject,
      message,
      type: type || "general",
    });

    await notification.save();

    res.json({
      success: true,
      msg: "Notification sent successfully",
      data: notification,
    });
  } catch (err) {
    console.error("Error sending notification:", err);
    res.status(500).json({ success: false, msg: "Error sending notification" });
  }
};

// Employee - Get Notifications
exports.getNotifications = async (req, res) => {
  try {
    const employeeId = req.params.employeeId;

    const notifications = await Notification.find({
      $or: [{ recipientId: employeeId }, { recipientId: "all" }],
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      msg: "Notifications fetched successfully",
      data: notifications,
    });
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ success: false, msg: "Error fetching notifications" });
  }
};

// Employee - Mark as Read
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        msg: "Notification not found",
      });
    }

    res.json({
      success: true,
      msg: "Notification marked as read",
      data: notification,
    });
  } catch (err) {
    console.error("Error marking notification as read:", err);
    res.status(500).json({ success: false, msg: "Error updating notification" });
  }
};

// Admin - Get All Notifications
exports.getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      msg: "All notifications fetched successfully",
      data: notifications,
    });
  } catch (err) {
    console.error("Error fetching all notifications:", err);
    res.status(500).json({ success: false, msg: "Error fetching notifications" });
  }
};
