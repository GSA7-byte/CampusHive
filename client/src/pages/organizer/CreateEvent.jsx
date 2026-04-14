import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiPlus, FiImage, FiCalendar, FiClock, FiMapPin, FiTag, FiUsers, FiDollarSign, FiCheck, FiInfo, FiArrowLeft } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import API from "../../api/axios";
import OrganizerNavbar from "../../components/common/OrganizerNavbar";

const CreateEvent = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "technical",
    date: "",
    startTime: "",
    endTime: "",
    venue: { name: "", address: "", coordinates: [20.2961, 85.8245] },
    maxParticipants: "",
    isPaid: false,
    price: "",
    providesCertificate: false,
    banner: null,
  });
  const [bannerPreview, setBannerPreview] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (name === "banner") {
      const file = files[0];
      if (file) {
        setFormData({ ...formData, banner: file });
        setBannerPreview(URL.createObjectURL(file));
      }
    } else if (name.startsWith("venue.")) {
      const field = name.split(".")[1];
      setFormData({ ...formData, venue: { ...formData.venue, [field]: value } });
    } else {
      setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const dataToSend = new FormData();
    Object.keys(formData).forEach((key) => {
      if (key === "venue") {
        dataToSend.append(key, JSON.stringify(formData[key]));
      } else if (key === "banner") {
        if (formData[key]) dataToSend.append("banner", formData[key]);
      } else if (formData[key] !== null && formData[key] !== undefined) {
        dataToSend.append(key, formData[key]);
      }
    });

    try {
      // Using /events (POST) which matched eventRoutes.js line 17
      const { data } = await API.post("/events", dataToSend, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (data.success) {
        toast.success("Event submitted for approval! 🚀");
        navigate("/organizer/my-events");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create event");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium text-gray-800 dark:text-slate-200 placeholder:text-gray-400 dark:placeholder:text-slate-500";
  const labelClass = "block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-slate-500 mb-2.5 ml-1";
  const iconClass = "material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 group-focus-within:text-primary dark:group-focus-within:text-blue-400 transition-colors text-xl";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 font-display text-gray-800 dark:text-slate-200 flex flex-col transition-colors">
      <OrganizerNavbar />

      <main className="flex-grow max-w-[900px] w-full mx-auto px-4 sm:px-8 py-10 md:py-16">
        <button onClick={() => navigate(-1)} className="group flex items-center gap-2 text-gray-400 hover:text-primary font-bold text-[10px] uppercase tracking-widest mb-10 transition-all">
          <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Dashboard
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 sm:p-12 border border-gray-100 dark:border-slate-800 shadow-xl shadow-blue-500/5 transition-colors">
          
          <div className="mb-12">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Create <span className="text-primary italic">Event</span></h2>
            <p className="text-gray-500 dark:text-slate-400 font-medium text-sm mt-1">Host an experience and connect with the campus community.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10">
             {/* Banner Upload */}
             <div className="space-y-4">
               <label className={labelClass}>Event Banner</label>
               <div className="group relative w-full aspect-[21/9] rounded-[2rem] overflow-hidden border-2 border-dashed border-gray-200 dark:border-slate-700 hover:border-primary transition-all bg-gray-50/50 dark:bg-slate-800/50 flex flex-col items-center justify-center cursor-pointer">
                  {bannerPreview ? (
                    <>
                      <img src={bannerPreview} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <span className="text-white font-black text-[10px] uppercase tracking-widest bg-primary px-4 py-2 rounded-full pointer-events-none">Change Image</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setFormData({ ...formData, banner: null });
                          setBannerPreview(null);
                        }}
                        className="absolute top-4 right-4 bg-white/90 hover:bg-red-50 text-red-500 hover:text-red-600 size-10 rounded-full flex items-center justify-center shadow-lg transition-all z-10"
                        title="Remove Image"
                      >
                        <span className="material-symbols-outlined font-black">close</span>
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-gray-400 group-hover:text-primary transition-colors">
                       <span className="material-symbols-outlined text-4xl">add_photo_alternate</span>
                       <span className="text-[10px] font-black uppercase tracking-widest">Click to upload banner</span>
                    </div>
                  )}
                  <input type="file" name="banner" accept="image/*" onChange={handleChange} className="absolute inset-0 opacity-0 cursor-pointer" />
               </div>
               {!bannerPreview && (
                  <div className="flex items-center gap-2 p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                    <FiInfo className="text-primary text-sm" />
                    <p className="text-[10px] text-gray-500 font-medium italic">If no banner is uploaded, a stylized fallback with the event name will be used.</p>
                  </div>
               )}
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className={labelClass}>Event Title</label>
                  <div className="relative group">
                    <span className={iconClass}>title</span>
                    <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Annual Tech Symposium" required className={inputClass} />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className={labelClass}>Category</label>
                  <div className="relative">
                    <select name="category" value={formData.category} onChange={handleChange} className="w-full pl-4 pr-10 py-3.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-bold text-gray-800 dark:text-slate-200 appearance-none">
                       <option value="technical">Technical</option>
                       <option value="cultural">Cultural</option>
                       <option value="sports">Sports</option>
                       <option value="workshop">Workshop</option>
                       <option value="other">Other</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">expand_more</span>
                  </div>
                </div>
             </div>

             <div className="space-y-3">
               <label className={labelClass}>Description Brief</label>
               <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Tell students what to expect..." required
                 className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-[2rem] p-6 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-gray-800 dark:text-slate-200 min-h-[140px] resize-none" />
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                <div className="space-y-3">
                  <label className={labelClass}>Event Date</label>
                  <div className="relative group">
                    <span className={iconClass}>calendar_today</span>
                    <input type="date" name="date" value={formData.date} onChange={handleChange} required className={inputClass} />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className={labelClass}>Start Time</label>
                  <div className="relative group">
                    <span className={iconClass}>schedule</span>
                    <input type="time" name="startTime" value={formData.startTime} onChange={handleChange} required className={inputClass} />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className={labelClass}>End Time</label>
                  <div className="relative group">
                    <span className={iconClass}>schedule</span>
                    <input type="time" name="endTime" value={formData.endTime} onChange={handleChange} required className={inputClass} />
                  </div>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className={labelClass}>Venue Name</label>
                  <div className="relative group">
                    <span className={iconClass}>location_on</span>
                    <input type="text" name="venue.name" value={formData.venue.name} onChange={handleChange} placeholder="e.g. Auditorium B" required className={inputClass} />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className={labelClass}>Max Capacity</label>
                  <div className="relative group">
                    <span className={iconClass}>groups</span>
                    <input type="number" name="maxParticipants" value={formData.maxParticipants} onChange={handleChange} placeholder="e.g. 200" required className={inputClass} />
                  </div>
                </div>
             </div>

             <div className="bg-gray-50 dark:bg-slate-800/50 p-6 sm:p-8 rounded-[2rem] border border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-6">
                <div className="flex items-center gap-4 flex-grow">
                   <div className="size-12 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center text-primary dark:text-blue-400 border border-gray-200 dark:border-slate-700 shadow-sm shrink-0">
                      <FiDollarSign className="text-xl" />
                   </div>
                   <div>
                      <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest leading-none">Registration Fee</h4>
                      <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold mt-1 uppercase tracking-wider">Is this a paid entry event?</p>
                   </div>
                </div>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input type="checkbox" name="isPaid" checked={formData.isPaid} onChange={handleChange} className="size-5 rounded-lg border-gray-300 dark:border-slate-600 text-primary dark:text-blue-500 focus:ring-primary/20 bg-white dark:bg-slate-800" />
                    <span className="text-sm font-black uppercase tracking-widest text-gray-700 dark:text-slate-300">Yes, Paid</span>
                  </label>
                  <AnimatePresence>
                    {formData.isPaid && (
                      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-32 relative">
                         <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black text-sm">₹</span>
                         <input type="number" name="price" value={formData.price} onChange={handleChange} placeholder="Amt" className="w-full pl-8 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm font-black text-gray-900 dark:text-white" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
             </div>

             <div className="bg-gray-50 dark:bg-slate-800/50 p-6 sm:p-8 rounded-[2rem] border border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-6">
                <div className="flex items-center gap-4 flex-grow">
                   <div className="size-12 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center text-amber-500 dark:text-amber-400 border border-gray-200 dark:border-slate-700 shadow-sm shrink-0">
                      <span className="material-symbols-outlined text-xl">workspace_premium</span>
                   </div>
                   <div>
                      <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest leading-none">Certifications</h4>
                      <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold mt-1 uppercase tracking-wider">Will attendees get certificates?</p>
                   </div>
                </div>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input type="checkbox" name="providesCertificate" checked={formData.providesCertificate} onChange={handleChange} className="size-5 rounded-lg border-gray-300 dark:border-slate-600 text-amber-500 focus:ring-amber-500/20 bg-white dark:bg-slate-800" />
                    <span className="text-sm font-black uppercase tracking-widest text-gray-700 dark:text-slate-300">Certificate-based event</span>
                  </label>
                </div>
             </div>

             <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30 flex items-start gap-4">
                <FiInfo className="text-primary dark:text-blue-400 text-xl shrink-0 mt-0.5" />
                <p className="text-[11px] text-gray-500 dark:text-slate-400 font-medium leading-relaxed">
                  Your event will be reviewed by the admin team. Once approved, it will be visible to all students on the platform. You can track registrations from your dashboard.
                </p>
             </div>

             <button type="submit" disabled={loading}
               className="w-full bg-primary hover:bg-primary-dark text-white p-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 mt-10">
                {loading ? <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Submit for Approval <FiCheck className="text-lg" /></>}
             </button>
          </form>
        </motion.div>
      </main>
    </div>
  );
};

export default CreateEvent;