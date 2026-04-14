const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const upload = require("../middleware/multerMiddleware");
const {
  register, login, getMyProfile, updateProfile,
  forgotPassword, resetPassword, changePassword,
  getAllUsers, updateUserStatus, deleteUser,
  forgotPasswordOTP, verifyOTP, resetPasswordWithOTP,
  removeProfilePhoto,
} = require("../controllers/authController");

router.post("/register", upload.single("profile"), register);
router.post("/login", login);
router.get("/me", auth, getMyProfile);
router.patch("/me", auth, upload.single("profile"), updateProfile);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:resetId", resetPassword);
router.post("/change-password", auth, changePassword);
router.post("/remove-profile-photo", auth, removeProfilePhoto);

// OTP-based password reset
router.post("/forgot-password-otp", forgotPasswordOTP);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password-otp", resetPasswordWithOTP);

// Admin routes
router.get("/users", auth, authorize("admin"), getAllUsers);
router.patch("/users/:id", auth, authorize("admin"), updateUserStatus);
router.delete("/users/:id", auth, authorize("admin"), deleteUser);

module.exports = router;