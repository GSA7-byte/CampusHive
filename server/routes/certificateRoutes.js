const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const { 
  generateCertificate, 
  getMyCertificates, 
  intimateAvailability, 
  requestRelease, 
  approveRelease,
  verifyCertificate,
  requestCertificate
} = require("../controllers/certificateController");

router.post("/generate", auth, authorize("organizer", "admin", "student"), generateCertificate);
router.get("/my-certificates", auth, authorize("student"), getMyCertificates);
router.post("/request-reissue", auth, authorize("student"), requestCertificate);

// New Workflow
router.post("/intimate/:eventId", auth, authorize("organizer"), intimateAvailability);
router.post("/request-release/:eventId", auth, authorize("organizer"), requestRelease);
router.post("/approve-release/:eventId", auth, authorize("admin"), approveRelease);

// Verification (Public)
router.get("/verify/:code", verifyCertificate);

module.exports = router;