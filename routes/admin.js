const express = require("express");
const protect = require("../middleware/authMiddleware");
const User = require("../models/User");
const upload = require("../middleware/upload"); // ✅ Multer middleware
const geocoder = require('node-geocoder');

// ✅ Import all admin controller methods
const {
  createEmployee,
  getEmployees,
  updateEmployee,
  deleteEmployee,
  getAllLeaves,
  updateLeaveStatus,
  searchEmployees,
  getEmployeeSalarySlip,
  punchInForEmployee,
  sendMessage,
  getAllMessages,
  updateMessageStatus,
  downloadAttendanceCSV,
  getSettings,
  updateSettings,
} = require("../controllers/adminController");

const router = express.Router();

// ==========================
// ✅ Protect all admin routes
// ==========================
router.use(protect(["admin"]));

// Initialize geocoder
const geocoderInstance = geocoder({
  provider: 'openstreetmap', // You can use 'google', 'mapquest', etc.
  // apiKey: 'YOUR_API_KEY', // if using google or mapquest
});

/**
 * ==========================
 * Admin Profile
 * ==========================
 */
router.get("/profile", async (req, res) => {
  try {
    const admin = await User.findById(req.user._id).select("-password -__v");

    if (!admin || admin.role !== "admin") {
      return res.status(404).json({
        success: false,
        msg: "Admin not found",
      });
    }

    return res.json({
      success: true,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        company: admin.company || "No Company",
        role: admin.role,
      },
    });
  } catch (err) {
    console.error("❌ Profile fetch error:", err.message);
    return res.status(500).json({
      success: false,
      msg: "Server error while fetching profile",
    });
  }
});

/**
 * ==========================
 * Employee Management
 * ==========================
 */
router.get("/employees", getEmployees);
router.post("/employees", upload.single("image"), createEmployee);
router.put("/employees/:id", upload.single("image"), updateEmployee);
router.delete("/employees/:id", deleteEmployee);

/**
 * ==========================
 * Leave Management
 * ==========================
 */
router.get("/leaves", getAllLeaves);
router.put("/leaves/:id", updateLeaveStatus);

/**
 * ==========================
 * Employee Search & Salary Slip
 * ==========================
 */
router.get("/employees/search", searchEmployees);           // 🔍 Search employees
router.get("/employee/salary-slip", getEmployeeSalarySlip); // 🧾 Salary slip for employee

/**
 * ==========================
 * Attendance Management
 * ==========================
 */
router.post("/punch-in/:employeeId", punchInForEmployee); // 👈 New endpoint for admin punch-in

/**
 * ==========================
 * Message Management
 * ==========================
 */
router.get("/messages", getAllMessages); // 👈 Get all messages
router.post("/messages", sendMessage); // 👈 Send message to employee
router.put("/messages/:messageId", updateMessageStatus); // 👈 Update message status

/**
 * ==========================
 * Attendance CSV Download
 * ==========================
 */
router.get("/attendance/csv", downloadAttendanceCSV); // 👈 Download attendance CSV

/**
 * ==========================
 * Attendance Overview
 * ==========================
 */
router.get("/attendances", async (req, res) => {
  try {
    const adminId = req.user._id;

    // Get all employees under this admin
    const employees = await User.find({
      adminId: adminId,
      role: "employee",
    }).select("_id name email");

    if (!employees || employees.length === 0) {
      return res.json({
        success: true,
        attendances: [],
        msg: "No employees found",
      });
    }

    // Get attendance records for these employees
    const Attendance = require("../models/Attendance");
    const attendances = await Attendance.find({
      userId: { $in: employees.map(emp => emp._id) },
    })
      .populate("userId", "name email")
      .sort({ punchIn: -1 })
      .lean();

    // Format the response with employee names and addresses
    const formattedAttendances = await Promise.all(
      attendances.map(async (att) => {
        let punchInAddress = null;
        let punchOutAddress = null;

        if (att.punchInLocation?.latitude && att.punchInLocation?.longitude) {
          try {
            const placemarks = await geocoderInstance.reverse({
              lat: att.punchInLocation.latitude,
              lon: att.punchInLocation.longitude
            });
            if (placemarks && placemarks.length > 0) {
              const place = placemarks[0];
              punchInAddress = `${place.city || place.state}, ${place.state || place.country}, ${place.country}`;
            }
          } catch (error) {
            console.log("Error getting punch-in address:", error);
          }
        }

        if (att.punchOutLocation?.latitude && att.punchOutLocation?.longitude) {
          try {
            const placemarks = await geocoderInstance.reverse({
              lat: att.punchOutLocation.latitude,
              lon: att.punchOutLocation.longitude
            });
            if (placemarks && placemarks.length > 0) {
              const place = placemarks[0];
              punchOutAddress = `${place.city || place.state}, ${place.state || place.country}, ${place.country}`;
            }
          } catch (error) {
            console.log("Error getting punch-out address:", error);
          }
        }

        return {
          id: att._id,
          employeeName: att.userId?.name || "Unknown",
          employeeEmail: att.userId?.email || "Unknown",
          punchIn: att.punchIn,
          punchOut: att.punchOut,
          punchInLocation: att.punchInLocation,
          punchOutLocation: att.punchOutLocation,
          punchInAddress: punchInAddress,
          punchOutAddress: punchOutAddress,
          createdAt: att.createdAt,
          updatedAt: att.updatedAt,
        };
      })
    );

    return res.json({
      success: true,
      attendances: formattedAttendances,
    });
  } catch (err) {
    console.error("❌ Get Attendances Error:", err);
    return res.status(500).json({
      success: false,
      msg: "Server error while fetching attendances",
      error: err.message,
    });
  }
});

module.exports = router;
