const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { submitFeedback, getEventFeedback } = require("../controllers/feedbackController");

router.post("/", auth, submitFeedback);
router.get("/event/:eventId", auth, getEventFeedback);

module.exports = router;