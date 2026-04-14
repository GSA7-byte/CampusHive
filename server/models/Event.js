const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: ["technical", "cultural", "sports", "workshop", "seminar", "other"],
    },
    department: { type: String },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    venue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Venue",
      required: true,
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    maxParticipants: { type: Number, required: true },
    currentParticipants: { type: Number, default: 0 },
    isPaid: { type: Boolean, default: false },
    price: { type: Number, default: 0 },
    banner: { type: String, default: "" },
    tags: [{ type: String }],
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "completed", "cancelled"],
      default: "pending",
    },
    adminRemarks: { type: String, default: "" },
    estimatedBudget: { type: Number, default: 0 },
    requirements: { type: String },
    providesCertificate: { type: Boolean, default: false },
    certificateStatus: {
      type: String,
      enum: ["none", "intimated", "requested", "approved"],
      default: "none",
    },
  },
  { timestamps: true }
);

eventSchema.index({ title: "text", description: "text", tags: "text" });

module.exports = mongoose.model("Event", eventSchema);