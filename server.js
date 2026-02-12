require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const morgan = require("morgan");
const cloudinary = require("cloudinary").v2;

// ✅ Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();

// ✅ Import Routes
const authRoutes = require("./routes/auth");
const superAdminRoutes = require("./routes/superAdmin");
const adminRoutes = require("./routes/admin");
const employeeRoutes = require("./routes/employee");
const taskRoutes = require("./routes/taskRoutes");
const messageRoutes = require("./routes/messageRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const reimbursementRoutes = require("./routes/reimbursement");
const reportRoutes = require("./routes/report");
const teamActiveRoutes = require("./routes/teamactive");

// ✅ Middlewares
app.use(cors({
  origin: true, // Allow all origins
  credentials: true
}));
app.use(express.json());
app.use(morgan("dev"));

// ✅ Serve static uploads folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Connect MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    dbName: process.env.DB_NAME || "myappdb",
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1); // stop server if DB fails
  });

// ✅ API Routes
app.use("/api/auth", authRoutes);
app.use("/api/superadmin", superAdminRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/employee", employeeRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);

// ✅ Root route
app.get("/", (req, res) => {
  res.send("🚀 Server is running successfully...");
});

// ✅ Handle 404 (Not Found)
app.use((req, res) => {
  res.status(404).json({ success: false, msg: "Route not found" });
});

// ✅ Global Error Handler (for unexpected errors)
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.stack);
  res
    .status(err.status || 500)
    .json({ success: false, msg: err.message || "Internal Server Error" });
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));