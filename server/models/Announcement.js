const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ["general", "event", "urgent"],
      default: "general",
    },
    isPinned: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Announcement", announcementSchema);