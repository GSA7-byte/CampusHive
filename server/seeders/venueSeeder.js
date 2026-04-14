require("dotenv").config();
require("dns").setServers(["8.8.8.8", "8.8.4.4"]);
const mongoose = require("mongoose");
const Venue = require("../models/Venue");

const seedVenues = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const venues = [
      {
        name: "Main Auditorium",
        location: "Campus Block A",
        capacity: 1500,
        type: "auditorium",
        coordinates: { lat: 20.3541, lng: 85.8164 }, // generic KIIT approx coordinates
        equipment: ["Projector", "Sound System", "Stage Lighting", "AC"],
        description: "The primary auditorium for large-scale events, cultural fests, and guest lectures.",
      },
      {
        name: "Seminar Hall 1",
        location: "Campus Block B, 2nd Floor",
        capacity: 150,
        type: "seminar_hall",
        coordinates: { lat: 20.3535, lng: 85.8170 },
        equipment: ["Projector", "Mic", "Whiteboard", "AC"],
        description: "A well-equipped hall suitable for departmental seminars, workshops, and club meetings.",
      },
      {
        name: "Computer Lab 4",
        location: "Campus Block C, 3rd Floor",
        capacity: 60,
        type: "lab",
        coordinates: { lat: 20.3530, lng: 85.8160 },
        equipment: ["PCs", "Projector", "High-Speed Internet", "AC"],
        description: "Programming lab intended for hands-on technical workshops and hackathons.",
      },
      {
        name: "Central Open Ground",
        location: "Behind Block C",
        capacity: 5000,
        type: "open_ground",
        coordinates: { lat: 20.3525, lng: 85.8155 },
        equipment: ["Floodlights", "Bleachers"],
        description: "Massive open ground for sports tournaments, concerts, and outdoor exhibitions.",
      },
      {
        name: "Lecture Theater 101",
        location: "Campus Block A, Ground Floor",
        capacity: 200,
        type: "classroom",
        coordinates: { lat: 20.3545, lng: 85.8150 },
        equipment: ["Projector", "Speakers", "Chalkboard"],
        description: "Large classroom ideal for introductory classes, coding rounds, and quizzes.",
      }
    ];

    let createdCount = 0;

    for (const venue of venues) {
      const existing = await Venue.findOne({ name: venue.name });
      if (!existing) {
        await Venue.create(venue);
        console.log(`Created: ${venue.name}`);
        createdCount++;
      } else {
        console.log(`Skipped: ${venue.name} (already exists)`);
      }
    }

    console.log(`\nSeeded ${createdCount} venues into the database!`);
  } catch (error) {
    console.error("Seeding Error:", error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

seedVenues();
