const Notification = require("../models/Notification");
const ApiResponse = require("../utils/ApiResponse");

const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.userId })
      .populate("relatedEvent", "title date")
      .sort({ createdAt: -1 }).limit(50);
    return ApiResponse.success(notifications, "Notifications loaded").send(res);
  } catch (error) {
    return ApiResponse.internalServerError().send(res);
  }
};

const markAsRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    return ApiResponse.success(null, "Marked as read").send(res);
  } catch (error) {
    return ApiResponse.internalServerError().send(res);
  }
};

const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.userId, isRead: false }, { isRead: true });
    return ApiResponse.success(null, "All marked as read").send(res);
  } catch (error) {
    return ApiResponse.internalServerError().send(res);
  }
};

const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!notification) {
      return ApiResponse.notFound("Notification not found").send(res);
    }
    return ApiResponse.success(null, "Notification deleted").send(res);
  } catch (error) {
    return ApiResponse.internalServerError().send(res);
  }
};

module.exports = { getMyNotifications, markAsRead, markAllAsRead, deleteNotification };