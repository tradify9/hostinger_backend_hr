const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Punch In Data
    punchIn: { type: Date, required: true },
    punchInLocation: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    punchInAddress: { type: String },
    // Punch Out Data
    punchOut: { type: Date, default: null },
    punchOutLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
    punchOutAddress: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Attendance", attendanceSchema);
