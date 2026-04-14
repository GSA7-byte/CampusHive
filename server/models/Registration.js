const mongoose = require("mongoose");

const registrationSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    qrCode: { type: String },
    status: {
      type: String,
      enum: ["registered", "attended", "cancelled", "no_show"],
      default: "registered",
    },
    paymentId: { type: String },
    transactionId: { type: String },
    paymentScreenshot: { type: String },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "not_required"],
      default: "not_required",
    },
    checkedInAt: { type: Date },
    certificateRequested: { type: Boolean, default: false },
  },
  { timestamps: true }
);

registrationSchema.index({ student: 1, event: 1 }, { unique: true });
registrationSchema.index({ transactionId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Registration", registrationSchema);