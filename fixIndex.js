const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config();

const fixIndex = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.DB_NAME || "myappdb",
    });
    console.log("✅ Connected to MongoDB");

    // Drop the problematic index
    try {
      await User.collection.dropIndex("employeeId_1");
      console.log("✅ Dropped old employeeId index");
    } catch (dropErr) {
      console.log("⚠️ Index not found or already dropped:", dropErr.message);
    }

    // The schema will recreate the index as sparse on next save
    console.log("🎉 Index fixed. You can now create admins.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error fixing index:", err.message);
    process.exit(1);
  }
};

fixIndex();
