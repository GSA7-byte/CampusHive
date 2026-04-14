import { useState, useEffect } from "react";
import { FiPlus, FiTrash2, FiClock, FiCheck, FiX, FiInfo, FiArrowLeft, FiBell } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import API from "../../api/axios";
import AdminNavbar from "../../components/common/AdminNavbar";

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ title: "", message: "", type: "general" });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const { data } = await API.get("/announcements");
      if (data.success) setAnnouncements(data.data);
    } catch (error) {
      toast.error("Failed to fetch broadcast history");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await API.post("/announcements", formData);
      if (data.success) {
        toast.success("Broadcast successful! 📢");
        setShowModal(false);
        setFormData({ title: "", message: "", type: "general" });
        fetchAnnouncements();
      }
    } catch (error) {
       toast.error("Broadcast failed");
    }
  };

  const deleteAnnouncement = async (id) => {
    try {
      await API.delete(`/announcements/${id}`);
      setAnnouncements(announcements.filter(a => a._id !== id));
      toast.success("Broadcast removed");
    } catch (error) {
      toast.error("Failed to remove");
    }
  };

  const getTypeStyles = (type) => {
    switch (type) {
      case 'urgent': return "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/30";
      case 'event': return "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/30";
      default: return "bg-blue-50 dark:bg-blue-900/20 text-primary dark:text-blue-400 border-blue-100 dark:border-blue-900/30";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 font-display text-gray-800 dark:text-slate-200 flex flex-col transition-colors">
      <AdminNavbar />

      <main className="flex-grow max-w-[900px] w-full mx-auto px-4 sm:px-8 py-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
          <div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Active <span className="text-primary italic">Broadcasts</span></h2>
            <p className="text-gray-500 dark:text-slate-400 font-medium text-sm mt-1">Push important updates and news to the entire campus.</p>
          </div>
          <button onClick={() => setShowModal(true)} className="bg-primary dark:bg-blue-600 hover:bg-primary-dark dark:hover:bg-blue-700 text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-primary/20 dark:shadow-blue-900/20 flex items-center gap-2 active:scale-95">
             <FiPlus /> New Broadcast
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-24">
             <div className="w-10 h-10 border-2 border-gray-200 dark:border-slate-800 border-t-primary rounded-full animate-spin mb-4" />
             <p className="text-gray-400 dark:text-slate-500 font-bold uppercase tracking-widest text-[9px]">Analyzing History...</p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col items-center transition-colors">
             <div className="size-16 bg-blue-50 dark:bg-blue-900/20 text-primary dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6">
                <FiBell className="text-4xl" />
             </div>
             <p className="text-gray-400 dark:text-slate-500 font-bold text-lg">Silence on the air</p>
             <p className="text-gray-400 dark:text-slate-600 text-[10px] font-bold uppercase tracking-widest mt-1">No past announcements found</p>
          </div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence>
              {announcements.map((a, idx) => (
                <motion.div key={a._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-blue-100 dark:hover:border-blue-900 transition-all flex flex-col sm:flex-row gap-8 items-start relative group">
                  
                  <div className={`size-14 rounded-2xl flex items-center justify-center shrink-0 border text-2xl ${getTypeStyles(a.type)}`}>
                     <FiBell />
                  </div>

                  <div className="flex-grow">
                     <div className="flex justify-between items-start mb-2">
                        <h4 className="font-black text-lg text-gray-900 dark:text-white leading-tight">{a.title}</h4>
                        <span className="text-[9px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5 shrink-0 bg-gray-50 dark:bg-slate-800 px-2 py-1 rounded-lg border dark:border-slate-700 transition-colors">
                           <FiClock /> {new Date(a.createdAt).toLocaleDateString()}
                        </span>
                     </div>
                     <p className="text-xs font-medium text-gray-500 dark:text-slate-400 leading-relaxed mb-6">{a.message}</p>
                     
                     <div className="flex items-center gap-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${getTypeStyles(a.type)}`}>
                           {a.type} Broadcast
                        </span>
                        <button onClick={() => deleteAnnouncement(a._id)} className="text-[8px] font-black uppercase tracking-[0.2em] text-red-400 hover:text-red-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           <FiTrash2 /> Remove from history
                        </button>
                     </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Create Modal */}
        <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-gray-900/60 dark:bg-slate-950/80 backdrop-blur-sm" />
              <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] p-8 sm:p-10 shadow-2xl relative z-10 border border-gray-100 dark:border-slate-800 transition-colors">
                
                <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight mb-8 flex items-center gap-3">
                   Create <span className="text-primary dark:text-blue-400 italic">Broadcast</span>
                </h3>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                       <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-slate-500 ml-1">Urgency Preference</label>
                       <div className="grid grid-cols-3 gap-3">
                          {["general", "event", "urgent"].map(type => (
                            <button key={type} type="button" onClick={() => setFormData({...formData, type})}
                              className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${formData.type === type ? getTypeStyles(type) : "bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-slate-500 border-gray-100 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700"}`}>
                              {type}
                            </button>
                          ))}
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-slate-500 ml-1">Broadcast Title</label>
                       <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="e.g. Schedule Update" required
                         className="w-full px-5 py-3.5 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all dark:text-white dark:placeholder:text-slate-500" />
                    </div>

                    <div className="space-y-2">
                       <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-slate-500 ml-1">Narrative Message</label>
                       <textarea value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} placeholder="Express the news..." required
                         className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-[2rem] text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all min-h-[120px] resize-none dark:text-slate-200 dark:placeholder:text-slate-500" />
                    </div>

                   <div className="pt-6 flex gap-4">
                      <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all border dark:border-slate-700">Cancel</button>
                      <button type="submit" className="flex-1 py-4 bg-primary dark:bg-blue-600 hover:bg-primary-dark dark:hover:bg-blue-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-primary/20 dark:shadow-blue-900/20 transition-all flex items-center justify-center gap-2">
                         <FiBell /> Broadcast
                      </button>
                   </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Announcements;