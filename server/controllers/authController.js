const User = require("../models/User");
const ResetPassword = require("../models/ResetPassword");
const ApiResponse = require("../utils/ApiResponse");
const generateToken = require("../utils/generateToken");
const sendMail = require("../utils/sendMail");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");

const register = async (req, res) => {
  try {
    const { email, role } = req.body;

    // Only one admin is allowed — admin is pre-seeded, not registered
    if (role === "admin") {
      return ApiResponse.forbidden("Admin registration is not allowed").send(res);
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return ApiResponse.conflict("User already exists").send(res);
    }

    const userData = { ...req.body };
    if (req.file) userData.profile = req.file.filename;
    if (role === "organizer") userData.isVerified = false;

    const user = await User.create(userData);
    const token = generateToken(user._id, user.role);

    return ApiResponse.created(
      { token, role: user.role, userId: user._id },
      "Registration successful"
    ).send(res);
  } catch (error) {
    console.error("Register Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    // Find user by email or enrollmentNo (Student ID)
    const user = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { enrollmentNo: email }],
    });
    if (!user) return ApiResponse.notFound("User not found").send(res);
    if (user.status === "suspended") return ApiResponse.forbidden("Account suspended").send(res);

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) return ApiResponse.unauthorized("Invalid password").send(res);

    const token = generateToken(user._id, user.role);
    return ApiResponse.success(
      { token, role: user.role, userId: user._id },
      "Login successful"
    ).send(res);
  } catch (error) {
    console.error("Login Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) return ApiResponse.notFound("User not found").send(res);
    return ApiResponse.success(user, "Profile loaded").send(res);
  } catch (error) {
    return ApiResponse.internalServerError().send(res);
  }
};

const updateProfile = async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.file) updateData.profile = req.file.filename;
    delete updateData.password;
    delete updateData.role;

    const user = await User.findByIdAndUpdate(req.userId, updateData, { new: true }).select("-password");
    return ApiResponse.success(user, "Profile updated").send(res);
  } catch (error) {
    return ApiResponse.internalServerError().send(res);
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return ApiResponse.notFound("User not found").send(res);

    await ResetPassword.deleteMany({ userId: user._id });
    const resetTokenStr = uuidv4();
    await ResetPassword.create({ userId: user._id, resetToken: resetTokenStr });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetTokenStr}`;
    await sendMail({
      to: email,
      subject: "CampusHive - Reset Password",
      html: `<h2>Reset Password</h2><p>Click <a href="${resetUrl}">here</a> to reset. Expires in 1 hour.</p>`,
    });

    return ApiResponse.success(null, "Reset link sent to email").send(res);
  } catch (error) {
    return ApiResponse.internalServerError().send(res);
  }
};

const resetPassword = async (req, res) => {
  try {
    const { resetId } = req.params;
    const { newPassword } = req.body;

    const resetEntry = await ResetPassword.findOne({ resetToken: resetId });
    if (!resetEntry) return ApiResponse.badRequest("Invalid or expired token").send(res);

    const user = await User.findById(resetEntry.userId);
    if (!user) return ApiResponse.notFound("User not found").send(res);

    user.password = newPassword;
    await user.save();
    await ResetPassword.deleteOne({ _id: resetEntry._id });

    return ApiResponse.success(null, "Password updated").send(res);
  } catch (error) {
    return ApiResponse.internalServerError().send(res);
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return ApiResponse.notFound("User not found").send(res);

    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) return ApiResponse.unauthorized("Current password incorrect").send(res);

    user.password = newPassword;
    await user.save();
    return ApiResponse.success(null, "Password changed").send(res);
  } catch (error) {
    return ApiResponse.internalServerError().send(res);
  }
};

// Admin: Get all users
const getAllUsers = async (req, res) => {
  try {
    const { role, search } = req.query;
    let query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query).select("-password").sort({ createdAt: -1 });
    return ApiResponse.success(users, "Users loaded").send(res);
  } catch (error) {
    return ApiResponse.internalServerError().send(res);
  }
};

// Admin: Update user status
const updateUserStatus = async (req, res) => {
  try {
    const { status, isVerified } = req.body;
    const updateData = {};
    if (status) updateData.status = status;
    if (typeof isVerified === "boolean") updateData.isVerified = isVerified;

    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true }).select("-password");
    if (!user) return ApiResponse.notFound("User not found").send(res);

    return ApiResponse.success(user, "User updated").send(res);
  } catch (error) {
    return ApiResponse.internalServerError().send(res);
  }
};

// OTP-based forgot password
const forgotPasswordOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return ApiResponse.notFound("User not found").send(res);

    await ResetPassword.deleteMany({ userId: user._id });
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const resetTokenStr = uuidv4();
    await ResetPassword.create({
      userId: user._id,
      resetToken: resetTokenStr,
      otp,
      otpExpiry: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    await sendMail({
      to: email,
      subject: "CampusHive - Password Reset OTP",
      html: `<div style="font-family:Arial,sans-serif;padding:20px;">
        <h2 style="color:#06b6d4;">CampusHive Password Reset</h2>
        <p>Your OTP for password reset is:</p>
        <h1 style="letter-spacing:8px;color:#06b6d4;font-size:36px;">${otp}</h1>
        <p>This code expires in <strong>10 minutes</strong>.</p>
        <p style="color:#999;">If you didn't request this, ignore this email.</p>
      </div>`,
    });

    return ApiResponse.success({ resetToken: resetTokenStr }, "OTP sent to email").send(res);
  } catch (error) {
    console.error("ForgotPasswordOTP Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user) return ApiResponse.notFound("User not found").send(res);

    const resetEntry = await ResetPassword.findOne({ userId: user._id, otp });
    if (!resetEntry) return ApiResponse.badRequest("Invalid OTP").send(res);
    if (resetEntry.otpExpiry && new Date() > resetEntry.otpExpiry) {
      await ResetPassword.deleteOne({ _id: resetEntry._id });
      return ApiResponse.badRequest("OTP has expired").send(res);
    }

    return ApiResponse.success({ resetToken: resetEntry.resetToken }, "OTP verified").send(res);
  } catch (error) {
    console.error("VerifyOTP Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const resetPasswordWithOTP = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user) return ApiResponse.notFound("User not found").send(res);

    const resetEntry = await ResetPassword.findOne({ userId: user._id, otp });
    if (!resetEntry) return ApiResponse.badRequest("Invalid OTP").send(res);
    if (resetEntry.otpExpiry && new Date() > resetEntry.otpExpiry) {
      await ResetPassword.deleteOne({ _id: resetEntry._id });
      return ApiResponse.badRequest("OTP has expired").send(res);
    }

    user.password = newPassword;
    await user.save();
    await ResetPassword.deleteMany({ userId: user._id });

    return ApiResponse.success(null, "Password reset successfully").send(res);
  } catch (error) {
    console.error("ResetPasswordOTP Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

// Admin: Delete user
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return ApiResponse.notFound("User not found").send(res);
    if (user.role === "admin") return ApiResponse.badRequest("Admin accounts cannot be deleted").send(res);

    await User.findByIdAndDelete(req.params.id);
    return ApiResponse.success(null, "User deleted successfully").send(res);
  } catch (error) {
    return ApiResponse.internalServerError().send(res);
  }
};

const removeProfilePhoto = async (req, res) => {
  console.log(`[AuthCtrl] removeProfilePhoto called for User ID: ${req.userId}`);
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      console.warn(`[AuthCtrl] User not found: ${req.userId}`);
      return ApiResponse.notFound("User not found").send(res);
    }

    const oldProfile = user.profile;
    console.log(`[AuthCtrl] Current profile field: "${oldProfile}"`);

    if (oldProfile && oldProfile !== "" && oldProfile !== "null" && oldProfile !== "undefined") {
      const filePath = path.join(__dirname, "..", "media", oldProfile);
      console.log(`[AuthCtrl] Attempting to delete file: ${filePath}`);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log(`[AuthCtrl] Deleted file: ${oldProfile}`);
        } catch (e) {
          console.error(`[AuthCtrl] fs.unlinkSync failed:`, e.message);
        }
      } else {
        console.warn(`[AuthCtrl] File not found on disk: ${filePath}`);
      }
    }

    console.log(`[AuthCtrl] Updating DB to clear profile field...`);
    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { $set: { profile: "" } },
      { new: true }
    ).select("-password");

    console.log(`[AuthCtrl] DB update success. New profile state: "${updatedUser.profile}"`);
    return ApiResponse.success(updatedUser, "Profile photo removed").send(res);
  } catch (error) {
    console.error("[AuthCtrl] Internal Error in removeProfilePhoto:", error);
    return ApiResponse.internalServerError("Failed to process photo removal").send(res);
  }
};

module.exports = {
  register,
  login,
  getMyProfile,
  updateProfile,
  forgotPassword,
  resetPassword,
  changePassword,
  getAllUsers,
  updateUserStatus,
  forgotPasswordOTP,
  verifyOTP,
  resetPasswordWithOTP,
  deleteUser,
  removeProfilePhoto,
};