const Registration = require("../models/Registration");
const Event = require("../models/Event");
const ApiResponse = require("../utils/ApiResponse");
const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");
const Notification = require("../models/Notification");
const { generateCertificateFile } = require("./certificateController");

const registerForEvent = async (req, res) => {
  try {
    const { eventId } = req.body;
    const studentId = req.userId;

    const event = await Event.findById(eventId);
    if (!event) return ApiResponse.notFound("Event not found").send(res);
    if (event.status !== "approved") return ApiResponse.badRequest("Event not open").send(res);
    if (event.currentParticipants >= event.maxParticipants) return ApiResponse.badRequest("Event is full").send(res);

    // For paid events, students should go through the payment flow
    if (event.isPaid) return ApiResponse.badRequest("This is a paid event. Please use the payment flow.").send(res);

    const existing = await Registration.findOne({ student: studentId, event: eventId });
    if (existing) return ApiResponse.conflict("Already registered").send(res);

    const qrData = JSON.stringify({ studentId, eventId, timestamp: Date.now() });
    const qrCode = await QRCode.toDataURL(qrData);

    const registration = await Registration.create({
      student: studentId, event: eventId, qrCode,
      paymentStatus: "not_required",
    });

    await Event.findByIdAndUpdate(eventId, { $inc: { currentParticipants: 1 } });
    return ApiResponse.created(registration, "Registered successfully!").send(res);
  } catch (error) {
    if (error.code === 11000) return ApiResponse.conflict("Already registered").send(res);
    return ApiResponse.internalServerError().send(res);
  }
};

const submitPayment = async (req, res) => {
  try {
    const { eventId, transactionId } = req.body;
    const studentId = req.userId;

    if (!eventId || !transactionId) {
      return ApiResponse.badRequest("Event ID and Transaction ID are required").send(res);
    }

    const event = await Event.findById(eventId);
    if (!event) return ApiResponse.notFound("Event not found").send(res);
    if (event.status !== "approved") return ApiResponse.badRequest("Event not open for registration").send(res);
    if (!event.isPaid) return ApiResponse.badRequest("This event is free. No payment required.").send(res);
    if (event.currentParticipants >= event.maxParticipants) return ApiResponse.badRequest("Event is full").send(res);

    // Check for existing registration
    const existing = await Registration.findOne({ student: studentId, event: eventId });
    if (existing) return ApiResponse.conflict("Already registered or payment already submitted for this event").send(res);

    // Check for duplicate transaction ID
    const duplicateTxn = await Registration.findOne({ transactionId });
    if (duplicateTxn) return ApiResponse.conflict("This transaction ID has already been used").send(res);

    // Get screenshot filename from multer
    const paymentScreenshot = req.file ? req.file.filename : null;
    if (!paymentScreenshot) {
      return ApiResponse.badRequest("Payment screenshot is required").send(res);
    }

    const qrData = JSON.stringify({ studentId, eventId, timestamp: Date.now() });
    const qrCode = await QRCode.toDataURL(qrData);

    const registration = await Registration.create({
      student: studentId,
      event: eventId,
      qrCode,
      transactionId,
      paymentScreenshot,
      paymentStatus: "pending",
    });

    return ApiResponse.created(registration, "Payment submitted! Your registration is pending admin verification.").send(res);
  } catch (error) {
    console.error("Submit Payment Error:", error);
    if (error.code === 11000) {
      if (error.keyPattern?.transactionId) {
        return ApiResponse.conflict("This transaction ID has already been used").send(res);
      }
      return ApiResponse.conflict("Already registered for this event").send(res);
    }
    return ApiResponse.internalServerError().send(res);
  }
};

const getMyRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find({ student: req.userId })
      .populate({ path: "event", populate: [
        { path: "venue", select: "name location" },
        { path: "organizer", select: "firstName lastName organizationName" },
      ]})
      .sort({ createdAt: -1 });
    return ApiResponse.success(registrations, "Registrations loaded").send(res);
  } catch (error) {
    return ApiResponse.internalServerError().send(res);
  }
};

const cancelRegistration = async (req, res) => {
  try {
    const reg = await Registration.findById(req.params.id);
    if (!reg) return ApiResponse.notFound("Not found").send(res);
    if (reg.student.toString() !== req.userId) return ApiResponse.forbidden("Not authorized").send(res);
    reg.status = "cancelled";
    await reg.save();
    await Event.findByIdAndUpdate(reg.event, { $inc: { currentParticipants: -1 } });
    return ApiResponse.success(null, "Registration cancelled").send(res);
  } catch (error) {
    return ApiResponse.internalServerError().send(res);
  }
};

const verifyQR = async (req, res) => {
  try {
    const eventId = req.body.eventId || req.params.eventId;
    const { studentId } = req.body;
    const reg = await Registration.findOne({ student: studentId, event: eventId })
      .populate("student", "firstName lastName enrollmentNo email profile");
    if (!reg) return ApiResponse.notFound("No registration found").send(res);
    if (reg.status === "attended") return ApiResponse.badRequest("Already checked in").send(res);
    if (reg.status === "cancelled") return ApiResponse.badRequest("Registration cancelled").send(res);

    reg.status = "attended";
    reg.checkedInAt = new Date();
    await reg.save();

    // Generate/Update CSV Report
    const csvFile = await updateEventCSV(eventId);

    // Create Notification for Student
    let notification;
    try {
      notification = await Notification.create({
        user: studentId,
        title: "Check-in Successful! ✨",
        message: `You've been marked as attended for "${reg.event?.title || 'the event'}". Enjoy your session!`,
        type: "registration",
        relatedEvent: eventId
      });
    } catch (notifErr) {
      console.error("[verifyQR] Notification failed:", notifErr);
    }

    // Notify organizers via Socket.IO
    const io = req.app.get("io");
    if (io) {
      io.to(eventId.toString()).emit("attendanceUpdated", {
        student: reg.student,
        checkedInAt: reg.checkedInAt,
        csvUrl: `/media/reports/${csvFile}`
      });
      // Also notify student via private socket if they are connected
      if (notification) {
        io.to(studentId.toString()).emit("notification", notification);
      }
    }

    return ApiResponse.success({ 
      student: reg.student, 
      checkedInAt: reg.checkedInAt,
      csvUrl: `/media/reports/${csvFile}`
    }, "Check-in successful!").send(res);
  } catch (error) {
    console.error("verifyQR Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const updateEventCSV = async (eventId) => {
  try {
    const registrations = await Registration.find({ event: eventId, status: "attended" })
      .populate("student", "firstName lastName enrollmentNo email phone department year")
      .sort({ checkedInAt: 1 });

    const headers = ["Name", "Email", "Phone", "Enrollment No", "Department", "Year", "Check-in Time"];
    
    let csvContent = headers.join(",") + "\n";
    registrations.forEach(reg => {
      const row = [
        `"${reg.student?.firstName} ${reg.student?.lastName}"`,
        `"${reg.student?.email}"`,
        `"${reg.student?.phone || 'N/A'}"`,
        `"${reg.student?.enrollmentNo || 'N/A'}"`,
        `"${reg.student?.department || 'General'}"`,
        `"${reg.student?.year || '-'}"`,
        `"${reg.checkedInAt ? reg.checkedInAt.toLocaleString() : 'N/A'}"`
      ];
      csvContent += row.join(",") + "\n";
    });

    const reportDir = path.join(__dirname, "..", "media", "reports");
    if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
    
    const fileName = `attendees_${eventId}.csv`;
    const filePath = path.join(reportDir, fileName);
    fs.writeFileSync(filePath, csvContent);
    return fileName;
  } catch (error) {
    console.error("[CSV] Generation Error:", error);
    return null;
  }
};

const getEventAttendees = async (req, res) => {
  try {
    const registrations = await Registration.find({ event: req.params.eventId })
      .populate("student", "firstName lastName enrollmentNo email phone department year profile")
      .sort({ createdAt: -1 });
    return ApiResponse.success(registrations, "Attendees loaded").send(res);
  } catch (error) {
    return ApiResponse.internalServerError().send(res);
  }
};

const checkRegistration = async (req, res) => {
  try {
    const reg = await Registration.findOne({ student: req.userId, event: req.params.eventId });
    if (!reg) return ApiResponse.success({ isRegistered: false }, "Not registered").send(res);
    return ApiResponse.success({ isRegistered: true, status: reg.status, paymentStatus: reg.paymentStatus }, "Registered").send(res);
  } catch (error) {
    return ApiResponse.internalServerError().send(res);
  }
};

const getAllOrganizerAttendees = async (req, res) => {
  try {
    const events = await Event.find({ organizer: req.userId }).select('_id title');
    const eventIds = events.map(e => e._id);
    const registrations = await Registration.find({ event: { $in: eventIds } })
      .populate("student", "firstName lastName enrollmentNo email phone department year profile")
      .populate("event", "title date")
      .sort({ createdAt: -1 });
    return ApiResponse.success(registrations, "All attendees loaded").send(res);
  } catch (error) {
    console.error("getAllOrganizerAttendees Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const getAllRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find({})
      .populate("student", "firstName lastName enrollmentNo email phone department year profile")
      .populate({ path: "event", select: "title date", populate: { path: "organizer", select: "firstName lastName" } })
      .sort({ createdAt: -1 });
    return ApiResponse.success(registrations, "All registrations loaded").send(res);
  } catch (error) {
    console.error("getAllRegistrations Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

module.exports = { registerForEvent, submitPayment, getMyRegistrations, cancelRegistration, verifyQR, getEventAttendees, checkRegistration, getAllOrganizerAttendees, getAllRegistrations };