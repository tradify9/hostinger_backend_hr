const Message = require("../models/Message");

// ✅ Employee - Send Message
exports.sendMessage = async (req, res) => {
  try {
    let { employeeName, message } = req.body;

    if (!employeeName || !message) {
      return res.status(400).json({
        success: false,
        msg: "Both employeeName and message are required",
      });
    }

    // normalize
    employeeName = employeeName.trim().toLowerCase();
    const adminId = "admin123"; // force default lowercase

    const newMsg = new Message({ employeeName, message, adminId });
    await newMsg.save();

    console.log("✅ Saved message in DB:", newMsg);

    res.json({
      success: true,
      msg: "Message sent successfully!",
      data: newMsg,
    });
  } catch (err) {
    console.error("❌ Error in sendMessage:", err);
    res.status(500).json({ success: false, msg: "Error saving message" });
  }
};

// ✅ Employee - Get All Messages
exports.getAllMessages = async (req, res) => {
  try {
    const msgs = await Message.find().sort({ createdAt: -1 });

    console.log("📤 All messages fetched:", msgs.length);

    res.json({
      success: true,
      msg: "All messages fetched",
      data: msgs,
    });
  } catch (err) {
    console.error("❌ Error in getAllMessages:", err);
    res
      .status(500)
      .json({ success: false, msg: "Error fetching messages", data: [] });
  }
};

// ✅ Admin - Get Messages
exports.getMessagesByAdmin = async (req, res) => {
  try {
    const adminId = req.params.adminId.trim().toLowerCase();
    console.log("📩 Fetching messages for adminId:", adminId);

    const msgs = await Message.find({ adminId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      msg: msgs.length
        ? "Messages fetched successfully"
        : `No messages found for admin ${adminId}`,
      data: msgs,
    });
  } catch (err) {
    console.error("❌ Error in getMessagesByAdmin:", err);
    res.status(500).json({
      success: false,
      msg: "Error fetching messages",
      data: [],
    });
  }
};

// ✅ Admin - Update Status
exports.updateMessageStatus = async (req, res) => {
  try {
    const { status, adminId } = req.body;
    const { messageId } = req.params;

    console.log("📥 Update request body:", req.body);
    console.log("📥 Update request params:", req.params);

    if (!status || !adminId) {
      return res.status(400).json({
        success: false,
        msg: "Both status & adminId are required",
      });
    }

    const updated = await Message.findOneAndUpdate(
      { _id: messageId, adminId: adminId.trim().toLowerCase() },
      { status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        msg: "Message not found or not authorized",
        data: null,
      });
    }

    res.json({
      success: true,
      msg: "Status updated successfully",
      data: updated,
    });
  } catch (err) {
    console.error("❌ Error in updateMessageStatus:", err);
    res
      .status(500)
      .json({ success: false, msg: "Error updating status", data: null });
  }
};

// ✅ Admin - Delete Message
exports.deleteMessage = async (req, res) => {
  try {
    const { adminId } = req.body;
    const { messageId } = req.params;

    console.log("🗑 Delete request:", { adminId, messageId });

    if (!adminId) {
      return res.status(400).json({
        success: false,
        msg: "adminId is required to delete message",
      });
    }

    const deleted = await Message.findOneAndDelete({
      _id: messageId,
      adminId: adminId.trim().toLowerCase(),
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        msg: "Message not found or not authorized",
      });
    }

    res.json({
      success: true,
      msg: "Message deleted successfully",
      data: deleted,
    });
  } catch (err) {
    console.error("❌ Error in deleteMessage:", err);
    res.status(500).json({ success: false, msg: "Error deleting message" });
  }
};
