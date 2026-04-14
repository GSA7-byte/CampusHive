import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FiEdit2, FiTrash2, FiUsers, FiEye, FiCheckCircle, FiClock, FiXCircle, FiCalendar, FiMapPin, FiArrowLeft, FiSearch } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import API from "../../api/axios";
import OrganizerNavbar from "../../components/common/OrganizerNavbar";
import EventBanner from "../../components/common/EventBanner";

const MyEvents = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [confirmingId, setConfirmingId] = useState(null);

  // Sync search state when URL param changes (e.g. navigating from navbar)
  useEffect(() => {
    setSearch(searchParams.get("search") || "");
    setStatusFilter(searchParams.get("status") || "all");
  }, [searchParams]);

  useEffect(() => {
    fetchMyEvents();
  }, []);

  const fetchMyEvents = async () => {
    try {
      const { data } = await API.get("/events/my-events");
      console.log("[MyEvents] API response:", data);
      if (data.success) {
        setEvents(data.data?.events || []);
      } else {
        console.warn("[MyEvents] Unexpected response:", data);
        toast.error("Could not load events");
      }
    } catch (error) {
      console.error("[MyEvents] Fetch error:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Failed to fetch your events");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id) => {
    if (confirmingId === id) {
      deleteEvent(id);
    } else {
      setConfirmingId(id);
      // Auto-reset after 3 seconds
      setTimeout(() => setConfirmingId(null), 3000);
    }
  };

  const deleteEvent = async (id) => {
    try {
      const { data } = await API.delete(`/events/${id}`);
      if (data.success) {
        toast.success("Event deleted");
        setEvents(prev => prev.filter(e => e._id !== id));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete event");
    } finally {
      setConfirmingId(null);
    }
  };

  const filteredEvents = events.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(search.toLowerCase()) || 
                          e.category.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 font-display text-gray-800 dark:text-slate-200 flex flex-col transition-colors">
      <OrganizerNavbar />

      <main className="flex-grow max-w-[1240px] w-full mx-auto px-4 sm:px-8 py-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
          <div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Hosted <span className="text-primary italic">Events</span></h2>
            <p className="text-gray-500 dark:text-slate-400 font-medium text-sm mt-1">Archive and live status of your campus contributions.</p>
          </div>
          <Link to="/organizer/create-event" className="bg-primary hover:bg-primary-dark text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-primary/20 flex items-center gap-2 active:scale-95">
             <FiEdit2 className="text-base" /> Launch New Event
          </Link>
        </div>

        {/* Search Bar */}
        <div className="max-w-md mb-8 group relative">
           <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">search</span>
           <input
             type="text"
             placeholder="Search by title or category..."
             value={search}
             onChange={(e) => {
               setSearch(e.target.value);
               if (e.target.value) {
                 setSearchParams({ search: e.target.value });
               } else {
                 setSearchParams({});
               }
             }}
             className="w-full bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm dark:text-white"
           />
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-24">
             <div className="w-10 h-10 border-2 border-gray-200 border-t-primary rounded-full animate-spin mb-4" />
             <p className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Analyzing Logs...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col items-center transition-colors">
             <div className="w-16 h-16 bg-gray-50 dark:bg-slate-800 text-gray-300 dark:text-slate-700 rounded-2xl flex items-center justify-center mb-6">
                <FiCalendar className="text-4xl" />
             </div>
             <p className="text-gray-400 dark:text-slate-500 font-bold text-lg">Empty Record</p>
             <p className="text-gray-400 dark:text-slate-600 text-sm mt-1 mb-10">You haven't launched any events matching this query.</p>
             <button onClick={() => setSearch("")} className="text-primary font-black text-xs uppercase tracking-widest hover:underline">Clear Search</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence>
              {filteredEvents.map((event, idx) => (
                <motion.div key={event._id} layout initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-blue-100 dark:hover:border-blue-900 transition-all flex flex-col overflow-hidden group">
                  
                  <div className="relative h-48 bg-gray-50 dark:bg-slate-800 overflow-hidden shrink-0">
                    <EventBanner 
                      banner={event.banner} 
                      title={event.title} 
                      className="group-hover:scale-110 transition-transform duration-700" 
                    />
                    <div className="absolute top-4 right-4 animate-in fade-in zoom-in duration-300">
                       <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-xl backdrop-blur-md border ${
                         event.status === 'approved' ? "bg-emerald-500/80 text-white border-emerald-400/50" :
                         event.status === 'rejected' ? "bg-red-500/80 text-white border-red-400/50" :
                         "bg-amber-500/80 text-white border-amber-400/50"
                       }`}>
                         {event.status === 'approved' ? <FiCheckCircle /> : event.status === 'rejected' ? <FiXCircle /> : <FiClock />} {event.status}
                       </span>
                    </div>
                  </div>

                  <div className="p-6 flex flex-col flex-grow">
                     <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-black text-gray-900 dark:text-white leading-tight group-hover:text-primary dark:group-hover:text-blue-400 transition-colors line-clamp-1">{event.title}</h3>
                     </div>

                     <div className="space-y-3 mb-8">
                        <div className="flex items-center gap-3 text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">
                           <FiCalendar className="text-primary dark:text-blue-400" /> {new Date(event.date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-3 text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">
                           <FiUsers className="text-primary dark:text-blue-400" /> {(event.registeredStudents?.length || 0) + (event.paidAttendees?.length || 0)} Registered
                        </div>
                     </div>

                     <div className="mt-auto flex flex-wrap gap-2.5 pt-5 border-t border-gray-50 dark:border-slate-800">
                        <Link to={`/organizer/event/${event._id}/manage`} className="flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-primary hover:text-white text-primary dark:text-blue-400 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-sm">
                           <FiEye className="text-base" /> Details
                        </Link>
                        <Link to={`/organizer/scan/${event._id}`} className="flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-500 hover:text-white text-emerald-600 dark:text-emerald-400 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-sm" title="Scan QR Passes">
                          <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span> Scan QR
                        </Link>
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteClick(event._id);
                          }} 
                          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-sm shrink-0 cursor-pointer pointer-events-auto ${
                            confirmingId === event._id 
                              ? "bg-red-600 text-white w-full animate-pulse" 
                              : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white"
                          }`}
                          title={confirmingId === event._id ? "Click again to confirm" : "Delete Event"}
                        >
                           {confirmingId === event._id ? "Confirm Delete?" : <FiTrash2 className="text-base" />}
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

export default MyEvents;