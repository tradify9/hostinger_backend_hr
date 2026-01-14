const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    companyName: { type: String, default: "Fintradify HR" },
    email: { type: String, default: "hr@fintradify.com" },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    logo: { type: String, default: "" },
    theme: { type: String, enum: ["light", "dark"], default: "light" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Settings", settingsSchema);
