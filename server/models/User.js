const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 6 },
    phone: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: ["student", "organizer", "admin"],
      default: "student",
    },
    profile: { type: String, default: "" },
    gender: { type: String, enum: ["male", "female", "other"] },

    // Student fields
    enrollmentNo: { type: String },
    department: { type: String },
    year: { type: Number },
    semester: { type: Number },
    interests: [{ type: String }],

    // Organizer fields
    organizationName: { type: String },
    designation: { type: String },
    isVerified: { type: Boolean, default: false },

    // Admin fields
    isSuperAdmin: { type: Boolean, default: false },

    // Common
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);