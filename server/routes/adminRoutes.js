const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const User = require("../models/User");
const ApiResponse = require("../utils/ApiResponse");

// GET /api/admin/users — list all users
router.get("/users", auth, authorize("admin"), async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });
    return ApiResponse.success(users, "Users loaded").send(res);
  } catch (error) {
    return ApiResponse.internalServerError().send(res);
  }
});

module.exports = router;