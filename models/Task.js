const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    // 🔹 Kis admin ne banaya
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // 🔹 Kis employee(s) ko assign hua
    assignedTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // 🔹 Task title
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
    },

    // 🔹 Task description
    description: {
      type: String,
      trim: true,
      default: "",
    },

    // 🔹 Priority
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },

    // 🔹 Task due date
    dueDate: {
      type: Date,
      default: null,
    },

    // 🔹 Current status
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Completed", "Approved", "Rejected"],
      default: "Pending", // ✅ Always default Pending
      required: true,     // ✅ ensure status is never missing
    },

    // 🔹 Request type (for employee requests)
    requestType: {
      type: String,
      enum: ["admin_created", "employee_request"],
      default: "admin_created",
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

// ✅ Indexes for faster queries
taskSchema.index({ adminId: 1 });
taskSchema.index({ assignedTo: 1 });

module.exports = mongoose.model("Task", taskSchema);
