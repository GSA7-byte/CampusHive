import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FiCalendar, FiClipboard, FiAward, FiArrowRight } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/common/Navbar";
import EventBanner from "../../components/common/EventBanner";
import { io } from "socket.io-client";
import toast from "react-hot-toast";

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ registrations: 0, upcoming: 0, certificates: 0 });
  const [recentEvents, setRecentEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);

  useEffect(() => {
    fetchEventsList();
  }, [showUpcoming]);

  useEffect(() => {
    fetchData();

    // Socket Integration
    const socket = io("http://localhost:4000");
    if (user?.userId || user?._id) {
       socket.emit("join", user.userId || user._id);
    }

    socket.on("notification", (newNotif) => {
      console.log("[Socket] New Notification:", newNotif);
      setNotifications(prev => [newNotif, ...prev].slice(0, 5));
      toast.success(newNotif.title, {
        icon: '🔔',
        duration: 4000,
      });
      // Also update stats if it's a certificate release
      if (newNotif.title.includes("Certificate")) {
        setStats(prev => ({ ...prev, certificates: prev.certificates + 1 }));
      }
    });

    return () => socket.disconnect();
  }, [user]);

  const fetchEventsList = async () => {
    setLoadingEvents(true);
    try {
      const params = { limit: 6 };
      if (showUpcoming) params.upcoming = "true";
      const { data } = await API.get("/events", { params });
      if (data.success) {
        setRecentEvents(data.data.events || []);
      }
    } catch (error) {
      console.error("Dashboard events fetch error:", error);
    } finally {
      setLoadingEvents(false);
    }
  };

  const fetchData = async () => {
    try {
      const [regRes, annRes, certRes, notifRes] = await Promise.all([
        API.get("/registrations/my-registrations"),
        API.get("/announcements"),
        API.get("/certificates/my-certificates"),
        API.get("/notifications")
      ]);
      
      if (regRes.data.success) {
        const regs = regRes.data.data;
        setStats(prev => ({
          ...prev,
          registrations: regs.filter((r) => r.status !== "cancelled").length,
          upcoming: regs.filter((r) => r.status === "registered" && new Date(r.event?.date) >= new Date()).length,
        }));
      }
      if (annRes.data.success) {
        setAnnouncements(annRes.data.data.slice(0, 5));
      }
      if (certRes.data.success) {
        setStats(prev => ({ ...prev, certificates: certRes.data.data.length }));
      }
      if (notifRes.data.success) {
        setNotifications(notifRes.data.data.slice(0, 5));
      }
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await API.patch(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error("Mark read failed:", error);
    }
  };

  const enableNotifications = async () => {
    if (!("Notification" in window)) {
      toast.error("This browser does not support desktop notifications");
      return;
    }

    if (Notification.permission === "granted") {
      toast.success("Notifications already enabled!");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      toast.success("Notifications enabled! 🔔");
      new Notification("CampusHive", {
        body: "You will now receive real-time updates.",
        icon: "/favicon.ico"
      });
    } else {
      toast.error("Notification permission denied");
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      month: "short", day: "numeric", weekday: "short",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 font-display text-gray-800 dark:text-slate-200 flex flex-col transition-colors">
      <Navbar />

      <main className="flex-grow max-w-[1240px] w-full mx-auto px-4 md:px-8 py-8">
        {/* Welcome */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              Welcome back, {user?.firstName || "Student"} 👋
            </h2>
            <p className="text-gray-500 text-sm mt-1 font-medium">Here's what's happening on campus today.</p>
          </div>
          <div className="flex gap-3">
            <Link to="/my-registrations" className="bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-primary dark:text-blue-400 border border-primary/20 dark:border-blue-900/50 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm flex items-center gap-2 active:scale-95 w-fit">
              <span className="material-symbols-outlined text-xl">how_to_reg</span> My Registrations
            </Link>
            <Link to="/events" className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md shadow-primary/20 flex items-center gap-2 active:scale-95 w-fit">
              <span className="material-symbols-outlined text-xl">explore</span> Browse Events
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            onClick={() => setShowUpcoming(!showUpcoming)}
            className={`cursor-pointer rounded-2xl p-6 flex items-center gap-5 group transition-all border ${showUpcoming ? 'bg-primary/5 dark:bg-blue-900/10 shadow-md border-primary/30 dark:border-blue-800' : 'bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md'}`}>
             <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110">
              <span className="material-symbols-outlined text-3xl">event_upcoming</span>
            </div>
            <div>
               <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Upcoming Events</h3>
               <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Handpicked for you</p>
            </div>
          </motion.div>

          <Link to="/my-registrations">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex items-center gap-5 group hover:shadow-md transition-all cursor-pointer">
              <div className="w-14 h-14 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110">
                 <span className="material-symbols-outlined text-3xl">how_to_reg</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">My Registrations</h3>
                <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-widest">{stats.registrations} Events</p>
              </div>
            </motion.div>
          </Link>

          <Link to="/certificates">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex items-center gap-5 group hover:shadow-md transition-all cursor-pointer">
              <div className="w-14 h-14 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110">
                <span className="material-symbols-outlined text-3xl">workspace_premium</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Certificates</h3>
                <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-widest">{stats.certificates} Earned</p>
              </div>
            </motion.div>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Events Feed */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">event_note</span> {showUpcoming ? 'Upcoming Events' : 'Recommended Events'}
              </h3>
              <Link to="/events" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                 View All <FiArrowRight />
              </Link>
            </div>

            {loading || loadingEvents ? (
              <div className="flex justify-center py-20">
                <div className="w-10 h-10 border-4 border-gray-200 border-t-primary rounded-full animate-spin" />
              </div>
            ) : recentEvents.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-sm">
                <span className="material-symbols-outlined text-5xl text-gray-200 dark:text-slate-700 mb-4 block">event_busy</span>
                <p className="text-gray-400 dark:text-slate-500 font-medium">No events found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {recentEvents.map((event) => (
                  <motion.div key={event._id} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                    className="group bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-blue-100 dark:hover:border-blue-900 transition-all flex flex-col">
                    <div className="relative h-44 bg-gray-100 dark:bg-slate-800 overflow-hidden">
                      <EventBanner 
                        banner={event.banner} 
                        title={event.title} 
                        className="group-hover:scale-105 transition-transform duration-500" 
                      />
                      <div className="absolute top-3 right-3 flex flex-col gap-2">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-md shadow-lg flex items-center gap-1 uppercase tracking-wider text-white ${event.isPaid ? "bg-purple-600/80" : "bg-green-600/80"}`}>
                          {event.isPaid ? 'Paid' : 'Free'}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 flex flex-col flex-grow">
                      <div className="flex items-center gap-3 text-primary dark:text-blue-400 font-semibold text-[11px] mb-3 uppercase tracking-wider">
                        <span className="flex items-center gap-1"><FiCalendar className="text-sm" /> {formatDate(event.date)}</span>
                        <span className="w-1 h-1 bg-gray-300 dark:bg-slate-700 rounded-full"></span>
                        <span>{event.startTime}</span>
                      </div>

                      <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2 leading-tight group-hover:text-primary dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                        {event.title}
                      </h3>
                      
                      <div className="flex items-center gap-1.5 text-gray-400 dark:text-slate-500 text-xs mb-5 mt-auto">
                        <span className="material-symbols-outlined text-base">location_on</span>
                        <span className="truncate">{event.venue?.name || "TBA"}</span>
                      </div>

                       <Link to={`/events/${event._id}`} className="block w-full text-center py-2.5 bg-gray-50 dark:bg-slate-800 hover:bg-primary hover:text-white text-gray-600 dark:text-slate-300 font-bold text-xs rounded-xl transition-all border border-gray-200 dark:border-slate-700 hover:border-primary">
                         View Details
                       </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Right Sidebar: Notifications & Announcements */}
          <div className="lg:col-span-1 space-y-8">
            {/* Recent Notifications */}
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">notifications</span> Recent Alerts
                </h3>
                <Link to="/notifications" className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline">View All</Link>
              </div>

              <div className="space-y-3">
                {notifications.length === 0 ? (
                  <div className="bg-white border border-gray-100 rounded-2xl p-6 text-center shadow-sm">
                    <p className="text-gray-400 text-xs font-medium">No recent alerts.</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <motion.div key={n._id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                      onClick={() => !n.isRead && markAsRead(n._id)}
                      className={`p-4 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer group/notif ${!n.isRead ? "bg-blue-50/50 border-blue-100 ring-1 ring-blue-50" : "bg-white border-gray-100 shadow-sm opacity-80 hover:opacity-100"}`}>
                      <div className={`mt-0.5 size-7 rounded-lg flex items-center justify-center text-xs ${
                        n.type === 'registration' ? "bg-emerald-100 text-emerald-600" :
                        n.type === 'event' ? "bg-purple-100 text-purple-600" :
                        "bg-gray-100 text-gray-500"
                      }`}>
                        <span className="material-symbols-outlined text-sm">
                          {n.type === 'registration' ? "how_to_reg" : n.type === 'event' ? "event" : "info"}
                        </span>
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex justify-between items-start gap-1">
                          <h4 className={`font-bold text-[11px] truncate ${!n.isRead ? "text-gray-900" : "text-gray-500"}`}>{n.title}</h4>
                          {!n.isRead && <div className="size-1.5 bg-blue-500 rounded-full shrink-0 mt-1" />}
                        </div>
                        <p className={`text-[10px] line-clamp-2 mt-0.5 leading-relaxed ${!n.isRead ? "text-gray-600 font-medium" : "text-gray-400"}`}>{n.message}</p>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            {/* Announcements Sidebar */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-yellow-500">campaign</span> Latest Notices
            </h3>
            
            <div className="space-y-4">
              {announcements.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-10 bg-white rounded-2xl border border-dashed border-gray-200">No notices posted yet.</p>
              ) : (
                announcements.map((ann) => (
                  <div key={ann._id} className={`p-5 rounded-2xl border transition-all ${ann.isPinned ? "bg-blue-50/50 border-blue-100" : "bg-white border-gray-100 shadow-sm"}`}>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h4 className="font-bold text-gray-900 text-sm">{ann.title}</h4>
                      {ann.isPinned && <span className="material-symbols-outlined text-blue-500 text-sm">push_pin</span>}
                    </div>
                    <p className="text-gray-500 text-xs leading-relaxed line-clamp-3 mb-3">{ann.content}</p>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{new Date(ann.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</span>
                      <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                        ann.type === "urgent" ? "bg-red-100 text-red-600" :
                        ann.type === "event" ? "bg-purple-100 text-purple-600" :
                        "bg-gray-100 text-gray-600"
                      }`}>{ann.type || "general"}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="mt-8 p-6 bg-gradient-to-br from-primary to-blue-700 rounded-2xl text-white">
              <h4 className="font-bold mb-1">Stay Notified!</h4>
              <p className="text-white/80 text-xs mb-4">Never miss an event update or a certificate notification.</p>
              <button onClick={enableNotifications} className="bg-white/20 hover:bg-white/30 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-lg transition-all border border-white/30 active:scale-95">Enable Notifications</button>
            </div>
          </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;