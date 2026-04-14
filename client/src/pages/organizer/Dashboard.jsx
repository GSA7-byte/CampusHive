import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FiPlus, FiCalendar, FiUsers, FiCheckCircle } from "react-icons/fi";
import { motion } from "framer-motion";
import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import OrganizerNavbar from "../../components/common/OrganizerNavbar";
import EventBanner from "../../components/common/EventBanner";

const OrganizerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalEvents: 0, liveEvents: 0, pendingEvents: 0, totalRegistrations: 0 });
  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsResult, eventsResult] = await Promise.allSettled([
        API.get("/analytics/organizer-stats"),
        API.get("/events/my-events"),
      ]);

      if (statsResult.status === "fulfilled" && statsResult.value.data.success) {
        setStats(statsResult.value.data.data);
      }

      if (eventsResult.status === "fulfilled" && eventsResult.value.data.success) {
        const allEvents = eventsResult.value.data.data?.events || [];
        setRecentEvents(allEvents.slice(0, 5));
      } else if (eventsResult.status === "rejected") {
        console.error("Failed to load events:", eventsResult.reason);
      }
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: "Total Events", value: stats.totalEvents, link: "/organizer/my-events", icon: <FiCalendar />, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Live Now", value: stats.liveEvents, link: "/organizer/my-events?status=approved", icon: <FiCheckCircle />, color: "text-green-600", bg: "bg-green-50" },
    { label: "Pending Approval", value: stats.pendingEvents, link: "/organizer/my-events?status=pending", icon: <span className="material-symbols-outlined">hourglass_empty</span>, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Total Registrations", value: stats.totalRegistrations, link: "/organizer/all-attendees", icon: <FiUsers />, color: "text-indigo-600", bg: "bg-indigo-50" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 font-display text-gray-800 dark:text-slate-200 flex flex-col transition-colors">
      <OrganizerNavbar />

      <main className="flex-grow max-w-[1240px] w-full mx-auto px-4 md:px-8 py-8">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Organizer Dashboard</h2>
            <p className="text-gray-500 dark:text-slate-400 text-sm mt-1 font-medium">Manage your events and track engagement.</p>
          </div>
          <Link to="/organizer/create-event" className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md shadow-primary/20 flex items-center gap-2 active:scale-95 w-fit">
            <FiPlus className="text-lg" /> Create New Event
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {statCards.map((stat, i) => {
            const CardWrapper = stat.link ? Link : "div";
            return (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <CardWrapper
                  to={stat.link}
                  className={`bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-slate-800 shadow-sm flex items-center gap-5 transition-colors ${stat.link ? 'cursor-pointer hover:border-blue-100 dark:hover:border-slate-700 hover:shadow-md' : ''}`}>
                  <div className={`w-14 h-14 ${stat.bg} dark:bg-slate-800 ${stat.color} rounded-2xl flex items-center justify-center text-2xl border dark:border-slate-700`}>
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  </div>
                </CardWrapper>
              </motion.div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Events Table */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
               <div className="px-6 py-5 border-b border-gray-50 dark:border-slate-800 flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 dark:text-white">Recent Events</h3>
                  <Link to="/organizer/my-events" className="text-xs font-bold text-primary dark:text-blue-400 hover:underline">View All</Link>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead>
                     <tr className="bg-gray-50/50 dark:bg-slate-800/50 text-[10px] uppercase tracking-widest text-gray-400 dark:text-slate-500 font-bold">
                       <th className="px-6 py-4">Event Details</th>
                       <th className="px-6 py-4">Status</th>
                       <th className="px-6 py-4">Date</th>
                       <th className="px-6 py-4">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                     {loading ? (
                       <tr><td colSpan="4" className="py-10 text-center"><div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" /></td></tr>
                     ) : recentEvents.length === 0 ? (
                       <tr><td colSpan="4" className="py-10 text-center text-gray-400 text-sm italic">You haven't created any events yet.</td></tr>
                     ) : (
                       recentEvents.map((event) => (
                         <tr key={event._id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors">
                           <td className="px-6 py-4">
                             <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-slate-800 overflow-hidden shrink-0">
                                  <EventBanner 
                                    banner={event.banner} 
                                    title={event.title} 
                                    className="w-full h-full object-cover" 
                                  />
                               </div>
                               <span className="font-bold text-gray-900 dark:text-white text-sm truncate max-w-[180px]">{event.title}</span>
                             </div>
                           </td>
                           <td className="px-6 py-4">
                             <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                               event.status === "approved" ? "bg-green-100 text-green-600" :
                               event.status === "rejected" ? "bg-red-100 text-red-600" :
                               "bg-amber-100 text-amber-600"
                             }`}>
                               {event.status}
                             </span>
                           </td>
                           <td className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-slate-400">
                             {new Date(event.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                           </td>
                           <td className="px-6 py-4">
                             <Link to={`/organizer/event/${event._id}/manage`} className="p-2 text-primary dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors inline-block" title="Manage Event">
                               <span className="material-symbols-outlined text-xl">visibility</span>
                             </Link>
                           </td>
                         </tr>
                       ))
                     )}
                   </tbody>
                 </table>
               </div>
            </div>
          </div>

          {/* Tips & Quick Links */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-slate-800 shadow-sm transition-colors">
               <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                 <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">lightbulb</span> Organizer Tips
               </h3>
               <ul className="space-y-4">
                 <li className="flex gap-3">
                   <div className="size-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                     <span className="text-[10px] font-bold">1</span>
                   </div>
                   <p className="text-xs text-gray-500 leading-relaxed">High-quality banners increase registration rates by up to 40%.</p>
                 </li>
                 <li className="flex gap-3">
                   <div className="size-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                     <span className="text-[10px] font-bold">2</span>
                   </div>
                   <p className="text-xs text-gray-500 leading-relaxed">Clear venue descriptions help students find your events easily.</p>
                 </li>
                 <li className="flex gap-3">
                   <div className="size-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                     <span className="text-[10px] font-bold">3</span>
                   </div>
                   <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">Post your event at least 2 weeks in advance for maximum reach.</p>
                 </li>
               </ul>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-slate-800 shadow-sm transition-colors">
               <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                 <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">bolt</span> Quick Tools
               </h3>
               <div className="grid grid-cols-2 gap-3">
                 <Link to="/organizer/create-event" className="flex flex-col items-center justify-center p-4 rounded-xl bg-gray-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-gray-100 dark:border-slate-700 transition-all group">
                   <FiPlus className="text-xl text-gray-400 dark:text-slate-500 group-hover:text-primary mb-2" />
                   <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400 group-hover:text-primary uppercase tracking-widest">New Event</span>
                 </Link>
                 <Link to="/profile" className="flex flex-col items-center justify-center p-4 rounded-xl bg-gray-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-gray-100 dark:border-slate-700 transition-all group">
                   <span className="material-symbols-outlined text-xl text-gray-400 dark:text-slate-500 group-hover:text-primary mb-2">account_circle</span>
                   <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400 group-hover:text-primary uppercase tracking-widest">Profile</span>
                 </Link>
               </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OrganizerDashboard;