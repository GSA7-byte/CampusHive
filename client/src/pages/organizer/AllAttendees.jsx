import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiUsers, FiMail, FiPhone, FiArrowLeft, FiSearch, FiDownload, FiUserCheck } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import API from "../../api/axios";
import OrganizerNavbar from "../../components/common/OrganizerNavbar";

const AllAttendees = () => {
  const navigate = useNavigate();
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const fetchAllAttendees = async () => {
      try {
        const { data } = await API.get(`/registrations/organizer/all`);
        if (data.success) {
          setAttendees(data.data);
        }
      } catch (error) {
        toast.error("Failed to fetch attendees");
      } finally {
        setLoading(false);
      }
    };
    fetchAllAttendees();
  }, []);

  const filteredAttendees = attendees.filter(a => {
    const matchesSearch = 
      `${a.student?.firstName} ${a.student?.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      a.student?.email.toLowerCase().includes(search.toLowerCase()) ||
      (a.event?.title && a.event.title.toLowerCase().includes(search.toLowerCase()));
    
    if (filter === "attended") return matchesSearch && a.status === "attended";
    if (filter === "registered") return matchesSearch && a.status === "registered";
    return matchesSearch;
  });

  const exportToCSV = () => {
    if (filteredAttendees.length === 0) {
      toast.error("No attendees to export");
      return;
    }

    const headers = ["Event", "Name", "Email", "Phone", "Enrollment No", "Department", "Year", "Status", "Registration Date"];
    
    const csvContent = [
      headers.join(","),
      ...filteredAttendees.map(a => [
        `"${a.event?.title || 'Unknown Event'}"`,
        `"${a.student?.firstName} ${a.student?.lastName}"`,
        `"${a.student?.email}"`,
        `"${a.student?.phone || 'N/A'}"`,
        `"${a.student?.enrollmentNo || 'N/A'}"`,
        `"${a.student?.department || 'General'}"`,
        `"${a.student?.year || '-'}"`,
        `"${a.status}"`,
        `"${new Date(a.createdAt).toLocaleDateString()}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `All_Attendees_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV Exported successfully!");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 font-display text-gray-800 dark:text-slate-200 flex flex-col transition-colors">
      <OrganizerNavbar />

      <main className="flex-grow max-w-[1240px] w-full mx-auto px-4 sm:px-8 py-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <button onClick={() => navigate(-1)} className="group flex items-center gap-2 text-gray-400 hover:text-primary dark:hover:text-blue-400 font-bold text-[10px] uppercase tracking-widest mb-4 transition-all">
               <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Back
            </button>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Total <span className="text-primary dark:text-blue-400 italic">Registrations</span></h2>
            <p className="text-gray-500 dark:text-slate-400 font-medium text-sm mt-1">All registered students across your events.</p>
          </div>
          <div className="flex gap-3">
             <button onClick={exportToCSV} className="bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border border-gray-100 dark:border-slate-800 flex items-center gap-2 shadow-sm">
                <FiDownload /> Export
             </button>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row gap-4 mb-8 transition-colors">
           <div className="relative flex-grow group">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary dark:group-focus-within:text-blue-400 transition-colors" />
              <input type="text" placeholder="Search by name, email, or event title..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-slate-800 border border-gray-50 dark:border-slate-800 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 dark:focus:ring-blue-900/40 outline-none transition-all dark:text-white" />
           </div>
           
           <div className="flex bg-gray-50 dark:bg-slate-800 p-1 rounded-2xl border border-gray-50 dark:border-slate-800">
              {["all", "registered", "attended"].map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? "bg-white dark:bg-slate-900 text-primary dark:text-blue-400 shadow-sm border border-gray-200 dark:border-slate-700" : "text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300"}`}>
                  {f}
                </button>
              ))}
           </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-24">
             <div className="w-10 h-10 border-2 border-gray-200 dark:border-slate-700 border-t-primary dark:border-t-blue-400 rounded-full animate-spin mb-4" />
             <p className="text-gray-400 dark:text-slate-500 font-bold uppercase tracking-widest text-[9px]">Loading Registrations...</p>
          </div>
        ) : filteredAttendees.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm transition-colors">
             <p className="text-gray-400 dark:text-slate-500 font-bold">No attendees found.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-xl shadow-blue-500/5 dark:shadow-none overflow-hidden ring-1 ring-gray-100/50 dark:ring-slate-800 transition-colors">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-slate-800/50 text-[10px] uppercase tracking-widest text-gray-400 dark:text-slate-500 font-black">
                    <th className="px-8 py-5">Event</th>
                    <th className="px-8 py-5">Student / Profile</th>
                    <th className="px-8 py-5">Academic Info</th>
                    <th className="px-8 py-5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50">
                   <AnimatePresence>
                     {filteredAttendees.map((a, idx) => (
                       <motion.tr key={a._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(idx * 0.03, 1.5) }} className="hover:bg-gray-50/30 dark:hover:bg-slate-800/30 transition-colors group">
                         <td className="px-8 py-5 w-[20%]">
                            <p className="font-bold text-gray-700 dark:text-slate-300 text-xs text-wrap">{a.event?.title || "Unknown Event"}</p>
                            <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 mt-1 uppercase tracking-widest">{a.event?.date ? new Date(a.event.date).toLocaleDateString() : ""}</p>
                         </td>
                         <td className="px-8 py-5">
                           <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-primary dark:text-blue-400 font-black flex items-center justify-center border border-blue-100 dark:border-blue-900/30 text-xs shrink-0">
                                {a.student?.firstName?.[0]}{a.student?.lastName?.[0]}
                             </div>
                             <div className="min-w-0">
                                <p className="font-black text-gray-900 dark:text-white text-sm">{a.student?.firstName} {a.student?.lastName}</p>
                                <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">{a.student?.email}</p>
                             </div>
                           </div>
                         </td>
                         <td className="px-8 py-5">
                            <p className="font-bold text-gray-700 dark:text-slate-300 text-xs text-nowrap">{a.student?.department || "General"}</p>
                            <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Year {a.student?.year || "-"}</p>
                         </td>
                         <td className="px-8 py-5">
                           <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 border ${
                             a.status === 'attended' ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/30" : "bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-slate-500 border-gray-100 dark:border-slate-700"
                           }`}>
                             <div className={`size-1.5 rounded-full ${a.status === 'attended' ? "bg-emerald-500" : "bg-gray-300 dark:bg-slate-600"}`} /> {a.status}
                           </span>
                         </td>
                       </motion.tr>
                     ))}
                   </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AllAttendees;
