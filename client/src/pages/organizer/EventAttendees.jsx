import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { FiUsers, FiCheck, FiMail, FiPhone, FiArrowLeft, FiSearch, FiDownload, FiUserCheck, FiFilter } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import API from "../../api/axios";
import OrganizerNavbar from "../../components/common/OrganizerNavbar";
import { io } from "socket.io-client";

const EventAttendees = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [feedback, setFeedback] = useState({ list: [], avgRating: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("attendees");

  useEffect(() => {
    const fetchRosterAndFeedback = async () => {
      try {
        const [attendeesRes, feedbackRes] = await Promise.all([
          API.get(`/registrations/event/${eventId}`),
          API.get(`/feedback/event/${eventId}`)
        ]);
        
        if (attendeesRes.data.success) {
          // Note: Backend might return event separately or nested. registrationController returns the array directly.
          setAttendees(attendeesRes.data.data);
          // If we need event title, it's inside the first registration if list not empty
          if (attendeesRes.data.data.length > 0) {
            setEvent(attendeesRes.data.data[0].event);
          }
        }
        if (feedbackRes.data.success) {
          setFeedback({
            list: feedbackRes.data.data.feedbacks,
            avgRating: feedbackRes.data.data.avgRating,
            total: feedbackRes.data.data.total
          });
        }
      } catch (error) {
        toast.error("Failed to fetch roster");
      } finally {
        setLoading(false);
      }
    };
    fetchRosterAndFeedback();

    // Socket Integration
    const socket = io("http://localhost:4000");
    socket.emit("join", eventId); // Assuming join works for rooms too or needs adjustment

    socket.on("attendanceUpdated", (data) => {
      console.log("[Socket] Attendance Updated:", data);
      // Trigger a light refresh or manual update
      fetchRosterAndFeedback();
      toast.success(`${data.student?.firstName} just checked in! ⚡`, { icon: "👋" });
    });

    return () => socket.disconnect();
  }, [eventId]);

  const markAttendance = async (studentId) => {
    try {
      const { data } = await API.post(`/registrations/verify-attendance/${eventId}`, { studentId });
      if (data.success) {
        toast.success("Attendance marked!");
        // Re-fetch only attendees to refresh list locally
        const { data: newRoster } = await API.get(`/registrations/event/${eventId}`);
        if (newRoster.success) setAttendees(newRoster.data.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to mark");
    }
  };

  const filteredAttendees = attendees.filter(a => {
    const matchesSearch = 
      `${a.student?.firstName} ${a.student?.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      a.student?.email.toLowerCase().includes(search.toLowerCase());
    
    if (filter === "attended") return matchesSearch && a.status === "attended";
    if (filter === "registered") return matchesSearch && a.status === "registered";
    return matchesSearch;
  });

  const exportToCSV = () => {
    if (filteredAttendees.length === 0) {
      toast.error("No attendees to export");
      return;
    }

    const headers = ["Name", "Email", "Phone", "Enrollment No", "Department", "Year", "Status", "Registration Date"];
    
    const csvContent = [
      headers.join(","),
      ...filteredAttendees.map(a => [
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
    link.setAttribute("download", `Attendees_${event?.title?.replace(/\s+/g, '_') || 'Event'}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV Exported successfully!");
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center py-24">
           <div className="w-10 h-10 border-2 border-gray-200 border-t-primary rounded-full animate-spin mb-4" />
           <p className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Syncing Roster...</p>
        </div>
      );
    }

    if (activeTab === "attendees") {
      if (filteredAttendees.length === 0) {
        return (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
             <p className="text-gray-400 font-bold">No attendees found.</p>
          </div>
        );
      }

      return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-blue-500/5 overflow-hidden ring-1 ring-gray-100/50">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-[10px] uppercase tracking-widest text-gray-400 font-black">
                  <th className="px-8 py-5">Profile</th>
                  <th className="px-8 py-5">Academic Info</th>
                  <th className="px-8 py-5">Contact</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5">Check-in Time</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                 <AnimatePresence>
                   {filteredAttendees.map((a, idx) => (
                     <motion.tr key={a._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }} className="hover:bg-gray-50/30 transition-colors group">
                       <td className="px-8 py-5">
                         <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-blue-50 text-primary font-black flex items-center justify-center border border-blue-100 text-xs shrink-0">
                              {a.student?.firstName?.[0]}{a.student?.lastName?.[0]}
                           </div>
                           <div className="min-w-0">
                              <p className="font-black text-gray-900 text-sm">{a.student?.firstName} {a.student?.lastName}</p>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{a.student?.enrollmentNo || "N/A"}</p>
                           </div>
                         </div>
                       </td>
                       <td className="px-8 py-5">
                          <p className="font-bold text-gray-700 text-xs text-nowrap">{a.student?.department || "General"}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Year {a.student?.year || "-"}</p>
                       </td>
                       <td className="px-8 py-5">
                          <div className="space-y-1">
                             <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500"><FiMail className="text-primary" /> {a.student?.email}</div>
                             <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500"><FiPhone className="text-primary" /> {a.student?.phone || "N/A"}</div>
                          </div>
                       </td>
                       <td className="px-8 py-5">
                         <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 border ${
                           a.status === 'attended' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-gray-50 text-gray-400 border-gray-100"
                         }`}>
                           <div className={`size-1.5 rounded-full ${a.status === 'attended' ? "bg-emerald-500" : "bg-gray-300"}`} /> {a.status}
                         </span>
                       </td>
                       <td className="px-8 py-5">
                          <p className={`text-[10px] font-bold ${a.checkedInAt ? "text-gray-900" : "text-gray-300 italic"}`}>
                             {a.checkedInAt ? new Date(a.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Not arrived"}
                          </p>
                       </td>
                       <td className="px-8 py-5 text-right">
                         {a.status !== 'attended' && (
                           <button onClick={() => markAttendance(a.student?._id)} className="bg-emerald-50 hover:bg-emerald-500 hover:text-white text-emerald-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-emerald-100 group-hover:shadow-md">
                              Check In
                           </button>
                         )}
                         {a.status === 'attended' && (
                           <div className="text-emerald-500 flex items-center justify-end gap-1 font-black text-[10px] uppercase tracking-widest">
                              <FiUserCheck className="text-base" /> Verified
                           </div>
                         )}
                       </td>
                     </motion.tr>
                   ))}
                 </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    // Feedback View
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center justify-between">
           <div>
              <h3 className="font-black text-gray-900 uppercase tracking-widest text-sm mb-1">Overall Rating</h3>
              <div className="flex items-center gap-2">
                 <span className="material-symbols-outlined text-amber-500 text-3xl">star</span>
                 <span className="text-3xl font-black text-gray-900">{feedback.avgRating?.toFixed(1) || "0.0"}</span>
                 <span className="text-gray-400 font-bold text-xs uppercase tracking-widest">/ 5.0</span>
              </div>
           </div>
           <div className="text-right">
              <h3 className="font-black text-gray-900 uppercase tracking-widest text-sm mb-1">Total Reviews</h3>
              <span className="text-3xl font-black text-primary">{feedback.total || 0}</span>
           </div>
        </div>

        {feedback.list.length === 0 ? (
           <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200 shadow-sm">
              <span className="material-symbols-outlined text-4xl text-gray-300 mb-4 block">rate_review</span>
              <p className="text-gray-400 font-bold">No feedback received yet.</p>
           </div>
        ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {feedback.list.map((fb, idx) => (
               <motion.div key={fb._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="bg-white p-6 border border-gray-100 shadow-sm rounded-3xl flex flex-col">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-primary font-black flex items-center justify-center border border-blue-100 text-xs shrink-0">
                       {fb.student?.firstName?.[0]}{fb.student?.lastName?.[0]}
                    </div>
                    <div>
                       <p className="font-black text-gray-900 text-xs">{fb.student?.firstName} {fb.student?.lastName}</p>
                       <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{new Date(fb.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="ml-auto flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                       <span className="material-symbols-outlined text-[14px] text-amber-500 fill-current">star</span>
                       <span className="text-amber-600 font-black text-xs">{fb.rating}</span>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-600 leading-relaxed italic border-l-2 border-gray-200 pl-4 py-1 flex-grow">"{fb.comment}"</p>
               </motion.div>
             ))}
           </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 font-display text-gray-800 flex flex-col">
      <OrganizerNavbar />

      <main className="flex-grow max-w-[1240px] w-full mx-auto px-4 sm:px-8 py-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <button onClick={() => navigate(-1)} className="group flex items-center gap-2 text-gray-400 hover:text-primary font-bold text-[10px] uppercase tracking-widest mb-4 transition-all">
               <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Back
            </button>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Access <span className="text-primary italic">Roster</span></h2>
            <p className="text-gray-500 font-medium text-sm mt-1">{event?.title || "Event Attendee List"}</p>
          </div>
          <div className="flex gap-3">
             <Link to={`/organizer/scan/${eventId}`} className="bg-primary hover:bg-primary-dark text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-primary/20 flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">qr_code_scanner</span> Open Scanner
             </Link>
             <button onClick={exportToCSV} className="bg-white hover:bg-gray-50 text-gray-700 px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border border-gray-100 flex items-center gap-2 shadow-sm">
                <FiDownload /> Export
             </button>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-gray-50 p-1.5 rounded-[1.5rem] border border-gray-100 max-w-fit mb-8 shadow-sm">
           <button onClick={() => setActiveTab("attendees")} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "attendees" ? "bg-white text-primary shadow-sm border border-gray-200" : "text-gray-400 hover:text-gray-600"}`}>
             Roster
           </button>
           <button onClick={() => setActiveTab("feedback")} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "feedback" ? "bg-white text-primary shadow-sm border border-gray-200" : "text-gray-400 hover:text-gray-600"}`}>
             Feedback ({feedback?.total || 0})
           </button>
        </div>

        {/* Controls */}
        {activeTab === "attendees" && (
          <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col lg:flex-row gap-4 mb-8">
             <div className="relative flex-grow group">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
                <input type="text" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-50 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
             </div>
             
             <div className="flex bg-gray-50 p-1 rounded-2xl border border-gray-50">
                {["all", "registered", "attended"].map((f) => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? "bg-white text-primary shadow-sm border border-gray-200" : "text-gray-400 hover:text-gray-600"}`}>
                    {f}
                  </button>
                ))}
             </div>
          </div>
        )}

        {renderContent()}
      </main>
    </div>
  );
};

export default EventAttendees;