const Attendance = require("../models/Attendance");
const Leave = require("../models/Leave");
const Task = require("../models/Task");
const User = require("../models/User");
const geocoder = require('node-geocoder');

const geocoderInstance = geocoder({
  provider: 'openstreetmap',
  timeout: 10000, // 10 second timeout
  headers: {
    'User-Agent': 'Fintradify-HR-Portal/1.0 (contact@fintradify.com)'
  }
});

/* ========================================================
   ✅ Punch In (Fixed for next-day issue and one punch per day)
======================================================== */
exports.punchIn = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, msg: "Unauthorized - user not found" });
    }

    const { latitude, longitude } = req.body || {};
    const now = new Date();

    // Check if user already punched in today
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const existingPunch = await Attendance.findOne({
      userId,
      punchIn: { $gte: startOfDay, $lt: endOfDay },
    });

    if (existingPunch) {
      return res.status(400).json({
        success: false,
        msg: "You have already punched in today.",
      });
    }

    // Create new Punch In record (location optional) - address will be geocoded later when fetching attendance
    const attendance = await Attendance.create({
      userId,
      punchIn: now,
      punchInLocation: {
        latitude: latitude ?? null,
        longitude: longitude ?? null,
      },
      punchInAddress: null, // Will be populated when fetching attendance
    });

    return res.status(201).json({
      success: true,
      msg: "✅ Punched in successfully",
      attendance,
    });
  } catch (err) {
    console.error("❌ Punch In Error:", err);
    return res.status(500).json({
      success: false,
      msg: "Server error while punching in",
      error: err.message,
    });
  }
};

/* ========================================================
   ✅ Punch Out (Manual only, one per day)
======================================================== */
exports.punchOut = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        msg: "Unauthorized - user not found",
      });
    }

    const { latitude, longitude } = req.body || {};
    const now = new Date();

    // Check if user already punched out today
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const existingPunchOut = await Attendance.findOne({
      userId,
      punchOut: { $gte: startOfDay, $lt: endOfDay },
    });

    if (existingPunchOut) {
      return res.status(400).json({
        success: false,
        msg: "You have already punched out today.",
      });
    }

    // Find the latest record where the user is still punched in
    const record = await Attendance.findOne({
      userId,
      punchOut: null,
    }).sort({ punchIn: -1 });

    if (!record) {
      return res.status(400).json({
        success: false,
        msg: "No active punch-in found to punch out.",
      });
    }

    // Set punch-out time and location - address will be geocoded later when fetching attendance
    record.punchOut = now;
    record.punchOutLocation = {
      latitude: latitude ?? null,
      longitude: longitude ?? null,
    };
    record.punchOutAddress = null; // Will be populated when fetching attendance

    await record.save();

    // 🔄 Fetch updated attendance instantly (latest first)
    const latestAttendance = await Attendance.find({ userId })
      .sort({ punchIn: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      msg: "✅ Punched out successfully",
      attendance: latestAttendance, // 👈 immediate updated list
    });
  } catch (err) {
    console.error("❌ Punch Out Error:", err);
    return res.status(500).json({
      success: false,
      msg: "Server error while punching out",
      error: err.message,
    });
  }
};


/* ========================================================
   📅 Get Attendance (Employee / Admin)
======================================================== */
exports.getAttendance = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        allowed: false,
        msg: "Unauthorized - user not found",
      });
    }

    let records = [];

    // 👨‍💼 Employee → self attendance with addresses
    if (req.user.role === "employee") {
      records = await Attendance.find({ userId })
        .sort({ punchIn: -1 })
        .lean();

      // Skip geocoding to avoid API rate limits and timeouts - just return coordinates
      records = records.map((record) => ({
        ...record,
        punchInAddress: record.punchInAddress || `${record.punchInLocation?.latitude || 'N/A'}, ${record.punchInLocation?.longitude || 'N/A'}`,
        punchOutAddress: record.punchOutAddress || `${record.punchOutLocation?.latitude || 'N/A'}, ${record.punchOutLocation?.longitude || 'N/A'}`,
      }));
    }

    // 🧑‍💼 Admin → all their employees with addresses
    else if (req.user.role === "admin") {
      const employees = await User.find({
        adminId: userId,
        role: "employee",
      }).select("_id");

      records = await Attendance.find({
        userId: { $in: employees.map((e) => e._id) },
      })
        .populate("userId", "name email")
        .sort({ punchIn: -1 })
        .lean();

      // Skip geocoding to avoid API rate limits and timeouts - just return coordinates
      records = records.map((record) => ({
        ...record,
        punchInAddress: record.punchInAddress || `${record.punchInLocation?.latitude || 'N/A'}, ${record.punchInLocation?.longitude || 'N/A'}`,
        punchOutAddress: record.punchOutAddress || `${record.punchOutLocation?.latitude || 'N/A'}, ${record.punchOutLocation?.longitude || 'N/A'}`,
      }));
    }

    // 🧑‍💻 SuperAdmin → all attendance
    else if (req.user.role === "superadmin") {
      records = await Attendance.find({})
        .populate("userId", "name email role company")
        .sort({ punchIn: -1 })
        .lean();
    } else {
      return res.status(403).json({
        success: false,
        allowed: false,
        msg: "Unauthorized role",
      });
    }

    return res.json({
      success: true,
      allowed: true,
      count: records.length,
      attendance: records,
    });
  } catch (err) {
    console.error("❌ Get Attendance Error:", err);
    return res.status(500).json({
      success: false,
      allowed: true,
      msg: "Server error while fetching attendance",
      error: err.message,
    });
  }
};

/* ========================================================
   📝 Request Leave (Employee)
======================================================== */
exports.requestLeave = async (req, res) => {
  try {
    const user = req.user;
    if (!user?._id || user.role !== "employee") {
      return res
        .status(401)
        .json({ success: false, allowed: false, msg: "Unauthorized - employee only" });
    }

    const { startDate, endDate, reason, leaveType } = req.body;

    if (!startDate || !endDate || !reason?.trim()) {
      return res.status(400).json({
        success: false,
        allowed: true,
        msg: "Start date, end date and reason are required",
      });
    }

    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({
        success: false,
        allowed: true,
        msg: "End date must be after start date",
      });
    }

    if (!user.adminId) {
      return res.status(400).json({
        success: false,
        allowed: true,
        msg: "Employee is not linked to any admin",
      });
    }

    // Prevent overlapping leaves
    const overlap = await Leave.findOne({
      userId: user._id,
      $or: [
        {
          startDate: { $lte: new Date(endDate) },
          endDate: { $gte: new Date(startDate) },
        },
      ],
    });

    if (overlap) {
      return res.status(400).json({
        success: false,
        allowed: true,
        msg: "A leave already exists for this date range.",
      });
    }

    const leave = await Leave.create({
      userId: user._id,
      adminId: user.adminId,
      leaveType: leaveType || "Casual",
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason: reason.trim(),
      status: "pending",
    });

    return res.status(201).json({
      success: true,
      allowed: true,
      msg: "✅ Leave request submitted successfully",
      leave,
    });
  } catch (err) {
    console.error("❌ Request Leave Error:", err);
    return res.status(500).json({
      success: false,
      allowed: true,
      msg: "Server error while requesting leave",
      error: err.message,
    });
  }
};

/* ========================================================
   📜 Get Leaves (Employee - self)
======================================================== */
exports.getLeaves = async (req, res) => {
  try {
    const user = req.user;
    if (!user?._id || user.role !== "employee") {
      return res.status(401).json({
        success: false,
        allowed: false,
        msg: "Unauthorized - employee only",
      });
    }

    const leaves = await Leave.find({ userId: user._id })
      .populate("userId", "username name email")
      .sort({ createdAt: -1 })
      .select("-__v")
      .lean();

    return res.json({
      success: true,
      allowed: true,
      count: leaves.length,
      leaves,
    });
  } catch (err) {
    console.error("❌ Get Leaves Error:", err);
    return res.status(500).json({
      success: false,
      allowed: true,
      msg: "Server error while fetching leaves",
      error: err.message,
    });
  }
};

/* ========================================================
   📝 Request Task (Employee)
======================================================== */
exports.requestTask = async (req, res) => {
  try {
    const user = req.user;
    if (!user?._id || user.role !== "employee") {
      return res.status(401).json({
        success: false,
        allowed: false,
        msg: "Unauthorized - employee only",
      });
    }

    const { title, description, dueDate } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({
        success: false,
        allowed: true,
        msg: "Title is required",
      });
    }

    if (!user.adminId) {
      return res.status(400).json({
        success: false,
        allowed: true,
        msg: "Employee is not linked to any admin",
      });
    }

    const task = await Task.create({
      adminId: user.adminId,
      assignedTo: [user._id], // Assign to self initially
      title: title.trim(),
      description: description?.trim() || "",
      dueDate: dueDate ? new Date(dueDate) : null,
      status: "Pending",
      priority: "Medium", // Default priority
      requestType: "employee_request", // Mark as employee request
    });

    return res.status(201).json({
      success: true,
      allowed: true,
      msg: "✅ Task request submitted successfully",
      task,
    });
  } catch (err) {
    console.error("❌ Request Task Error:", err);
    return res.status(500).json({
      success: false,
      allowed: true,
      msg: "Server error while requesting task",
      error: err.message,
    });
  }
};

/* ========================================================
   📋 Get Leaves (Admin / SuperAdmin)
======================================================== */
exports.getAdminLeaves = async (req, res) => {
  try {
    const user = req.user;

    if (!user?._id || !["admin", "superadmin"].includes(user.role)) {
      return res.status(401).json({
        success: false,
        allowed: false,
        msg: "Unauthorized - admin or superadmin only",
      });
    }

    let filter = {};

    // Admin → their employees’ leaves
    if (user.role === "admin") {
      filter.adminId = user._id;
    }

    // SuperAdmin → all leaves (no filter)
    const leaves = await Leave.find(filter)
      .populate("userId", "name username email role")
      .populate("adminId", "username email company")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      allowed: true,
      count: leaves?.length || 0,
      leaves: leaves || [],
    });
  } catch (err) {
    console.error("❌ Get Admin Leaves Error:", err);
    return res.status(500).json({
      success: false,
      allowed: true,
      msg: "Server error while fetching leaves",
      error: err.message,
    });
  }
};
