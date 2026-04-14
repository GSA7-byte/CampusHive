import { useState, useEffect } from "react";
import { FiCalendar, FiMapPin, FiSearch, FiFilter } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import API from "../../api/axios";
import Navbar from "../../components/common/Navbar";
import EventBanner from "../../components/common/EventBanner";

const Events = () => {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState("");
  const [timing, setTiming] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (user?.role === "admin") {
      navigate("/admin/all-events", { replace: true });
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user?.role === "admin") return;
    fetchEvents();
  }, [category, page, search, user, timing]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data } = await API.get("/events", {
        params: { search, category, timing, page, limit: 9 },
      });
      if (data.success) {
        setEvents(data.data.events);
        setTotalPages(data.data.totalPages);
      }
    } catch (error) {
      console.error("Fetch events error:", error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ["technical", "cultural", "sports", "workshop", "other"];

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      month: "short", day: "numeric", weekday: "short",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 font-display text-gray-800 dark:text-slate-200 flex flex-col transition-colors">
      <Navbar />

      <main className="flex-grow max-w-[1240px] w-full mx-auto px-4 md:px-8 py-10">
        {/* Header */}
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
            Discover Campus <span className="text-primary italic">Vibes</span>
          </h2>
          <p className="text-gray-500 dark:text-slate-400 font-medium">Join the most exciting events happening around your university campus.</p>
        </div>

        {/* Filters & Search */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 mb-10 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col lg:flex-row gap-6 items-center transition-colors">
          <div className="relative w-full lg:flex-1 group">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">search</span>
            <input
              type="text"
              placeholder="Search by event title, organizer or keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl pl-12 pr-4 py-3.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-gray-800 dark:text-slate-200"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
             <div className="flex bg-gray-50 dark:bg-slate-800 p-1 rounded-xl border border-gray-100 dark:border-slate-700 overflow-x-auto no-scrollbar max-w-full">
               <button onClick={() => setCategory("")} 
                 className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${!category ? "bg-white dark:bg-slate-600 text-primary dark:text-blue-400 shadow-sm border border-gray-200 dark:border-slate-500" : "text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300"}`}>
                 All Events
               </button>
               {categories.map((cat) => (
                 <button key={cat} onClick={() => setCategory(cat)}
                   className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${category === cat ? "bg-white dark:bg-slate-600 text-primary dark:text-blue-400 shadow-sm border border-gray-200 dark:border-slate-500" : "text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300"}`}>
                   {cat === "technical" ? "Tech" : cat}
                 </button>
               ))}
             </div>
             
              <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 border px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all lg:ml-auto ${showFilters ? 'bg-primary text-white border-primary shadow-md shadow-primary/20' : 'bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border-gray-100 dark:border-slate-700 text-gray-600 dark:text-slate-400'}`}>
                 <FiFilter className="text-sm" /> More Filters
              </button>
          </div>
        </div>

        {/* Extended Filters Pane */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-10 -mt-6"
            >
              <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex flex-wrap gap-6 items-center">
                 <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                       <span className="material-symbols-outlined text-lg">schedule</span> Timing
                    </span>
                    <div className="flex gap-2">
                      {[
                        { id: "", label: "24 Hours" },
                        { id: "day", label: "Day Events" },
                        { id: "night", label: "Night Events" }
                      ].map(t => (
                        <button
                          key={t.id}
                          onClick={() => { setTiming(t.id); setPage(1); }}
                          className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${timing === t.id ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 border border-transparent"}`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Events Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
               <div key={i} className="bg-white rounded-2xl h-80 border border-gray-100 shadow-sm animate-pulse overflow-hidden">
                  <div className="h-44 bg-gray-100" />
                  <div className="p-5 flex flex-col gap-3">
                    <div className="h-4 w-24 bg-gray-100 rounded" />
                    <div className="h-6 w-full bg-gray-100 rounded" />
                    <div className="h-4 w-32 bg-gray-100 rounded mt-auto" />
                  </div>
               </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm">
             <div className="w-20 h-20 bg-gray-50 text-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-6xl">event_busy</span>
             </div>
             <p className="text-gray-400 font-bold text-lg mb-2">No events found matching your criteria</p>
             <p className="text-gray-400 text-sm max-w-xs mx-auto">Try adjusting your filters or search keywords to find more opportunities.</p>
             <button onClick={() => { setSearch(""); setCategory(""); setTiming(""); setShowFilters(false); }} className="mt-8 text-primary font-bold text-sm uppercase tracking-widest hover:underline">Clear all filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {events.map((event, idx) => (
                <motion.div
                  layout
                  key={event._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                   className="group bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-blue-100 dark:hover:border-blue-900 transition-all flex flex-col"
                >
                  <div className="relative h-52 bg-gray-50 overflow-hidden shrink-0">
                    <EventBanner 
                      banner={event.banner} 
                      title={event.title} 
                      className="group-hover:scale-110 transition-transform duration-700 ease-out" 
                    />
                     <div className="absolute top-4 right-4 flex flex-col gap-2">
                        <span className={`text-[10px] font-bold px-3 py-1.5 rounded-xl backdrop-blur-md shadow-lg flex items-center gap-1.5 uppercase tracking-widest text-white ${event.isPaid ? "bg-indigo-600/80" : "bg-emerald-600/80"}`}>
                          {event.isPaid ? 'Paid' : 'Free Entry'}
                        </span>
                     </div>
                     <div className="absolute bottom-4 left-4">
                        <span className="bg-white/95 dark:bg-slate-800/95 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-primary dark:text-blue-400 shadow-lg border border-gray-100 dark:border-slate-700">
                          {event.category === 'technical' ? 'Tech' : event.category}
                        </span>
                     </div>
                  </div>

                  <div className="p-6 flex flex-col flex-grow">
                    <div className="flex items-center gap-2 text-primary font-bold text-[11px] mb-3 uppercase tracking-widest">
                       <span className="flex items-center gap-1.5"><FiCalendar /> {formatDate(event.date)}</span>
                       <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                       <span>{event.startTime}</span>
                    </div>

                     <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 leading-tight group-hover:text-primary dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                       {event.title}
                     </h3>
                    
                    <div className="flex items-center gap-2 text-gray-400 text-[11px] font-semibold mb-6 uppercase tracking-widest mt-auto">
                      <FiMapPin className="shrink-0 text-sm" />
                      <span className="truncate">{event.venue?.name || "Venue TBA"}</span>
                    </div>

                     <Link to={`/events/${event._id}`} className="block w-full text-center py-3.5 bg-gray-50 dark:bg-slate-800 hover:bg-primary hover:text-white text-gray-800 dark:text-slate-200 font-black text-xs rounded-xl transition-all border border-gray-100 dark:border-slate-700 hover:border-primary uppercase tracking-widest">
                        Secure Your Spot
                     </Link>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-16 flex items-center justify-center gap-3">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="size-10 rounded-xl flex items-center justify-center bg-white border border-gray-100 shadow-sm text-gray-400 hover:text-primary disabled:opacity-30 disabled:hover:text-gray-400 transition-all"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            
            <div className="flex items-center gap-2">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setPage(i + 1)}
                  className={`size-10 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center ${
                    page === i + 1 ? "bg-primary text-white scale-110 shadow-primary/20" : "bg-white border border-gray-100 text-gray-400 hover:text-gray-700"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="size-10 rounded-xl flex items-center justify-center bg-white border border-gray-100 shadow-sm text-gray-400 hover:text-primary disabled:opacity-30 disabled:hover:text-gray-400 transition-all"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Events;