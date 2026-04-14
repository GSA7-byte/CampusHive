const Certificate = require("../models/Certificate");
const Registration = require("../models/Registration");
const Event = require("../models/Event");
const User = require("../models/User");
const Notification = require("../models/Notification");
const ApiResponse = require("../utils/ApiResponse");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const generateCertificate = async (req, res) => {
  try {
    const { eventId, studentId } = req.body;
    const certificate = await generateCertificateFile(studentId, eventId);
    if (!certificate) return ApiResponse.badRequest("Could not generate certificate (ensure attendance)").send(res);
    return ApiResponse.success(certificate, "Certificate generated").send(res);
  } catch (error) {
    console.error("Certificate Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const generateCertificateFile = async (studentId, eventId) => {
  try {
    const reg = await Registration.findOne({ student: studentId, event: eventId, status: "attended" });
    if (!reg) return null;

    let certificate = await Certificate.findOne({ student: studentId, event: eventId });
    
    // If doesn't exist, create first to get the ID for verification code
    if (!certificate) {
      certificate = await Certificate.create({
        student: studentId, 
        event: eventId, 
        certificateUrl: "pending", // temporary
      });
    } else {
      // If it exists but we are re-generating, it already has an ID
    }

    const student = await User.findById(studentId);
    const event = await Event.findById(eventId);

    const certsDir = path.join(__dirname, "..", "media", "certificates");
    if (!fs.existsSync(certsDir)) fs.mkdirSync(certsDir, { recursive: true });

    const fileName = `cert_${studentId}_${eventId}_${Date.now()}.pdf`;
    const filePath = path.join(certsDir, fileName);

    await new Promise((resolve, reject) => {
      const doc = new PDFDocument({ layout: "landscape", size: "A4", margin: 0 });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      const width = doc.page.width;
      const height = doc.page.height;

      // Background (Ivory)
      doc.rect(0, 0, width, height).fill("#FAF9F6");

      // Borders
      // Outer Navy
      doc.rect(30, 30, width - 60, height - 60).lineWidth(5).stroke("#1F3A5F");
      // Inner Gold
      doc.rect(42, 42, width - 84, height - 84).lineWidth(1.5).stroke("#C9A227");

      const startY = 95;

      // Heading (Navy)
      doc.fontSize(38).font("Helvetica-Bold").fillColor("#1F3A5F")
        .text("CERTIFICATE OF EXCELLENCE", 0, startY, { width, align: "center" });
      
      doc.moveDown(0.4);
      doc.fontSize(16).font("Helvetica").fillColor("#555555")
        .text("This is proudly presented to", { width, align: "center" });
      
      // Student Name (Black + Bold Underline)
      doc.moveDown(0.8);
      const name = `${student.firstName} ${student.lastName}`.toUpperCase();
      doc.fontSize(32).font("Helvetica-Bold").fillColor("#000000")
        .text(name, { width, align: "center" });
      
      // Precise Underline
      const nameWidth = doc.widthOfString(name);
      const underlineY = doc.y + 2;
      doc.moveTo((width - nameWidth) / 2, underlineY)
         .lineTo((width + nameWidth) / 2, underlineY)
         .lineWidth(2).stroke("#000000");

      // Student Details (Grey)
      doc.moveDown(1.0);
      doc.fontSize(14).font("Helvetica").fillColor("#555555")
        .text(`Roll No: ${student.enrollmentNo || "N/A"} | Branch: ${student.department || "General"}`, { width, align: "center" });

      doc.moveDown(1.4);
      doc.fontSize(16).font("Helvetica").fillColor("#555555")
        .text("for their active participation and successful completion of", { width, align: "center" });
      
      // Event Name (Navy - No Quotes)
      doc.moveDown(0.4);
      doc.fontSize(24).font("Helvetica-Bold").fillColor("#1F3A5F")
        .text(event.title.toUpperCase(), { width, align: "center" });
      
      // Date (Grey)
      doc.moveDown(0.4);
      doc.fontSize(14).font("Helvetica").fillColor("#555555")
        .text(`Organized and held on ${new Date(event.date).toLocaleDateString("en-IN", { day: 'numeric', month: 'long', year: 'numeric' })}`, { width, align: "center" });

      // Gold Stamp (Bottom Right)
      const stampX = width - 150;
      const stampY = height - 150;
      
      doc.save();
      doc.circle(stampX, stampY, 45).fill("#C9A227");
      doc.circle(stampX, stampY, 40).lineWidth(1).stroke("#FFFFFF");
      
      doc.fontSize(8).fillColor("#FFFFFF").font("Helvetica-Bold");
      doc.text("KIIM BEYOND", stampX - 25, stampY - 15, { width: 50, align: "center" });
      doc.fontSize(6).text("OFFICIAL SEAL", stampX - 25, stampY + 5, { width: 50, align: "center" });
      doc.restore();

      // Verification Code (Bottom Left)
      doc.fontSize(8).fillColor("#C9A227").font("Helvetica-Bold")
        .text(`VERIFICATION ID: ${certificate._id.toString().toUpperCase()}`, 60, height - 75);

      // Footer
      doc.fontSize(11).fillColor("#555555").font("Helvetica")
        .text("CampusHive - Official Event Achievement", 0, height - 90, { width, align: "center" });

      doc.end();
      stream.on("finish", resolve);
      stream.on("error", reject);
    });

    certificate.certificateUrl = `certificates/${fileName}`;
    await certificate.save();
    
    return certificate;
  } catch (error) {
    console.error("[CERT] Generation Error:", error);
    throw error;
  }
};

const verifyCertificate = async (req, res) => {
  try {
    const code = req.params.code.trim().toLowerCase();
    const certificate = await Certificate.findById(code)
      .populate("student", "firstName lastName enrollmentNo department profile")
      .populate("event", "title date category");

    if (!certificate) return ApiResponse.notFound("Invalid verification code").send(res);

    return ApiResponse.success(certificate, "Certificate verified successfully").send(res);
  } catch (error) {
    console.error("Verification Error:", error);
    return ApiResponse.badRequest("Invalid verification format").send(res);
  }
};

const intimateAvailability = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId);
    if (!event) return ApiResponse.notFound().send(res);
    
    event.providesCertificate = true;
    event.certificateStatus = "intimated";
    await event.save();
    
    return ApiResponse.success(event, "Students will be intimated about certification").send(res);
  } catch (error) {
    return ApiResponse.internalServerError().send(res);
  }
};

const requestRelease = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId);
    if (!event) return ApiResponse.notFound().send(res);
    
    event.certificateStatus = "requested";
    await event.save();

    // Notify Admin (simplification: assume generic admin group or just setting status is enough)
    
    return ApiResponse.success(event, "Certificate release request sent to admin").send(res);
  } catch (error) {
    return ApiResponse.internalServerError().send(res);
  }
};

const approveRelease = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId);
    if (!event) return ApiResponse.notFound().send(res);
    
    const attendees = await Registration.find({ event: eventId, status: "attended" });
    
    // Generate for all attendees
    const io = req.app.get("io");
    for (const reg of attendees) {
      try {
        await generateCertificateFile(reg.student, eventId);
        
        // Notify Student
        const notification = await Notification.create({
          user: reg.student,
          title: "Certificate Released! 🎓",
          message: `Your certificate for "${event.title}" has been approved and is now available in your Vault.`,
          type: "registration",
          relatedEvent: eventId
        });

        if (io) {
          io.to(reg.student.toString()).emit("notification", notification);
        }
      } catch (err) {
        console.error(`Failed cert/notif for student ${reg.student}:`, err);
      }
    }
    
    event.certificateStatus = "approved";
    await event.save();
    
    return ApiResponse.success(event, "Certificates approved and released").send(res);
  } catch (error) {
    return ApiResponse.internalServerError().send(res);
  }
};

const requestCertificate = async (req, res) => {
  try {
    const { eventId } = req.body;
    const studentId = req.userId;

    const reg = await Registration.findOne({ student: studentId, event: eventId, status: "attended" });
    if (!reg) return ApiResponse.badRequest("You must be marked as attended to request a certificate").send(res);

    const event = await Event.findById(eventId).populate("organizer");
    if (!event) return ApiResponse.notFound("Event not found").send(res);

    const student = await User.findById(studentId);

    // Update registration to reflect request
    reg.certificateRequested = true;
    await reg.save();

    // Notify Organizer
    const notification = await Notification.create({
      user: event.organizer,
      title: "Certificate Request 🎓",
      message: `${student.firstName} ${student.lastName} has requested their certificate for "${event.title}".`,
      type: "event",
      relatedEvent: eventId
    });

    const io = req.app.get("io");
    if (io) {
      io.to(event.organizer._id.toString()).emit("notification", notification);
    }

    return ApiResponse.success(null, "Request sent to organizer").send(res);
  } catch (error) {
    console.error("Request Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const getMyCertificates = async (req, res) => {
  try {
    const certificates = await Certificate.find({ student: req.userId })
      .populate("event", "title date category").sort({ issuedAt: -1 });
    return ApiResponse.success(certificates, "Certificates loaded").send(res);
  } catch (error) {
    return ApiResponse.internalServerError().send(res);
  }
};

module.exports = { 
  generateCertificate, 
  getMyCertificates, 
  generateCertificateFile,
  intimateAvailability,
  requestRelease,
  approveRelease,
  verifyCertificate,
  requestCertificate
};