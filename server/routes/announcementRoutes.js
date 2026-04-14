const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const {
  getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement,
} = require("../controllers/announcementController");

router.get("/", getAnnouncements);
router.post("/", auth, authorize("admin"), createAnnouncement);
router.patch("/:id", auth, authorize("admin"), updateAnnouncement);
router.delete("/:id", auth, authorize("admin"), deleteAnnouncement);

module.exports = router;