const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    senderId: { type: String, required: true }, // Admin ID
    senderName: { type: String, required: true },
    recipientId: { type: String, required: true }, // Employee ID or 'all'
    recipientName: { type: String, required: true }, // Employee name or 'All Employees'
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    isRead: { type: Boolean, default: false },
    type: { type: String, enum: ["general", "personal"], default: "general" }, // general for all, personal for specific
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Notification", notificationSchema);
