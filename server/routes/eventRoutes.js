const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const upload = require("../middleware/multerMiddleware");
const {
  getAllEvents, getEventById, createEvent, updateEvent, deleteEvent,
  getMyEvents, getPendingEvents, reviewEvent, getRecommendedEvents, getAdminEvents,
} = require("../controllers/eventController");

router.get("/", getAllEvents);
router.get("/recommended", auth, getRecommendedEvents);
router.get("/my-events", auth, authorize("organizer"), getMyEvents);
router.get("/pending", auth, authorize("admin"), getPendingEvents);
router.get("/admin/all", auth, authorize("admin"), getAdminEvents);
router.get("/:id", getEventById);
router.post("/", auth, authorize("organizer"), upload.single("banner"), createEvent);
router.patch("/:id", auth, upload.single("banner"), updateEvent);
router.delete("/:id", auth, deleteEvent);
router.patch("/:id/review", auth, authorize("admin"), reviewEvent);

module.exports = router;