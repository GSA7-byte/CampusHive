import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiMessageSquare, FiStar, FiCheck, FiInfo } from "react-icons/fi";
import { motion } from "framer-motion";
import API from "../../api/axios";
import Navbar from "../../components/common/Navbar";
import toast from "react-hot-toast";

const Feedback = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [event, setEvent] = useState(null);
  const [formData, setFormData] = useState({
    rating: 5,
    comment: "",
  });

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      const { data } = await API.get(`/events/${id}`);
      if (data.success) setEvent(data.data);
    } catch (error) {
      toast.error("Event not found");
      navigate("/my-registrations");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await API.post("/feedback", { ...formData, eventId: id });
      if (data.success) {
        toast.success("Thank you for your feedback! ✨");
        navigate("/my-registrations");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit feedback");
    } finally {
      setLoading(false);
    }
  };

  if (!event) return null;

  return (
    <div className="min-h-screen bg-gray-50 font-display text-gray-800 flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-[600px] w-full mx-auto px-4 sm:px-8 py-10 md:py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] p-8 sm:p-12 border border-gray-100 shadow-xl shadow-blue-500/5 relative overflow-hidden">
          
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full translate-x-1/2 -translate-y-1/2" />
          
          <div className="text-center mb-10 relative z-10">
            <div className="w-20 h-20 bg-blue-50 text-primary border border-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
               <FiMessageSquare className="text-4xl" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">How was the <span className="text-primary italic">Event?</span></h2>
            <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-2">{event.title}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10 relative z-10">
            <div className="text-center">
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6">Rate your experience</label>
              <div className="flex justify-center gap-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} type="button" onClick={() => setFormData({...formData, rating: star})}
                    className={`size-12 rounded-2xl flex items-center justify-center transition-all ${formData.rating >= star ? "bg-amber-50 text-amber-500 shadow-sm border border-amber-100 scale-110" : "bg-gray-50 text-gray-200 hover:text-gray-300"}`}>
                    <FiStar className={`text-2xl ${formData.rating >= star ? "fill-current" : ""}`} />
                  </button>
                ))}
              </div>
              <p className="mt-4 text-xs font-bold text-amber-600 uppercase tracking-widest">
                {formData.rating === 1 && "Poor"}
                {formData.rating === 2 && "Fair"}
                {formData.rating === 3 && "Good"}
                {formData.rating === 4 && "Great"}
                {formData.rating === 5 && "Excellent"}
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Your Narrative</label>
              <textarea
                value={formData.comment}
                onChange={(e) => setFormData({...formData, comment: e.target.value})}
                placeholder="Share your thoughts, suggestions, or highlights..."
                required
                className="w-full bg-gray-50 border border-gray-100 rounded-3xl p-6 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-gray-800 min-h-[160px] resize-none"
              />
            </div>

            <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-start gap-4">
               <FiInfo className="text-primary text-xl shrink-0 mt-0.5" />
               <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                 Your feedback is shared with the event organization committee to help improve future campus experiences. It remains anonymous to other students.
               </p>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark text-white p-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50">
               {loading ? <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Relay Feedback <FiCheck className="text-lg" /></>}
            </button>
          </form>
        </motion.div>
      </main>
    </div>
  );
};

export default Feedback;