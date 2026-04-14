const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const upload = require("../middleware/multerMiddleware");
const {
  registerForEvent, submitPayment, getMyRegistrations, cancelRegistration, verifyQR, getEventAttendees, checkRegistration, getAllOrganizerAttendees, getAllRegistrations
} = require("../controllers/registrationController");

router.post("/", auth, authorize("student"), registerForEvent);
router.post("/submit-payment", auth, authorize("student"), upload.single("paymentScreenshot"), submitPayment);
router.get("/my-registrations", auth, getMyRegistrations);
router.get("/check/:eventId", auth, checkRegistration);
router.patch("/:id/cancel", auth, cancelRegistration);
router.post("/verify-qr", auth, authorize("organizer"), verifyQR);
router.post("/verify-attendance/:eventId", auth, authorize("organizer"), verifyQR);
router.get("/event/:eventId", auth, authorize("organizer", "admin"), getEventAttendees);
router.get("/organizer/all", auth, authorize("organizer", "admin"), getAllOrganizerAttendees);
router.get("/admin/all", auth, authorize("admin"), getAllRegistrations);

module.exports = router;