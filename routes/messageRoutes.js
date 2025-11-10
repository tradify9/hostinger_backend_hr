const express = require("express");
const router = express.Router();
const {
  sendMessage,
  getAllMessages,
  getMessagesByAdmin,
  updateMessageStatus,
} = require("../controllers/messageController");
const Message = require("../models/Message"); // ✅ for delete route

// 🟢 Employee - Send Message
// POST /api/messages
router.post("/", sendMessage);

// 🟡 Employee - Get All Messages (frontend filters by employeeName)
/// GET /api/messages/all
router.get("/all", getAllMessages);

// 🟠 Admin - Get Messages by Admin ID
// GET /api/messages/admin/:adminId
router.get("/admin/:adminId", getMessagesByAdmin);

// 🔵 Admin - Update Message Status
// PUT /api/messages/status/:messageId
router.put("/status/:messageId", updateMessageStatus);

// 🔴 Admin - Delete Message
// DELETE /api/messages/:messageId
router.delete("/:messageId", async (req, res) => {
  try {
    const { adminId } = req.body; // ✅ ensure only correct admin can delete
    const { messageId } = req.params;

    if (!adminId) {
      return res
        .status(400)
        .json({ success: false, msg: "AdminId is required to delete a message" });
    }

    const deleted = await Message.findOneAndDelete({
      _id: messageId,
      adminId: adminId.toLowerCase(),
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        msg: "Message not found or not authorized",
      });
    }

    res.json({ success: true, msg: "Message deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting message:", err);
    res.status(500).json({ success: false, msg: "Error deleting message" });
  }
});

module.exports = router;
