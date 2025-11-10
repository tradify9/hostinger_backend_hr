const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true },
    employeeName: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    adminId: { type: String, required: true }, // Assigned Admin
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved", "Rejected"], // ✅ only allowed values
      default: "Pending",
    },
  },
  {
    timestamps: true, // ✅ adds createdAt & updatedAt automatically
  }
);

module.exports = mongoose.model("Message", messageSchema);
