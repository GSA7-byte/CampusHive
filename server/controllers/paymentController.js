const Registration = require("../models/Registration");
const Event = require("../models/Event");
const Notification = require("../models/Notification");
const ApiResponse = require("../utils/ApiResponse");

const getPendingPayments = async (req, res) => {
  try {
    const registrations = await Registration.find({ paymentStatus: "pending" })
      .populate("student", "firstName lastName enrollmentNo email phone department year profile")
      .populate({
        path: "event",
        select: "title date category price isPaid organizer",
        populate: { path: "organizer", select: "firstName lastName organizationName" },
      })
      .sort({ createdAt: -1 });

    return ApiResponse.success(registrations, "Pending payments loaded").send(res);
  } catch (error) {
    console.error("Get Pending Payments Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const reviewPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // "approve" or "reject"

    if (!["approve", "reject"].includes(action)) {
      return ApiResponse.badRequest("Invalid action. Use 'approve' or 'reject'.").send(res);
    }

    const registration = await Registration.findById(id)
      .populate("student", "firstName lastName email")
      .populate("event", "title price");

    if (!registration) {
      return ApiResponse.notFound("Registration not found").send(res);
    }

    if (registration.paymentStatus !== "pending") {
      return ApiResponse.badRequest("This payment has already been reviewed").send(res);
    }

    const io = req.app.get("io");

    if (action === "approve") {
      registration.paymentStatus = "completed";
      registration.status = "registered";
      await registration.save();

      // Increment participant count
      await Event.findByIdAndUpdate(registration.event._id, {
        $inc: { currentParticipants: 1 },
      });

      // Notify student
      const notification = await Notification.create({
        user: registration.student._id,
        title: "Payment Verified ✅",
        message: `Your payment has been verified. You are successfully registered for "${registration.event.title}".`,
        type: "payment",
        relatedEvent: registration.event._id,
      });

      if (io) {
        io.to(registration.student._id.toString()).emit("notification", notification);
      }

      return ApiResponse.success(registration, "Payment approved. Student registered successfully.").send(res);
    } else {
      // reject
      registration.paymentStatus = "failed";
      registration.status = "cancelled";
      await registration.save();

      // Notify student
      const notification = await Notification.create({
        user: registration.student._id,
        title: "Payment Rejected ❌",
        message: `Your payment could not be verified for "${registration.event.title}". Please try again or contact admin.`,
        type: "payment",
        relatedEvent: registration.event._id,
      });

      if (io) {
        io.to(registration.student._id.toString()).emit("notification", notification);
      }

      return ApiResponse.success(registration, "Payment rejected. Registration denied.").send(res);
    }
  } catch (error) {
    console.error("Review Payment Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

module.exports = { getPendingPayments, reviewPayment };
