import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FiCheckCircle, FiXCircle, FiCalendar, FiMapPin, FiUser, FiSearch, FiArrowLeft, FiFilter, FiDownload, FiClock, FiEye, FiTrash2 } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import API from "../../api/axios";
import AdminNavbar from "../../components/common/AdminNavbar";
import EventBanner from "../../components/common/EventBanner";

const AllEvents = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const initialFilter = searchParams.get("status") || "all";
  
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [filter, setFilter] = useState(initialFilter);
  const [deletingId, setDeletingId] = useState(null); // State for inline confirmation

  useEffect(() => {
    setSearch(searchParams.get("search") || "");
    setFilter(searchParams.get("status") || "all");
  }, [searchParams]);

  useEffect(() => {
    fetchAllEvents();
  }, []);

  const fetchAllEvents = async () => {
    try {
      const { data } = await API.get("/events/admin/all");
      if (data.success) setEvents(data.data);
    } catch (error) {
      toast.error("Failed to fetch events");
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(e => {
    // Robust search: safely handle missing title or organizer data
    const title = (e.title || "").toLowerCase();
    const orgName = (e.organizer?.firstName || "").toLowerCase();
    const searchText = (search || "").toLowerCase();

    const matchesSearch = title.includes(searchText) || orgName.includes(searchText);
    
    if (filter === "approved") return matchesSearch && e.status === "approved";
    if (filter === "pending") return matchesSearch && e.status === "pending";
    if (filter === "rejected") return matchesSearch && e.status === "rejected";
    return matchesSearch;
  });

  const handleDelete = async (id) => {
    console.log("Final Deletion execution for ID:", id);
    const toastId = toast.loading("Purging event from system...");
    
    try {
      const response = await API.delete(`/events/${id}`);
      console.log("Full Delete Response:", response);
      
      if (response.data && response.data.success) {
        toast.success("Event and all associated data cleared", { id: toastId });
        setEvents(prev => prev.filter(ev => ev._id !== id));
        setDeletingId(null);
      } else {
        const msg = response.data?.message || "Deletion failed on server";
        toast.error(msg, { id: toastId });
        alert("Server Message: " + msg);
      }
    } catch (err) {
      console.error("Critical Delete Error Full Object:", err);
      const serverData = err.response?.data;
      const errorMsg = serverData?.message || err.message || "Failed to delete event";
      
      console.log("Error response data:", serverData);
      
      toast.error("Error: " + errorMsg, { id: toastId });
      alert("CRITICAL ERROR:\nStatus: " + err.response?.status + "\nMessage: " + errorMsg + "\nData: " + JSON.stringify(serverData));
    }
  };

  const handleGenerateReport = () => {
    if (filteredEvents.length === 0) {
      toast.error("No data to export");
      return;
    }
    const headers = ["Title", "Category", "Organizer", "Date", "Start Time", "Status", "Venue", "Registrations", "Certificates"];
    const csvContent = [
      headers.join(","),
      ...filteredEvents.map(e => [
        `"${e.title.replace(/"/g, '""')}"`,
        `"${e.category}"`,
        `"${e.organizer?.firstName || ""} ${e.organizer?.lastName || ""}"`,
        `"${new Date(e.date).toLocaleDateString()}"`,
        `"${e.startTime}"`,
        `"${e.status}"`,
        `"${e.venue?.name || ""}"`,
        e.registrationCount || 0,
        e.certificateCount || 0
      ].join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `events_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Report generated successfully");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 font-display text-gray-800 dark:text-slate-200 flex flex-col transition-colors">
      <AdminNavbar />

      <main className="flex-grow max-w-[1240px] w-full mx-auto px-4 sm:px-8 py-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Main <span className="text-primary italic">Catalog</span></h2>
            <p className="text-gray-500 dark:text-slate-400 font-medium text-sm mt-1">Universal view of all campus events and their current standing.</p>
          </div>
          <button onClick={handleGenerateReport} className="bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border border-gray-100 dark:border-slate-800 flex items-center gap-2 shadow-sm active:scale-95">
             <FiDownload /> Generate Report
          </button>
        </div>

        {/* Universal Controls */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row gap-4 mb-8 transition-colors">
           <div className="relative flex-grow group">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 group-focus-within:text-primary dark:group-focus-within:text-blue-400 transition-colors" />
              <input type="text" placeholder="Search by title, category or organizer..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-slate-800 border border-gray-50 dark:border-slate-700 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all dark:text-white dark:placeholder:text-slate-500" />
           </div>
           
           <div className="flex bg-gray-50 dark:bg-slate-800 p-1 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-x-auto no-scrollbar">
              {["all", "pending", "approved", "rejected"].map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filter === f ? "bg-white dark:bg-slate-700 text-primary dark:text-blue-400 shadow-sm border border-gray-200 dark:border-slate-600" : "text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300"}`}>
                  {f}
                </button>
              ))}
           </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-24">
             <div className="w-10 h-10 border-2 border-gray-200 border-t-primary rounded-full animate-spin mb-4" />
             <p className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Scanning Database...</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-xl shadow-blue-500/5 overflow-hidden ring-1 ring-gray-100/50 dark:ring-slate-800 transition-colors">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-slate-800/50 text-[10px] uppercase tracking-widest text-gray-400 dark:text-slate-500 font-black">
                    <th className="px-8 py-5">Event Detail</th>
                    <th className="px-8 py-5 text-center">Stats</th>
                    <th className="px-8 py-5">Organizer</th>
                    <th className="px-8 py-5">Schedule</th>
                    <th className="px-8 py-5">Status</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                  <AnimatePresence>
                    {filteredEvents.map((event, idx) => (
                       <motion.tr key={event._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }} className="hover:bg-gray-50/30 dark:hover:bg-slate-800/30 transition-colors group">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                             <div className="size-12 rounded-xl bg-gray-100 dark:bg-slate-800 overflow-hidden shrink-0 transition-colors">
                                <EventBanner banner={event.banner} title={event.title} />
                             </div>
                             <div className="min-w-0">
                               <Link to={`/events/${event._id}`} className="font-black text-gray-900 dark:text-white text-sm hover:text-primary dark:hover:text-blue-400 transition-colors block">{event.title}</Link>
                                <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">{event.category}</p>
                             </div>
                          </div>
                        </td>
                         <td className="px-8 py-5">
                            <div className="flex flex-col items-center gap-1.5">
                               <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 rounded-lg border border-blue-100 dark:border-blue-900/30 min-w-[70px] justify-between transition-colors">
                                  <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Regs</span>
                                  <span className="text-[10px] font-black text-blue-600 dark:text-blue-400">{event.registrationCount || 0}</span>
                               </div>
                               <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/20 px-2.5 py-1 rounded-lg border border-purple-100 dark:border-purple-900/30 min-w-[70px] justify-between transition-colors">
                                  <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Certs</span>
                                  <span className="text-[10px] font-black text-purple-600 dark:text-purple-400">{event.certificateCount || 0}</span>
                               </div>
                            </div>
                         </td>
                         <td className="px-8 py-5">
                            <div className="flex items-center gap-2">
                              <FiUser className="text-primary dark:text-blue-400" />
                              <span className="font-bold text-gray-700 dark:text-slate-300 text-xs">{event.organizer?.firstName} {event.organizer?.lastName}</span>
                            </div>
                         </td>
                         <td className="px-8 py-5">
                            <div className="space-y-1">
                               <p className="font-bold text-gray-700 dark:text-slate-300 text-[10px] uppercase tracking-widest flex items-center gap-1.5"><FiCalendar className="text-primary dark:text-blue-400" /> {new Date(event.date).toLocaleDateString()}</p>
                               <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><FiClock className="text-primary dark:text-blue-400" /> {event.startTime}</p>
                            </div>
                         </td>
                         <td className="px-8 py-5">
                           <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 border w-fit transition-colors ${
                             event.status === 'approved' ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30" :
                             event.status === 'rejected' ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/30" :
                             "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30"
                           }`}>
                             {event.status === 'approved' ? <FiCheckCircle /> : event.status === 'rejected' ? <FiXCircle /> : <FiClock />} {event.status}
                           </span>
                         </td>
                        <td className="px-8 py-5 text-right">
                           <div className="flex items-center justify-end gap-2">
                               {deletingId === event._id ? (
                                 <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 p-1.5 rounded-xl border border-red-100 dark:border-red-900/30 transition-colors">
                                    <span className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-tighter px-2">Sure?</span>
                                    <button 
                                      onClick={() => handleDelete(event._id)} 
                                      className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-red-700 transition-colors shadow-sm"
                                    >
                                      Yes
                                    </button>
                                    <button 
                                      onClick={() => setDeletingId(null)} 
                                      className="bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                                    >
                                      No
                                    </button>
                                 </motion.div>
                               ) : (
                                 <>
                                   <Link to={`/events/${event._id}`} title="View Event" className="p-2 bg-gray-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-all border border-gray-100 dark:border-slate-700">
                                      <FiEye />
                                   </Link>
                                   <button 
                                     type="button"
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       setDeletingId(event._id);
                                     }} 
                                     title="Delete Event" 
                                     className="p-2 bg-gray-50 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 rounded-lg transition-all border border-gray-100 dark:border-slate-700 flex items-center justify-center cursor-pointer"
                                   >
                                     <FiTrash2 className="size-4" />
                                   </button>
                                 </>
                               )}
                           </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
            {filteredEvents.length === 0 && (
              <div className="p-20 text-center">
                 <p className="text-gray-400 font-bold">No results found matching your criteria</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AllEvents;
