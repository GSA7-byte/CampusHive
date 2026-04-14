const Feedback = require("../models/Feedback");
const Registration = require("../models/Registration");
const ApiResponse = require("../utils/ApiResponse");

const submitFeedback = async (req, res) => {
  try {
    const { eventId, rating, comment } = req.body;
    const reg = await Registration.findOne({ student: req.userId, event: eventId, status: "attended" });
    if (!reg) return ApiResponse.badRequest("Must attend event first").send(res);

    const feedback = await Feedback.create({ student: req.userId, event: eventId, rating, comment });
    return ApiResponse.created(feedback, "Feedback submitted").send(res);
  } catch (error) {
    if (error.code === 11000) return ApiResponse.conflict("Already submitted").send(res);
    return ApiResponse.internalServerError().send(res);
  }
};

const getEventFeedback = async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ event: req.params.eventId })
      .populate("student", "firstName lastName profile").sort({ createdAt: -1 });
    const avgRating = feedbacks.length > 0 ? feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length : 0;
    return ApiResponse.success({ feedbacks, avgRating, total: feedbacks.length }, "Feedback loaded").send(res);
  } catch (error) {
    return ApiResponse.internalServerError().send(res);
  }
};

module.exports = { submitFeedback, getEventFeedback };