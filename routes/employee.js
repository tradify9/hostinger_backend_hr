const express = require("express");
const {
  punchIn,
  punchOut,
  autoPunchOut,
  requestLeave,
  requestTask,
  getLeaves,
  getAttendance,
  downloadAttendanceCSV,
  reverseGeocode,
  requestReimbursement,
  getReimbursements,
  submitReport,
  getReports,
  getTeamActive,
    // ✅ नया salary slip controller
} = require("../controllers/employeeController");
const protect = require("../middleware/authMiddleware");
const User = require("../models/User");
const upload = require("../middleware/upload");

const path = require("path");

const router = express.Router();

/**
 * ===========================
 * Verify Employee Access
 * ===========================
 */
router.get("/verify-access", protect(["employee"]), async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("role adminId");

    if (!user || user.role !== "employee") {
      return res.status(403).json({
        success: false,
        msg: "Unauthorized",
      });
    }

    return res.json({
      success: true,
      role: user.role,
      adminId: user.adminId || null,
    });
  } catch (err) {
    console.error("❌ Verify access error:", err.message);
    return res.status(500).json({
      success: false,
      msg: "Server error while verifying access",
      error: err.message,
    });
  }
});

/**
 * ===========================
 * Employee Profile
 * ===========================
 */
router.get("/me", protect(["employee"]), async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password -__v");

    if (!user) {
      return res.status(404).json({
        success: false,
        msg: "Employee not found",
      });
    }

    // Ensure phone and address are always strings
    user.phone = user.phone || "";
    user.address = user.address || "";

    console.log("🔍 Raw user.image from DB:", user.image);
    console.log("🔍 Raw user.phone from DB:", user.phone);
    console.log("🔍 Raw user.address from DB:", user.address);

    let imageUrl = null;
    if (user.image) {
      // If it's a full URL (Cloudinary), use it directly; else, assume local path
      if (user.image.startsWith('http')) {
        imageUrl = user.image;
      } else {
        imageUrl = `/uploads/${path.basename(user.image)}`;
      }
      console.log("✅ Final imageUrl returned:", imageUrl);
    }

    const payload = {
      success: true,
      role: user.role,
      adminId: user.adminId || null,
      user: {
        ...user.toObject(),
        image: imageUrl,
        phone: user.phone || "",
        address: user.address || "",
      },
    };

    console.log("📤 API Response /me:", payload);

    return res.json(payload);
  } catch (err) {
    console.error("❌ Employee profile fetch error:", err.message);
    return res.status(500).json({
      success: false,
      msg: "Server error while fetching profile",
      error: err.message,
    });
  }
});

/**
 * ===========================
 * Update Employee Profile
 * ===========================
 */
router.put("/me", protect(["employee"]), upload.single("image"), async (req, res) => {
  try {
    const { name, email, phone, address, accountNumber, bankName } = req.body;

    const updateData = { name, email, phone, address, accountNumber, bankName };

    // Handle image upload
    if (req.file) {
      updateData.image = req.file.path; // Cloudinary URL
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, select: "-password -__v" }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        msg: "Employee not found",
      });
    }

    let imageUrl = null;
    if (user.image) {
      imageUrl = user.image; // Cloudinary URL
    }

    const payload = {
      success: true,
      msg: "Profile updated successfully",
      user: {
        ...user.toObject(),
        image: imageUrl,
      },
    };

    return res.json(payload);
  } catch (err) {
    console.error("❌ Employee profile update error:", err.message);
    return res.status(500).json({
      success: false,
      msg: "Server error while updating profile",
      error: err.message,
    });
  }
});

/**
 * ===========================
 * Attendance Routes
 * ===========================
 */
router.post("/punch-in", protect(["employee"]), punchIn);
router.post("/punch-out", protect(["employee"]), punchOut);
router.post("/auto-punch-out", protect(["employee"]), autoPunchOut);
router.get("/attendance", protect(["employee", "admin"]), getAttendance);
router.get("/attendance/csv", protect(["employee"]), downloadAttendanceCSV);

/**
 * ===========================
 * Leave Routes
 * ===========================
 */
router.post("/leaves", protect(["employee"]), requestLeave);
router.get("/leaves", protect(["employee"]), getLeaves);

/**
 * ===========================
 * Task Routes
 * ===========================
 */
router.post("/tasks", protect(["employee"]), requestTask);

/**
 * ===========================
 * Message Routes
 * ===========================
 */
router.get("/messages", protect(["employee"]), async (req, res) => {
  try {
    const Message = require("../models/Message");
    const messages = await Message.find({ employeeId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, messages });
  } catch (err) {
    console.error("❌ Get Messages Error:", err.message);
    res.status(500).json({ success: false, msg: "Server error", error: err.message });
  }
});

/**
 * ===========================
 * Reimbursement Routes
 * ===========================
 */
router.post("/reimbursements", protect(["employee"]), requestReimbursement);
router.get("/reimbursements", protect(["employee"]), getReimbursements);

/**
 * ===========================
 * Report Routes
 * ===========================
 */
router.post("/reports", protect(["employee"]), submitReport);
router.get("/reports", protect(["employee"]), getReports);

/**
 * ===========================
 * Team Active Route
 * ===========================
 */
router.get("/team-active", protect(["employee"]), getTeamActive);

/**
 * ===========================
 * Reverse Geocode Route
 * ===========================
 */
router.post("/reverse-geocode", protect(["employee"]), reverseGeocode);



module.exports = router;
