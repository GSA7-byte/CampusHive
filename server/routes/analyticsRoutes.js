const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const { getDashboardAnalytics, getOrganizerStats } = require("../controllers/analyticsController");

router.get("/dashboard", auth, authorize("admin"), getDashboardAnalytics);
router.get("/organizer-stats", auth, authorize("organizer"), getOrganizerStats);

module.exports = router;