const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const Event = require("../models/Event");
const User = require("../models/User");
const Registration = require("../models/Registration");

const checkData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB:", process.env.MONGODB_URI);

        const totalEvents = await Event.countDocuments();
        console.log("Total events in DB:", totalEvents);
        
        const events = await Event.find().populate("organizer", "email role");
        console.log("Events List:");
        events.forEach(e => {
            console.log(`- Title: ${e.title} | OrganizerID: ${e.organizer?._id} | OrgEmail: ${e.organizer?.email} | Status: ${e.status}`);
        });

        const organizers = await User.find({ role: "organizer" });
        console.log("Organizers List:");
        organizers.forEach(o => {
            console.log(`- Organizer: ${o.firstName} ${o.lastName} | ID: ${o._id} | Email: ${o.email}`);
        });

        await mongoose.disconnect();
    } catch (error) {
        console.error("Error in checkData:", error);
    }
};

checkData();
