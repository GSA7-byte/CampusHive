const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { getMyNotifications, markAsRead, markAllAsRead, deleteNotification } = require("../controllers/notificationController");

router.get("/", auth, getMyNotifications);
router.patch("/:id/read", auth, markAsRead);
router.patch("/read-all", auth, markAllAsRead);
router.delete("/:id", auth, deleteNotification);

module.exports = router;