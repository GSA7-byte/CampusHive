const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const Event = require("../models/Event");
const User = require("../models/User");
const Registration = require("../models/Registration");

const checkData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB");

        const totalEvents = await Event.countDocuments();
        console.log("Total events in DB:", totalEvents);

        const events = await Event.find().limit(5);
        events.forEach(e => {
            console.log(`Event: ${e.title} | Organizer ID: ${e.organizer}`);
        });

        const organizers = await User.find({ role: "organizer" });
        console.log("Total organizers in DB:", organizers.length);
        organizers.forEach(o => {
            console.log(`Organizer: ${o.firstName} ${o.lastName} | ID: ${o._id} | Email: ${o.email}`);
        });

        await mongoose.disconnect();
    } catch (error) {
        console.error("Error:", error);
    }
};

checkData();
