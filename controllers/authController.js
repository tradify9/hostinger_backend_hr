const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");

// ------------------ Generate Tokens ------------------
const generateTokens = (user) => {
  const role = user.role.toLowerCase();

  console.log("🔑 Generating tokens for:", user.username, "| Role:", role);

  const accessToken = jwt.sign(
    {
      id: user._id,
      role,
      adminId: role === "employee" ? user.adminId?._id : null,
    },
    process.env.JWT_SECRET || "insecure_default_secret",
    { expiresIn: "7d" }
  );

  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET || "insecure_refresh_secret",
    { expiresIn: "30d" }
  );

  return { accessToken, refreshToken };
};

// ------------------ LOGIN ------------------
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log("➡️ Login attempt:", { username, password });

    if (!username || !password) {
      console.log("❌ Missing username or password in request");
      return res
        .status(400)
        .json({ success: false, msg: "Username/Email and password are required" });
    }

    // Find user by username
    console.log("🔎 Searching user by username:", username.toLowerCase().trim());
    let user = await User.findOne({ username: username.toLowerCase().trim() })
      .select("+password")
      .populate("adminId", "name email username role");
    console.log("📦 Query result (username):", user);

    if (!user) {
      console.log("⚠️ Not found by username. Trying email:", username.toLowerCase().trim());
      user = await User.findOne({ email: username.toLowerCase().trim() })
        .select("+password")
        .populate("adminId", "name email username role");
      console.log("📦 Query result (email):", user);
    }

    if (!user) {
      console.log("❌ User not found in DB for:", username);
      return res
        .status(401)
        .json({ success: false, msg: "Invalid username/email or password" });
    }

    console.log("✅ User fetched:", {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      hasPassword: !!user.password,
    });

    // Compare password
    const isMatch = await user.comparePassword(password);
    console.log("🔍 Password compare:", { entered: password, match: isMatch });

    if (!isMatch) {
      console.log("❌ Password mismatch for:", username);
      return res
        .status(401)
        .json({ success: false, msg: "Invalid username/email or password" });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);
    console.log("✅ Login successful for:", username);

    return res.status(200).json({
      success: true,
      msg: "Login successful",
      token: accessToken,
      refreshToken,
      role: user.role.toLowerCase(),
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role.toLowerCase(),
        admin: user.role.toLowerCase() === "employee" ? user.adminId || null : null,
      },
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    return res
      .status(500)
      .json({ success: false, msg: "Server error during login", error: err.message });
  }
};

// ------------------ REFRESH TOKEN ------------------
exports.refreshToken = async (req, res) => {
  try {
    const { token } = req.body;
    console.log("➡️ Refresh token request:", token);

    if (!token) return res.status(401).json({ success: false, msg: "Refresh token required" });

    jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET || "insecure_refresh_secret",
      async (err, decoded) => {
        if (err) {
          console.log("❌ Invalid refresh token:", err.message);
          return res.status(403).json({ success: false, msg: "Invalid refresh token" });
        }

        console.log("✅ Refresh token decoded:", decoded);

        const user = await User.findById(decoded.id).populate(
          "adminId",
          "name email username role"
        );
        console.log("📦 Refresh token DB fetch:", user);

        if (!user) {
          console.log("❌ No user found for refresh token ID:", decoded.id);
          return res.status(404).json({ success: false, msg: "User not found" });
        }

        const { accessToken, refreshToken } = generateTokens(user);
        console.log("✅ Issued new tokens for:", user.username);

        return res.json({ success: true, accessToken, refreshToken });
      }
    );
  } catch (err) {
    console.error("❌ Refresh token error:", err);
    return res
      .status(500)
      .json({ success: false, msg: "Server error during refresh token", error: err.message });
  }
};

// ------------------ REQUEST RESET ------------------
exports.requestReset = async (req, res) => {
  try {
    const { username } = req.body;
    console.log("➡️ Password reset request for:", username);

    if (!username) {
      return res.status(400).json({ success: false, msg: "Username/Email is required" });
    }

    console.log("🔎 Searching for user (reset) by username:", username.toLowerCase().trim());
    let user = await User.findOne({ username: username.toLowerCase().trim() });
    console.log("📦 Query result (username):", user);

    if (!user) {
      console.log("⚠️ Not found by username, checking email...");
      user = await User.findOne({ email: username.toLowerCase().trim() });
      console.log("📦 Query result (email):", user);
    }

    if (!user) {
      console.log("⚠️ No user found. Returning success to prevent enumeration.");
      return res.json({
        success: true,
        msg: "If account exists, OTP sent to registered email",
      });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);

    user.resetOtp = otpHash;
    user.resetOtpExpire = Date.now() + 10 * 60 * 1000;
    await user.save();

    console.log("✅ OTP generated:", otp, "for user:", user.username);

    // Always log OTP for testing
    console.log("📧 OTP for", user.email, ":", otp);

    // Try to send email if credentials are configured
    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        });

        await transporter.sendMail({
          from: `"HR Portal" <${process.env.EMAIL_USER}>`,
          to: user.email,
          subject: "Password Reset OTP",
          text: `Your OTP is ${otp}. It will expire in 10 minutes.`,
        });

        console.log("📧 OTP sent to:", user.email);
      } else {
        console.log("⚠️ Email credentials not configured - OTP logged above for testing");
      }
    } catch (emailError) {
      console.log("⚠️ Email sending failed, but OTP is logged above:", emailError.message);
    }

    return res.json({
      success: true,
      msg: "If account exists, OTP sent to registered email",
    });
  } catch (err) {
    console.error("❌ Request Reset error:", err);
    return res
      .status(500)
      .json({ success: false, msg: "Server error during OTP request", error: err.message });
  }
};

// ------------------ CONFIRM RESET ------------------
exports.confirmReset = async (req, res) => {
  try {
    const { username, otp, newPassword } = req.body;
    console.log("➡️ Confirm reset attempt:", { username, otp, newPassword });

    if (!username || !otp || !newPassword) {
      console.log("❌ Missing reset fields");
      return res
        .status(400)
        .json({ success: false, msg: "Username/Email, OTP, and new password are required" });
    }

    console.log("🔎 Searching user (confirm reset) by username:", username.toLowerCase().trim());
    let user = await User.findOne({ username: username.toLowerCase().trim() }).select(
      "+resetOtp +resetOtpExpire +password"
    );
    console.log("📦 Query result (username):", user);

    if (!user) {
      console.log("⚠️ Not found by username, checking email...");
      user = await User.findOne({ email: username.toLowerCase().trim() }).select(
        "+resetOtp +resetOtpExpire +password"
      );
      console.log("📦 Query result (email):", user);
    }

    if (!user || !user.resetOtp) {
      console.log("❌ Invalid/expired OTP - user not found or no OTP stored");
      return res.status(400).json({ success: false, msg: "Invalid or expired OTP" });
    }

    if (Date.now() > user.resetOtpExpire) {
      console.log("❌ OTP expired for:", user.username);
      return res.status(400).json({ success: false, msg: "OTP expired" });
    }

    const isMatch = await bcrypt.compare(otp, user.resetOtp);
    console.log("🔍 OTP compare:", { entered: otp, match: isMatch });

    if (!isMatch) {
      console.log("❌ OTP mismatch for:", user.username);
      return res.status(400).json({ success: false, msg: "Invalid OTP" });
    }

    // Update password
    user.password = newPassword;
    user.resetOtp = undefined;
    user.resetOtpExpire = undefined;
    await user.save();

    console.log("✅ Password reset successful for:", user.username);

    return res.json({ success: true, msg: "Password reset successful" });
  } catch (err) {
    console.error("❌ Confirm Reset error:", err);
    return res.status(500).json({
      success: false,
      msg: "Server error during password reset",
      error: err.message,
    });
  }
};
