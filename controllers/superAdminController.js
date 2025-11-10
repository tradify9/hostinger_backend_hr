const User = require("../models/User");
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
