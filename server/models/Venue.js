const mongoose = require("mongoose");

const venueSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    location: { type: String, required: true },
    capacity: { type: Number, required: true },
    type: {
      type: String,
      enum: ["auditorium", "seminar_hall", "classroom", "open_ground", "lab", "other"],
      required: true,
    },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    equipment: [{ type: String }],
    image: { type: String, default: "" },
    isAvailable: { type: Boolean, default: true },
    description: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Venue", venueSchema);