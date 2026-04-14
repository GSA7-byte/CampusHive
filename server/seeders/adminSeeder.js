require("dotenv").config();
require("dns").setServers(["8.8.8.8", "8.8.4.4"]);
const mongoose = require("mongoose");
const User = require("../models/User");

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    console.log("Connected to MongoDB");

    const adminData = {
      firstName: "Dhruv",
      lastName: "Admin",
      email: "arcade2005dhruv@gmail.com",
      password: "12345678",
      phone: "9876543210",
      role: "admin",
      gender: "male",
      isSuperAdmin: true,
      status: "active",
    };

    const user = await User.findOne({ email: adminData.email });
    if (user) {
      user.password = adminData.password;
      await user.save();
      console.log("\n=== Admin Updated Successfully ===");
    } else {
      await User.create(adminData);
      console.log("\n=== Admin Created Successfully ===");
    }

    console.log("Email:", adminData.email);
    console.log("Password:", adminData.password);
    console.log("Role: admin");
    console.log("==================================\n");
  } catch (error) {
    console.error("Seeding Error:", error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

seedAdmin();