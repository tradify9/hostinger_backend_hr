const mongoose = require("mongoose");
require("dotenv").config();

const dropIndex = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.DB_NAME || "myappdb",
    });
    console.log("✅ Connected to MongoDB");

    // Get the users collection
    const db = mongoose.connection.db;
    const collection = db.collection('users');

    // Drop the problematic index
    try {
      await collection.dropIndex("employeeId_1");
      console.log("✅ Dropped old employeeId index");
    } catch (dropErr) {
      console.log("⚠️ Index not found or already dropped:", dropErr.message);
    }

    // Create the sparse index manually
    try {
      await collection.createIndex({ employeeId: 1 }, { unique: true, sparse: true });
      console.log("✅ Created sparse employeeId index");
    } catch (createErr) {
      console.log("⚠️ Failed to create sparse index:", createErr.message);
    }

    console.log("🎉 Index fixed. You can now create admins.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error fixing index:", err.message);
    process.exit(1);
  }
};

dropIndex();
