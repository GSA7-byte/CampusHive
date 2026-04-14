const Event = require("../models/Event");
const Registration = require("../models/Registration");
const User = require("../models/User");
const ApiResponse = require("../utils/ApiResponse");

const getDashboardAnalytics = async (req, res) => {
  try {
    const totalEvents = await Event.countDocuments();
    const approvedEvents = await Event.countDocuments({ status: "approved" });
    const pendingEvents = await Event.countDocuments({ status: "pending" });
    const totalStudents = await User.countDocuments({ role: "student" });
    const totalOrganizers = await User.countDocuments({ role: "organizer" });
    const totalRegistrations = await Registration.countDocuments();

    const eventsByCategory = await Event.aggregate([
      { $match: { status: "approved" } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const topDepartments = await Event.aggregate([
      { $match: { status: "approved", department: { $ne: null } } },
      { $group: { _id: "$department", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    return ApiResponse.success({
      totalEvents, approvedEvents, pendingEvents,
      totalStudents, totalOrganizers, totalRegistrations,
      eventsByCategory, topDepartments,
    }, "Analytics loaded").send(res);
  } catch (error) {
    return ApiResponse.internalServerError().send(res);
  }
};

const getOrganizerStats = async (req, res) => {
  try {
    console.log("[DEBUG] getOrganizerStats for User:", req.userId);
    const totalEvents = await Event.countDocuments({ organizer: req.userId });
    const liveEvents = await Event.countDocuments({ organizer: req.userId, status: "approved" });
    const pendingEvents = await Event.countDocuments({ organizer: req.userId, status: "pending" });
    
    // Count registrations for all events owned by this organizer
    const events = await Event.find({ organizer: req.userId }).select("_id");
    const eventIds = events.map(e => e._id);
    const totalRegistrations = await Registration.countDocuments({ event: { $in: eventIds } });

    console.log("[DEBUG] Stats found:", { totalEvents, liveEvents, pendingEvents, totalRegistrations });

    return ApiResponse.success({
      totalEvents,
      liveEvents,
      pendingEvents,
      totalRegistrations
    }, "Organizer stats loaded").send(res);
  } catch (error) {
    console.error("[DEBUG] Organizer Stats Error:", error);
    return ApiResponse.internalServerError("ISE-ORG-STATS").send(res);
  }
};

module.exports = { getDashboardAnalytics, getOrganizerStats };