const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    venue: { type: mongoose.Schema.Types.ObjectId, ref: "Venue", required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    status: {
      type: String,
      enum: ["confirmed", "cancelled", "pending"],
      default: "confirmed",
    },
  },
  { timestamps: true }
);

bookingSchema.index({ venue: 1, date: 1, startTime: 1, endTime: 1 });

module.exports = mongoose.model("Booking", bookingSchema);