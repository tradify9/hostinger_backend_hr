const User = require("../models/User");
const Task = require("../models/Task");
const Leave = require("../models/Leave");
const Message = require("../models/Message");
const Settings = require("../models/Settings");
const bcrypt = require("bcryptjs");
const sendEmail = require("../utils/sendEmail");

/* ======================================================
   🧩 CREATE ADMIN (SAFE VERSION)
====================================================== */
exports.createAdmin = async (req, res) => {
  try {
    const { username, email, password, company } = req.body;

    // ✅ Step 1: Validate essential fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        msg: "Email and password are required.",
      });
    }

    // ✅ Step 2: Normalize & check duplicates
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({
        success: false,
        msg: "An account with this email already exists.",
      });
    }

    // ✅ Step 3: Clean irrelevant employee fields (avoids Mongoose validation errors)
    const cleanData = {
      username: username?.trim() || "Admin",
      email: normalizedEmail,
      company: company?.trim() || "N/A",
      password: password.trim(),
      role: "admin",
      isActive: true,
    };

    // ✅ Step 4: Save admin safely
    const admin = new User(cleanData);
    await admin.save();

    // ✅ Step 5: Try sending email asynchronously (non-blocking)
    (async () => {
      try {
        const html = `
          <h2>Welcome, ${username || "Admin"}!</h2>
          <p>Your Admin account has been created successfully.</p>
          <ul>
            <li><b>Email:</b> ${normalizedEmail}</li>
            <li><b>Company:</b> ${company || "N/A"}</li>
            <li><b>Password:</b> ${password}</li>
          </ul>
          <p>Please log in and change your password after your first login.</p>
        `;
        await sendEmail(normalizedEmail, "Your Admin Account Details", html);
        console.log(`📧 Admin email sent to ${normalizedEmail}`);
      } catch (emailErr) {
        console.warn("⚠️ Failed to send welcome email:", emailErr.message);
      }
    })();

    // ✅ Step 6: Return clean response
    const adminData = admin.toObject();
    delete adminData.password;
    delete adminData.__v;

    return res.status(201).json({
      success: true,
      msg: "Admin created successfully.",
      admin: adminData,
    });
  } catch (err) {
    console.error("❌ Create Admin Error:", err.name, err.message);
    // Return validation-friendly message
    if (err.name === "ValidationError") {
      const firstKey = Object.keys(err.errors)[0];
      return res.status(400).json({
        success: false,
        msg: `Invalid or missing field: ${firstKey}`,
        error: err.message,
      });
    }
    return res.status(500).json({
      success: false,
      msg: "Server error while creating admin.",
      error: err.message,
    });
  }
};

/* ======================================================
   ✏️ UPDATE ADMIN
====================================================== */
exports.updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    let updates = { ...req.body };

    // ✅ Validate ID
    if (!id || id.length < 10) {
      return res.status(400).json({
        success: false,
        msg: "Invalid Admin ID format.",
      });
    }

    // ✅ Clean irrelevant employee-only fields (avoid validation issues)
    const employeeFields = [
      "salary",
      "department",
      "position",
      "joinDate",
      "employeeId",
      "name",
    ];
    employeeFields.forEach((field) => delete updates[field]);

    // ✅ If updating password, hash it
    if (updates.password) {
      if (updates.password.trim().length < 6) {
        return res.status(400).json({
          success: false,
          msg: "Password must be at least 6 characters.",
        });
      }
      updates.password = await bcrypt.hash(updates.password.trim(), 10);
    }

    // ✅ Remove empty values (to avoid overwriting with undefined/null)
    Object.keys(updates).forEach(
      (key) =>
        (updates[key] === undefined || updates[key] === "" || updates[key] === null) &&
        delete updates[key]
    );

    // ✅ Update only admin users
    const admin = await User.findOneAndUpdate(
      { _id: id, role: "admin" },
      updates,
      { new: true, runValidators: true }
    ).select("-password -__v");

    if (!admin) {
      return res.status(404).json({
        success: false,
        msg: "Admin not found.",
      });
    }

    // ✅ Success response
    return res.status(200).json({
      success: true,
      msg: "Admin updated successfully.",
      admin,
    });
  } catch (err) {
    console.error("❌ Update Admin Error:", err);

    // ✅ Specific error handling
    if (err.name === "CastError") {
      return res.status(400).json({
        success: false,
        msg: "Invalid Admin ID format.",
      });
    }
    if (err.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        msg: "Validation failed while updating admin.",
        error: err.message,
      });
    }

    // ✅ Generic fallback
    return res.status(500).json({
      success: false,
      msg: "Server error while updating admin.",
      error: err.message,
    });
  }
};


/* ======================================================
   🗑️ DELETE ADMIN
====================================================== */
exports.deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const admin = await User.findOne({ _id: id, role: "admin" });
    if (!admin) {
      return res.status(404).json({ success: false, msg: "Admin not found." });
    }

    if (req.user && req.user._id.toString() === id) {
      return res.status(403).json({
        success: false,
        msg: "You cannot delete your own account.",
      });
    }

    await admin.deleteOne();

    return res.json({ success: true, msg: "Admin deleted successfully." });
  } catch (err) {
    console.error("❌ Delete Admin Error:", err);
    if (err.name === "CastError") {
      return res.status(400).json({ success: false, msg: "Invalid Admin ID." });
    }
    return res.status(500).json({
      success: false,
      msg: "Server error while deleting admin.",
      error: err.message,
    });
  }
};

/* ======================================================
   📋 GET ADMINS
====================================================== */
exports.getAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: "admin" }).select("-password");
    return res.status(200).json({
      success: true,
      count: admins.length,
      admins,
    });
  } catch (err) {
    console.error("❌ Get Admins Error:", err);
    return res.status(500).json({
      success: false,
      msg: "Server error while fetching admins.",
      error: err.message,
    });
  }
};

/* ======================================================
   ⚙️ TOGGLE ADMIN STATUS
====================================================== */
exports.toggleAdminStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        msg: "Invalid or missing 'isActive' value (must be true or false).",
      });
    }

    if (req.user && req.user._id.toString() === id) {
      return res.status(403).json({
        success: false,
        msg: "You cannot disable your own account.",
      });
    }

    const admin = await User.findOne({ _id: id, role: "admin" });
    if (!admin) {
      return res.status(404).json({ success: false, msg: "Admin not found." });
    }

    admin.isActive = isActive;
    await admin.save();

    const statusText = isActive ? "enabled" : "disabled";

    (async () => {
      try {
        const subject = `Your Admin Account has been ${statusText}`;
        const message = `
          <h3>Hello ${admin.username || "Admin"},</h3>
          <p>Your admin account for <b>${admin.company || "the system"}</b> has been <b>${statusText}</b> by the Super Admin.</p>
          ${
            isActive
              ? "<p>You can now log in again.</p>"
              : "<p>You will not be able to log in until your account is reactivated.</p>"
          }
          <hr><small>This is an automated message. Please do not reply.</small>
        `;
        await sendEmail(admin.email, subject, message);
        console.log(`📩 Status email sent to ${admin.email}`);
      } catch (emailErr) {
        console.warn("⚠️ Failed to send status email:", emailErr.message);
      }
    })();

    return res.status(200).json({
      success: true,
      msg: `Admin ${statusText} successfully.`,
      admin: {
        _id: admin._id,
        username: admin.username,
        email: admin.email,
        company: admin.company,
        isActive: admin.isActive,
        role: admin.role,
      },
    });
  } catch (err) {
    console.error("❌ Toggle Admin Status Error:", err);
    if (err.name === "CastError") {
      return res.status(400).json({ success: false, msg: "Invalid Admin ID." });
    }
    return res.status(500).json({
      success: false,
      msg: "Server error while toggling admin status.",
      error: err.message,
    });
  }
};

/* ======================================================
   👨‍💼 GET EMPLOYEES
====================================================== */
exports.getEmployees = async (req, res) => {
  try {
    const employees = await User.find({ role: "employee" }).select(
      "-password -resetOtp -resetOtpExpire"
    );
    return res.status(200).json({
      success: true,
      count: employees.length,
      employees,
    });
  } catch (err) {
    console.error("❌ Get Employees Error:", err);
    return res.status(500).json({
      success: false,
      msg: "Server error while fetching employees.",
      error: err.message,
    });
  }
};

/* ======================================================
   ⚙️ TOGGLE EMPLOYEE STATUS
====================================================== */
exports.toggleEmployeeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        msg: "Invalid or missing 'isActive' value (must be true or false).",
      });
    }

    const employee = await User.findOne({ _id: id, role: "employee" });
    if (!employee) {
      return res.status(404).json({ success: false, msg: "Employee not found." });
    }

    employee.isActive = isActive;
    await employee.save();

    const statusText = isActive ? "enabled" : "disabled";

    return res.status(200).json({
      success: true,
      msg: `Employee ${statusText} successfully.`,
      employee: {
        _id: employee._id,
        username: employee.username,
        email: employee.email,
        isActive: employee.isActive,
        role: employee.role,
      },
    });
  } catch (err) {
    console.error("❌ Toggle Employee Status Error:", err);
    if (err.name === "CastError") {
      return res.status(400).json({ success: false, msg: "Invalid Employee ID." });
    }
    return res.status(500).json({
      success: false,
      msg: "Server error while toggling employee status.",
      error: err.message,
    });
  }
};

/* ======================================================
   🗑️ DELETE EMPLOYEE
====================================================== */
exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await User.findOne({ _id: id, role: "employee" });
    if (!employee) {
      return res.status(404).json({ success: false, msg: "Employee not found." });
    }

    await employee.deleteOne();

    return res.json({ success: true, msg: "Employee deleted successfully." });
  } catch (err) {
    console.error("❌ Delete Employee Error:", err);
    if (err.name === "CastError") {
      return res.status(400).json({ success: false, msg: "Invalid Employee ID." });
    }
    return res.status(500).json({
      success: false,
      msg: "Server error while deleting employee.",
      error: err.message,
    });
  }
};

/* ======================================================
   📋 GET TASKS
====================================================== */
exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.find().populate('assignedTo', 'username email').populate('assignedBy', 'username email');
    return res.status(200).json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (err) {
    console.error("❌ Get Tasks Error:", err);
    return res.status(500).json({
      success: false,
      msg: "Server error while fetching tasks.",
      error: err.message,
    });
  }
};

/* ======================================================
   🗑️ DELETE TASK
====================================================== */
exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ success: false, msg: "Task not found." });
    }

    await task.deleteOne();

    return res.json({ success: true, msg: "Task deleted successfully." });
  } catch (err) {
    console.error("❌ Delete Task Error:", err);
    if (err.name === "CastError") {
      return res.status(400).json({ success: false, msg: "Invalid Task ID." });
    }
    return res.status(500).json({
      success: false,
      msg: "Server error while deleting task.",
      error: err.message,
    });
  }
};

/* ======================================================
   📋 GET LEAVES
====================================================== */
exports.getLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find().populate('employeeId', 'username email');
    return res.status(200).json({
      success: true,
      count: leaves.length,
      leaves,
    });
  } catch (err) {
    console.error("❌ Get Leaves Error:", err);
    return res.status(500).json({
      success: false,
      msg: "Server error while fetching leaves.",
      error: err.message,
    });
  }
};

/* ======================================================
   ✅ APPROVE LEAVE
====================================================== */
exports.approveLeave = async (req, res) => {
  try {
    const { id } = req.params;

    const leave = await Leave.findById(id);
    if (!leave) {
      return res.status(404).json({ success: false, msg: "Leave request not found." });
    }

    leave.status = "approved";
    await leave.save();

    return res.json({ success: true, msg: "Leave approved successfully.", leave });
  } catch (err) {
    console.error("❌ Approve Leave Error:", err);
    if (err.name === "CastError") {
      return res.status(400).json({ success: false, msg: "Invalid Leave ID." });
    }
    return res.status(500).json({
      success: false,
      msg: "Server error while approving leave.",
      error: err.message,
    });
  }
};

/* ======================================================
   ❌ REJECT LEAVE
====================================================== */
exports.rejectLeave = async (req, res) => {
  try {
    const { id } = req.params;

    const leave = await Leave.findById(id);
    if (!leave) {
      return res.status(404).json({ success: false, msg: "Leave request not found." });
    }

    leave.status = "rejected";
    await leave.save();

    return res.json({ success: true, msg: "Leave rejected successfully.", leave });
  } catch (err) {
    console.error("❌ Reject Leave Error:", err);
    if (err.name === "CastError") {
      return res.status(400).json({ success: false, msg: "Invalid Leave ID." });
    }
    return res.status(500).json({
      success: false,
      msg: "Server error while rejecting leave.",
      error: err.message,
    });
  }
};

/* ======================================================
   📋 GET MESSAGES
====================================================== */
exports.getMessages = async (req, res) => {
  try {
    const messages = await Message.find().populate('senderId', 'username email').populate('receiverId', 'username email');
    return res.status(200).json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (err) {
    console.error("❌ Get Messages Error:", err);
    return res.status(500).json({
      success: false,
      msg: "Server error while fetching messages.",
      error: err.message,
    });
  }
};

/* ======================================================
   🗑️ DELETE MESSAGE
====================================================== */
exports.deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ success: false, msg: "Message not found." });
    }

    await message.deleteOne();

    return res.json({ success: true, msg: "Message deleted successfully." });
  } catch (err) {
    console.error("❌ Delete Message Error:", err);
    if (err.name === "CastError") {
      return res.status(400).json({ success: false, msg: "Invalid Message ID." });
    }
    return res.status(500).json({
      success: false,
      msg: "Server error while deleting message.",
      error: err.message,
    });
  }
};

/* ======================================================
   📊 GET REPORTS
====================================================== */
exports.getReports = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalAdmins = await User.countDocuments({ role: "admin" });
    const totalEmployees = await User.countDocuments({ role: "employee" });
    const totalTasks = await Task.countDocuments();
    const totalLeaves = await Leave.countDocuments();
    const totalMessages = await Message.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const completedTasks = await Task.countDocuments({ status: "completed" });
    const pendingLeaves = await Leave.countDocuments({ status: "pending" });

    return res.status(200).json({
      success: true,
      reports: {
        totalUsers,
        totalAdmins,
        totalEmployees,
        totalTasks,
        totalLeaves,
        totalMessages,
        activeUsers,
        completedTasks,
        pendingLeaves,
      }
    });
  } catch (err) {
    console.error("❌ Get Reports Error:", err);
    return res.status(500).json({
      success: false,
      msg: "Server error while fetching reports.",
      error: err.message,
    });
  }
};

/* ======================================================
   📥 DOWNLOAD REPORT
====================================================== */
exports.downloadReport = async (req, res) => {
  try {
    // This would generate a PDF report - for now just return JSON
    const reports = await exports.getReports(req, res);
    // Note: getReports already sends response, so we don't send again
  } catch (err) {
    console.error("❌ Download Report Error:", err);
    return res.status(500).json({
      success: false,
      msg: "Server error while downloading report.",
      error: err.message,
    });
  }
};

/* ======================================================
   ⚙️ GET SETTINGS
====================================================== */
exports.getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
      await settings.save();
    }
    return res.status(200).json({
      success: true,
      settings,
    });
  } catch (err) {
    console.error("❌ Get Settings Error:", err);
    return res.status(500).json({
      success: false,
      msg: "Server error while fetching settings.",
      error: err.message,
    });
  }
};

/* ======================================================
   ✏️ UPDATE SETTINGS
====================================================== */
exports.updateSettings = async (req, res) => {
  try {
    const updates = req.body;
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings(updates);
    } else {
      Object.assign(settings, updates);
    }
    await settings.save();
    return res.status(200).json({
      success: true,
      msg: "Settings updated successfully.",
      settings,
    });
  } catch (err) {
    console.error("❌ Update Settings Error:", err);
    return res.status(500).json({
      success: false,
      msg: "Server error while updating settings.",
      error: err.message,
    });
  }
};
