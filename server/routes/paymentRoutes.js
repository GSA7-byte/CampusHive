const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const { getPendingPayments, reviewPayment } = require("../controllers/paymentController");

// Admin-only routes
router.get("/pending", auth, authorize("admin"), getPendingPayments);
router.patch("/:id/review", auth, authorize("admin"), reviewPayment);

module.exports = router;
