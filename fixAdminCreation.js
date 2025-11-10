const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config();

const fixAdminCreation = async () => {
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

    // Create the sparse index manually
    try {
      await User.collection.createIndex({ employeeId: 1 }, { unique: true, sparse: true });
      console.log("✅ Created sparse employeeId index");
    } catch (createErr) {
      console.log("⚠️ Failed to create sparse index:", createErr.message);
    }

    // Test creating an admin
    const testAdmin = new User({
      username: "testadmin",
      email: "testadmin@example.com",
      password: "test123",
      role: "admin",
      isActive: true,
    });

    await testAdmin.save();
    console.log("🎉 Test admin created successfully:", testAdmin.username);

    // Clean up test admin
    await User.findOneAndDelete({ email: "testadmin@example.com" });
    console.log("🗑️ Test admin deleted");

    console.log("🎉 Admin creation is now fixed. You can create admins from the frontend.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error fixing admin creation:", err.message);
    process.exit(1);
  }
};

fixAdminCreation();
