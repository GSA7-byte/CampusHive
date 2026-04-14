require("dotenv").config();
require("dns").setServers(["8.8.8.8", "8.8.4.4"]);
const mongoose = require("mongoose");
const User = require("../models/User");

const seedOrganizer = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const existingOrganizer = await User.findOne({ email: "organizer@campushive.com" });
    if (existingOrganizer) {
      console.log("\nOrganizer test account already exists!");
      console.log("Email:", existingOrganizer.email);
      console.log("Use your existing password to login.");
      await mongoose.connection.close();
      process.exit(0);
    }

    const organizerData = {
      firstName: "Test",
      lastName: "Organizer",
      email: "organizer@campushive.com",
      password: "organizer123",
      phone: "1234567890",
      role: "organizer",
      organizationName: "Test Organization",
      designation: "Lead Event Manager",
      isVerified: true, // We make them verified so they can log in right away
      status: "active",
    };

    await User.create(organizerData);

    console.log("\n=== Test Organizer Created Successfully ===");
    console.log("Email:", organizerData.email);
    console.log("Password:", organizerData.password);
    console.log("Role: organizer");
    console.log("===========================================\n");
  } catch (error) {
    console.error("Seeding Error:", error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

seedOrganizer();
