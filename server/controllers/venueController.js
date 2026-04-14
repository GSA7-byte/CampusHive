const Venue = require("../models/Venue");
const Booking = require("../models/Booking");
const ApiResponse = require("../utils/ApiResponse");

const getAllVenues = async (req, res) => {
  try {
    const { type, search } = req.query;
    let query = {};
    if (type) query.type = type;
    if (search) query.name = { $regex: search, $options: "i" };
    const venues = await Venue.find(query).sort({ name: 1 });
    return ApiResponse.success(venues, "Venues loaded").send(res);
  } catch (error) {
    return ApiResponse.internalServerError().send(res);
  }
};

const getVenueAvailability = async (req, res) => {
  try {
    const { venueId, date } = req.query;
    const bookings = await Booking.find({
      venue: venueId,
      date: new Date(date),
      status: { $ne: "cancelled" },
    }).populate("event", "title startTime endTime");
    return ApiResponse.success(bookings, "Bookings loaded").send(res);
  } catch (error) {
    return ApiResponse.internalServerError().send(res);
  }
};

const createVenue = async (req, res) => {
  try {
    const existing = await Venue.findOne({ name: req.body.name });
    if (existing) return ApiResponse.conflict("Venue already exists").send(res);
    const venueData = { ...req.body };
    if (req.file) venueData.image = req.file.filename;
    const venue = await Venue.create(venueData);
    return ApiResponse.created(venue, "Venue created").send(res);
  } catch (error) {
    return ApiResponse.internalServerError().send(res);
  }
};

const updateVenue = async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.file) updateData.image = req.file.filename;
    const venue = await Venue.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!venue) return ApiResponse.notFound("Venue not found").send(res);
    return ApiResponse.success(venue, "Venue updated").send(res);
  } catch (error) {
    return ApiResponse.internalServerError().send(res);
  }
};

const deleteVenue = async (req, res) => {
  try {
    const venue = await Venue.findByIdAndDelete(req.params.id);
    if (!venue) return ApiResponse.notFound("Venue not found").send(res);
    return ApiResponse.success(null, "Venue deleted").send(res);
  } catch (error) {
    return ApiResponse.internalServerError().send(res);
  }
};

module.exports = { getAllVenues, getVenueAvailability, createVenue, updateVenue, deleteVenue };