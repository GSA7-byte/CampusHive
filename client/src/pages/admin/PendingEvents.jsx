import { useState, useEffect } from "react";
import { FiCheck, FiX, FiEye, FiClock, FiCalendar, FiMapPin, FiUser, FiArrowLeft, FiSearch, FiInfo } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import API from "../../api/axios";
import AdminNavbar from "../../components/common/AdminNavbar";
import EventBanner from "../../components/common/EventBanner";

const PendingEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchPendingEvents();
  }, []);

  const fetchPendingEvents = async () => {
    try {
      const { data } = await API.get("/events/pending");
      if (data.success) setEvents(data.data);
    } catch (error) {
      toast.error("Failed to fetch pending events");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    try {
      const status = action === 'approve' ? 'approved' : 'rejected';
      const { data } = await API.patch(`/events/${id}/review`, { status });
      if (data.success) {
        toast.success(`Event ${action}ed successfully`);
        setEvents(events.filter(e => e._id !== id));
      }
    } catch (error) {
      toast.error("Action failed");
    }
  };

  const filteredEvents = events.filter(e => 
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.organizer?.firstName.toLowerCase().includes(search.toLowerCase()) ||
    e.organizer?.lastName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 font-display text-gray-800 dark:text-slate-200 flex flex-col transition-colors">
      <AdminNavbar />

      <main className="flex-grow max-w-[1240px] w-full mx-auto px-4 sm:px-8 py-10">
        <div className="mb-10">
          <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Review <span className="text-primary italic">Queue</span></h2>
          <p className="text-gray-500 dark:text-slate-400 font-medium text-sm mt-1">Moderate incoming event submissions for campus quality standards.</p>
        </div>

        {/* Filter Bar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm mb-8 flex flex-col sm:flex-row gap-4 transition-colors">
           <div className="relative flex-grow group">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary dark:group-focus-within:text-blue-400 transition-colors" />
              <input type="text" placeholder="Search by title or organizer name..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-slate-800 border border-gray-50 dark:border-slate-700 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all dark:text-white dark:placeholder:text-slate-500" />
           </div>
           <div className="px-6 py-3.5 bg-blue-50 dark:bg-blue-900/20 text-primary dark:text-blue-400 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-blue-100 dark:border-blue-900/30 flex items-center gap-2">
              <FiClock className="animate-pulse" /> {events.length} Pending
           </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-24">
             <div className="w-10 h-10 border-2 border-gray-200 dark:border-slate-800 border-t-primary rounded-full animate-spin mb-4" />
             <p className="text-gray-400 dark:text-slate-500 font-bold uppercase tracking-widest text-[9px]">Analyzing Submissions...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col items-center transition-colors">
             <div className="size-16 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-6">
                <FiCheck className="text-4xl" />
             </div>
             <p className="text-gray-400 dark:text-slate-500 font-bold text-lg">Queue Clear</p>
             <p className="text-gray-400 dark:text-slate-600 text-[10px] font-bold uppercase tracking-widest mt-1">No pending events requiring review</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence>
              {filteredEvents.map((event, idx) => (
                <motion.div key={event._id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-blue-100 dark:hover:border-blue-900 transition-all flex flex-col overflow-hidden group">
                  
                  <div className="relative h-44 bg-gray-50 dark:bg-slate-800 overflow-hidden shrink-0">
                    <EventBanner 
                      banner={event.banner} 
                      title={event.title} 
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute top-4 left-4">
                       <span className="bg-white/95 dark:bg-slate-900/95 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-primary dark:text-blue-400 shadow-lg border border-gray-100 dark:border-slate-800 transition-colors">
                         {event.category}
                       </span>
                    </div>
                  </div>

                  <div className="p-6 flex flex-col flex-grow">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4 line-clamp-1 group-hover:text-primary dark:group-hover:text-blue-400 transition-colors">
                      {event.title}
                    </h3>

                    <div className="space-y-3 mb-8">
                       <div className="flex items-center gap-3 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.15em]">
                          <FiUser className="text-primary dark:text-blue-400" /> {event.organizer?.firstName} {event.organizer?.lastName}
                       </div>
                       <div className="flex items-center gap-3 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.15em]">
                          <FiCalendar className="text-primary dark:text-blue-400" /> {new Date(event.date).toLocaleDateString()}
                       </div>
                       <div className="flex items-center gap-3 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.15em]">
                          <FiMapPin className="text-primary dark:text-blue-400" /> {event.venue?.name}
                       </div>
                    </div>

                    <div className="mt-auto grid grid-cols-2 gap-3 pt-6 border-t border-gray-50 dark:border-slate-800">
                       <button onClick={() => handleAction(event._id, 'approve')} className="flex items-center justify-center gap-2 py-3 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-500 hover:text-white text-emerald-600 dark:text-emerald-400 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all border border-emerald-100/50 dark:border-emerald-900/30">
                          <FiCheck /> Approve
                       </button>
                       <button onClick={() => handleAction(event._id, 'reject')} className="flex items-center justify-center gap-2 py-3 bg-red-50 dark:bg-red-900/20 hover:bg-red-500 hover:text-white text-red-500 dark:text-red-400 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all border border-red-100/50 dark:border-red-900/30">
                          <FiX /> Reject
                       </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
};

export default PendingEvents;