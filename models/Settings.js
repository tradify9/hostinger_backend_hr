const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    companyName: { type: String, trim: true, default: "" },
    companyAddress: { type: String, trim: true, default: "" },
    companyPhone: { type: String, trim: true, default: "" },
    companyEmail: { type: String, trim: true, default: "" },
    companyLogo: { type: String, default: null }, // URL to logo image
    slipFormat: {
      includeDeductions: { type: Boolean, default: false },
      includeAllowances: { type: Boolean, default: false },
      customFields: [{ type: String }], // Array of custom field names
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Settings", settingsSchema);
