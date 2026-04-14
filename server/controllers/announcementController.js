const Announcement = require("../models/Announcement");
const ApiResponse = require("../utils/ApiResponse");

const getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .populate("createdBy", "firstName lastName")
      .sort({ isPinned: -1, createdAt: -1 });
    return ApiResponse.success(announcements, "Announcements loaded").send(res);
  } catch (error) {
    return ApiResponse.internalServerError().send(res);
  }
};

const createAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.create({ ...req.body, createdBy: req.userId });
    return ApiResponse.created(announcement, "Announcement created").send(res);
  } catch (error) {
    return ApiResponse.internalServerError().send(res);
  }
};

const updateAnnouncement = async (req, res) => {
  try {
    const a = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!a) return ApiResponse.notFound("Not found").send(res);
    return ApiResponse.success(a, "Updated").send(res);
  } catch (error) {
    return ApiResponse.internalServerError().send(res);
  }
};

const deleteAnnouncement = async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    return ApiResponse.success(null, "Deleted").send(res);
  } catch (error) {
    return ApiResponse.internalServerError().send(res);
  }
};

module.exports = { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement };