const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ["event_new", "event_update", "event_reminder", "registration", "approval", "system", "event", "payment"],
      default: "system",
    },
    relatedEvent: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);