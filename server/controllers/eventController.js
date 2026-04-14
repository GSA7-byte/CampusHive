const mongoose = require("mongoose");
const Event = require("../models/Event");
const Booking = require("../models/Booking");
const Registration = require("../models/Registration");
const Notification = require("../models/Notification");
const Venue = require("../models/Venue");
const Certificate = require("../models/Certificate");
const ApiResponse = require("../utils/ApiResponse");

const getAllEvents = async (req, res) => {
  try {
    const { category, search, department, timing, upcoming, page = 1, limit = 12 } = req.query;
    let query = { status: "approved" };
    if (category) query.category = category;
    if (department) query.department = { $regex: department, $options: "i" };
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }
    
    if (upcoming === 'true') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      query.date = { $gte: today };
      query.$expr = { $lt: ["$currentParticipants", "$maxParticipants"] };
    }

    if (timing === "day") {
      query.startTime = { $gte: "06:00", $lt: "18:00" };
    } else if (timing === "night") {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { startTime: { $gte: "18:00" } },
          { startTime: { $lt: "06:00" } }
        ]
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const events = await Event.find(query)
      .populate("organizer", "firstName lastName organizationName profile")
      .populate("venue", "name location capacity")
      .sort({ date: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Event.countDocuments(query);
    return ApiResponse.success({
      events,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    }, "Events loaded").send(res);
  } catch (error) {
    console.error("Get Events Error:", error);
    return ApiResponse.internalServerError("ISE-GET-ALL").send(res);
  }
};

const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("organizer", "firstName lastName organizationName email phone profile")
      .populate("venue", "name location capacity type equipment");
    if (!event) return ApiResponse.notFound("Event not found").send(res);
    
    const certificateRequestCount = await Registration.countDocuments({ 
      event: event._id, 
      certificateRequested: true 
    });

    const eventObj = event.toObject();
    eventObj.certificateRequestCount = certificateRequestCount;

    return ApiResponse.success(eventObj, "Event loaded").send(res);
  } catch (error) {
    return ApiResponse.internalServerError("ISE-GET-ID").send(res);
  }
};

const createEvent = async (req, res) => {
  try {
    console.log("Create Event Request Body:", req.body);
    let { venue, ...rest } = req.body;
    
    // Explicitly cast numeric/boolean fields
    const eventData = {
      ...rest,
      organizer: req.userId,
      maxParticipants: Number(rest.maxParticipants) || 0,
      isPaid: rest.isPaid === "true" || rest.isPaid === true,
      price: Number(rest.price) || 0,
      date: new Date(rest.date),
    };

    if (req.file) eventData.banner = req.file.filename;

    // Handle venue resolution
    let venueId;
    if (venue) {
      try {
        const venueObj = typeof venue === "string" ? JSON.parse(venue) : venue;
        let existingVenue = await Venue.findOne({ name: venueObj.name });
        
        if (!existingVenue && venueObj.name) {
          console.log("Creating new venue:", venueObj.name);
          existingVenue = await Venue.create({
            name: venueObj.name,
            location: venueObj.address || venueObj.name || "TBA",
            capacity: eventData.maxParticipants || 100,
            type: "other",
            coordinates: { 
              lat: (venueObj.coordinates && venueObj.coordinates[0]) || 20.2961, 
              lng: (venueObj.coordinates && venueObj.coordinates[1]) || 85.8245 
            }
          });
        }
        venueId = existingVenue ? existingVenue._id : null;
      } catch (e) {
        console.error("Venue Parse Error:", e);
        const existingVenue = await Venue.findOne({ name: venue });
        venueId = existingVenue ? existingVenue._id : null;
      }
    }

    if (!venueId) {
      return ApiResponse.badRequest("Valid venue information is required").send(res);
    }

    eventData.venue = venueId;

    // Check for conflicts
    const conflict = await Booking.findOne({
      venue: eventData.venue,
      date: eventData.date,
      $or: [
        { startTime: { $lt: eventData.endTime }, endTime: { $gt: eventData.startTime } }
      ],
      status: { $ne: "cancelled" },
    });

    if (conflict) {
      return ApiResponse.conflict("Venue already booked for this time").send(res);
    }

    const event = await Event.create(eventData);
    
    await Booking.create({
      venue: eventData.venue,
      event: event._id,
      organizer: req.userId,
      date: eventData.date,
      startTime: eventData.startTime,
      endTime: eventData.endTime,
      status: "pending",
    });

    return ApiResponse.created(event, "Event submitted for approval").send(res);
  } catch (error) {
    console.error("Create Event Error Detail:", error);
    return ApiResponse.internalServerError("ISE-CREATE").send(res);
  }
};

const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return ApiResponse.notFound("Event not found").send(res);
    
    // Auth check
    if (event.organizer.toString() !== req.userId && req.userRole !== "admin") {
      return ApiResponse.forbidden("Not authorized").send(res);
    }

    let { venue, ...rest } = req.body;
    
    // Explicitly cast numeric/boolean fields
    const updateData = {
      ...rest,
      maxParticipants: rest.maxParticipants ? Number(rest.maxParticipants) : event.maxParticipants,
      isPaid: rest.isPaid !== undefined ? (rest.isPaid === "true" || rest.isPaid === true) : event.isPaid,
      price: rest.price !== undefined ? Number(rest.price) : event.price,
      date: rest.date ? new Date(rest.date) : event.date,
    };

    if (req.file) updateData.banner = req.file.filename;

    // Handle venue resolution if provided
    if (venue) {
      try {
        const venueObj = typeof venue === "string" ? JSON.parse(venue) : venue;
        let existingVenue = await Venue.findOne({ name: venueObj.name });
        
        if (!existingVenue && venueObj.name) {
          existingVenue = await Venue.create({
            name: venueObj.name,
            location: venueObj.address || venueObj.name || "TBA",
            capacity: updateData.maxParticipants || 100,
            type: "other",
            coordinates: { 
              lat: (venueObj.coordinates && venueObj.coordinates[0]) || 20.2961, 
              lng: (venueObj.coordinates && venueObj.coordinates[1]) || 85.8245 
            }
          });
        }
        if (existingVenue) updateData.venue = existingVenue._id;
      } catch (e) {
        console.error("Update Venue Parse Error:", e);
        const existingVenue = await Venue.findOne({ name: venue });
        if (existingVenue) updateData.venue = existingVenue._id;
      }
    }

    // Check for conflicts if date/time/venue changed
    if (updateData.date || updateData.startTime || updateData.endTime || updateData.venue) {
      const conflictQuery = {
        venue: updateData.venue || event.venue,
        date: updateData.date || event.date,
        $or: [
          { startTime: { $lt: updateData.endTime || event.endTime }, endTime: { $gt: updateData.startTime || event.startTime } }
        ],
        status: { $ne: "cancelled" },
        event: { $ne: event._id } // Exclude current event
      };
      
      const conflict = await Booking.findOne(conflictQuery);
      if (conflict) {
        return ApiResponse.conflict("Venue already booked for this time").send(res);
      }

      // Update booking as well
      await Booking.findOneAndUpdate(
        { event: event._id },
        { 
          date: updateData.date || event.date,
          startTime: updateData.startTime || event.startTime,
          endTime: updateData.endTime || event.endTime,
          venue: updateData.venue || event.venue
        }
      );
    }

    const updated = await Event.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate("venue", "name location")
      .populate("organizer", "firstName lastName");

    return ApiResponse.success(updated, "Event updated successfully").send(res);
  } catch (error) {
    console.error("Update Event Error:", error);
    return ApiResponse.internalServerError("ISE-UPDATE").send(res);
  }
};

const deleteEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    if (!eventId) return ApiResponse.badRequest("Event ID is missing").send(res);

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return ApiResponse.badRequest("Invalid event ID").send(res);
    }

    const event = await Event.findById(eventId);
    if (!event) return ApiResponse.notFound("Event not found").send(res);
    
    // Auth check
    const organizerId = event.organizer ? event.organizer.toString() : null;
    const requestingUserId = req.userId ? req.userId.toString() : null;

    if (organizerId !== requestingUserId && req.userRole !== "admin") {
      return ApiResponse.forbidden("Access denied").send(res);
    }

    // Simplified deletion sequence
    try {
      if (typeof Booking !== 'undefined') await Booking.deleteMany({ event: eventId });
      if (typeof Registration !== 'undefined') await Registration.deleteMany({ event: eventId });
      if (typeof Notification !== 'undefined') await Notification.deleteMany({ relatedEvent: eventId });
    } catch (e) { 
      console.warn("[BACKEND] Purge warning:", e.message); 
    }

    await Event.findByIdAndDelete(eventId);
    return ApiResponse.success(null, "Event deleted successfully").send(res);

  } catch (error) {
    console.error("[BACKEND] FATAL DELETE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error during deletion: " + error.message,
      data: null
    });
  }
};

const getMyEvents = async (req, res) => {
  try {
    console.log("[DEBUG] getMyEvents for User:", req.userId);
    const events = await Event.find({ organizer: req.userId })
      .populate("venue", "name location")
      .sort({ createdAt: -1 });
    
    const eventsWithRequests = await Promise.all(
      events.map(async (event) => {
        const certificateRequestCount = await Registration.countDocuments({ 
          event: event._id, 
          certificateRequested: true 
        });
        return { ...event.toObject(), certificateRequestCount };
      })
    );

    console.log("[DEBUG] Found events count:", eventsWithRequests.length);
    return ApiResponse.success({ events: eventsWithRequests }, "Your events loaded").send(res);
  } catch (error) {
    console.error("[DEBUG] getMyEvents Error:", error);
    return ApiResponse.internalServerError("ISE-MY").send(res);
  }
};

const getPendingEvents = async (req, res) => {
  try {
    const events = await Event.find({ status: "pending" })
      .populate("organizer", "firstName lastName organizationName email")
      .populate("venue", "name location capacity")
      .sort({ createdAt: -1 });
    return ApiResponse.success(events, "Pending events loaded").send(res);
  } catch (error) {
    return ApiResponse.internalServerError("ISE-PENDING").send(res);
  }
};

const reviewEvent = async (req, res) => {
  try {
    const { status, remarks } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      return ApiResponse.badRequest("Invalid status").send(res);
    }

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { status, adminRemarks: remarks || "" },
      { new: true }
    ).populate("organizer", "firstName lastName email");
    if (!event) return ApiResponse.notFound("Event not found").send(res);

    if (status === "approved") {
      await Booking.updateMany({ event: event._id }, { status: "confirmed" });
    } else {
      await Booking.updateMany({ event: event._id }, { status: "cancelled" });
    }

    const notification = await Notification.create({
      user: event.organizer._id,
      title: `Event ${status}`,
      message: `Your event "${event.title}" has been ${status}. ${remarks || ""}`,
      type: "approval",
      relatedEvent: event._id,
    });

    const io = req.app.get("io");
    if (io) {
      io.to(event.organizer._id.toString()).emit("notification", notification);
    }

    return ApiResponse.success(event, `Event ${status}`).send(res);
  } catch (error) {
    return ApiResponse.internalServerError("ISE-REVIEW").send(res);
  }
};

const getRecommendedEvents = async (req, res) => {
  try {
    const User = require("../models/User");
    const Registration = require("../models/Registration");
    const user = await User.findById(req.userId);
    if (!user) return ApiResponse.notFound("User not found").send(res);

    const pastRegs = await Registration.find({ student: req.userId }).populate("event", "category tags department");
    const categories = pastRegs.map((r) => r.event?.category).filter(Boolean);

    let query = { status: "approved", date: { $gte: new Date() } };
    if (categories.length > 0 || (user.interests && user.interests.length > 0)) {
      const interests = [...new Set([...categories, ...(user.interests || [])])];
      query.$or = [{ category: { $in: interests } }, { department: user.department }];
    }

    const events = await Event.find(query)
      .populate("organizer", "firstName lastName organizationName profile")
      .populate("venue", "name location")
      .sort({ date: 1 })
      .limit(10);
    return ApiResponse.success(events, "Recommended events").send(res);
  } catch (error) {
    return ApiResponse.internalServerError("ISE-REC").send(res);
  }
};

const getAdminEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .populate("organizer", "firstName lastName organizationName email")
      .populate("venue", "name location capacity")
      .sort({ createdAt: -1 });

    const eventsWithCounts = await Promise.all(
      events.map(async (event) => {
        const registrationCount = await Registration.countDocuments({ event: event._id });
        const certificateCount = await Certificate.countDocuments({ event: event._id });
        return {
          ...event.toObject(),
          registrationCount,
          certificateCount,
        };
      })
    );

    return ApiResponse.success(eventsWithCounts, "All system events loaded").send(res);
  } catch (error) {
    return ApiResponse.internalServerError("ISE-ADMIN-ALL").send(res);
  }
};

module.exports = {
  getAllEvents, getEventById, createEvent, updateEvent, deleteEvent,
  getMyEvents, getPendingEvents, reviewEvent, getRecommendedEvents, getAdminEvents,
};