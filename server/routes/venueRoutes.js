const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const upload = require("../middleware/multerMiddleware");
const {
  getAllVenues, getVenueAvailability, createVenue, updateVenue, deleteVenue,
} = require("../controllers/venueController");

router.get("/", auth, getAllVenues);
router.get("/availability", auth, getVenueAvailability);
router.post("/", auth, authorize("admin", "organizer"), upload.single("image"), createVenue);
router.patch("/:id", auth, authorize("admin"), upload.single("image"), updateVenue);
router.delete("/:id", auth, authorize("admin"), deleteVenue);

module.exports = router;