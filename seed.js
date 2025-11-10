const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config();

const seedSuperAdmin = async () => {
  try {
    // ✅ Connect to MongoDB Atlas
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.DB_NAME,
    });
    console.log("✅ Connected to MongoDB Atlas:", process.env.DB_NAME);

    // ✅ Drop problematic employeeId index if it exists
    try {
      await User.collection.dropIndex("employeeId_1");
      console.log("✅ Dropped old employeeId index");
    } catch (dropErr) {
      if (dropErr.codeName === "IndexNotFound") {
        console.log("⚠️ employeeId_1 index not found, skipping...");
      } else {
        console.log("⚠️ Could not drop index:", dropErr.message);
      }
    }

    // ✅ Check if Super Admin already exists
    const existing = await User.findOne({ role: "superadmin" });
    if (existing) {
      console.log("⚠️ Super Admin already exists:", existing.username);
      await mongoose.disconnect();
      return;
    }

    // ✅ Create new Super Admin
    const superAdmin = new User({
      username: "superadmin",
      email: "superadmin@example.com",
      name: "System Super Admin",
      password: "superadmin123",
      role: "superadmin",
      employeeId: "ADM001",
    });

    await superAdmin.save();
    console.log("🎉 Super Admin created successfully:", superAdmin.username);

    // ✅ Disconnect cleanly
    await mongoose.disconnect();
    console.log("✅ MongoDB connection closed");
  } catch (err) {
    console.error("❌ Error seeding Super Admin:", err.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedSuperAdmin();
