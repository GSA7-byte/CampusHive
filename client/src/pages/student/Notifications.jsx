import { useState, useEffect } from "react";
import { FiBell, FiCheck, FiTrash2, FiClock, FiAlertCircle, FiInfo } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import API from "../../api/axios";
import Navbar from "../../components/common/Navbar";
import OrganizerNavbar from "../../components/common/OrganizerNavbar";
import AdminNavbar from "../../components/common/AdminNavbar";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();

    const socket = io(import.meta.env.VITE_API_URL || "http://localhost:4000");
    if (user?.userId || user?._id) {
       socket.emit("join", user.userId || user._id);
    }

    socket.on("notification", (newNotif) => {
      setNotifications(prev => [newNotif, ...prev]);
      toast.success(newNotif.title, { icon: '🔔' });
    });

    return () => socket.disconnect();
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const { data } = await API.get("/notifications");
      if (data.success) setNotifications(data.data);
    } catch (error) {
       console.error("Fetch notifications failed");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await API.patch(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n._id === id ? {...n, isRead: true} : n));
    } catch (error) {
      console.error("Mark read failed");
    }
  };

  const deleteNotification = async (id) => {
    try {
      const { data } = await API.delete(`/notifications/${id}`);
      if (data.success) {
        setNotifications(notifications.filter(n => n._id !== id));
        toast.success("Notification removed");
      }
    } catch (error) {
       toast.error("Failed to delete notification");
    }
  };

  const markAllRead = async () => {
     try {
       await API.patch("/notifications/read-all");
       setNotifications(notifications.map(n => ({...n, isRead: true})));
       toast.success("All caught up! 🎉");
     } catch (error) {
       toast.error("Failed to mark all as read");
     }
  };

  const getTypeStyles = (type) => {
    switch (type) {
      case 'urgent': return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800";
      case 'event': return "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800";
      case 'feedback': return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800";
      default: return "text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-800 border-gray-100 dark:border-slate-700";
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'urgent': return <FiAlertCircle />;
      case 'feedback': return <FiCheck />;
      default: return <FiInfo />;
    }
  };

  const renderNavbar = () => {
    if (user?.role === "admin") return <AdminNavbar />;
    if (user?.role === "organizer") return <OrganizerNavbar />;
    return <Navbar />;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 font-display text-gray-800 dark:text-slate-200 flex flex-col transition-colors">
      {renderNavbar()}

      <main className="flex-grow max-w-[800px] w-full mx-auto px-4 sm:px-8 py-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
          <div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
               Updates <span className="text-primary italic">Live</span>
            </h2>
            <p className="text-gray-500 dark:text-slate-400 font-medium text-sm mt-1">Stay informed about your registrations and campus news.</p>
          </div>
          {notifications.some(n => !n.isRead) && (
            <button onClick={markAllRead} className="text-[10px] font-black uppercase tracking-widest text-primary dark:text-blue-400 hover:text-primary-dark transition-all flex items-center gap-2 group">
               Mark all as read <FiCheck className="group-hover:scale-125 transition-transform" />
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-24">
             <div className="w-10 h-10 border-2 border-gray-200 border-t-primary rounded-full animate-spin mb-4" />
             <p className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Syncing Notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
           <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm ring-1 ring-gray-100/50 transition-colors">
             <div className="w-16 h-16 bg-gray-50 dark:bg-slate-800 text-gray-200 dark:text-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FiBell className="text-4xl" />
             </div>
             <p className="text-gray-400 dark:text-slate-500 font-bold text-base">All caught up!</p>
             <p className="text-gray-400 dark:text-slate-600 text-[10px] font-bold uppercase tracking-widest mt-2">No new notifications for you</p>
           </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {notifications.map((n, idx) => (
                <motion.div
                  key={n._id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                   className={`group p-6 rounded-3xl border transition-all flex items-start gap-5 relative overflow-hidden ${
                    n.isRead 
                      ? "bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800 opacity-70" 
                      : "bg-white dark:bg-slate-900 border-blue-100 dark:border-blue-900/50 shadow-lg shadow-blue-500/5 ring-1 ring-blue-50 dark:ring-blue-900/20"
                  }`}
                  onClick={() => !n.isRead && markAsRead(n._id)}
                >
                  {!n.isRead && <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />}
                  
                  <div className={`size-12 rounded-2xl flex items-center justify-center shrink-0 border text-xl ${getTypeStyles(n.type)}`}>
                     {getTypeIcon(n.type)}
                  </div>

                  <div className="flex-grow min-w-0">
                     <div className="flex justify-between items-start mb-1">
                       <h4 className={`font-black text-sm truncate pr-6 ${n.isRead ? "text-gray-500 dark:text-slate-500" : "text-gray-900 dark:text-white"}`}>{n.title}</h4>
                       <span className="text-[9px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1 shrink-0 bg-gray-50 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
                          <FiClock className="text-[10px]" /> {new Date(n.createdAt).toLocaleDateString()}
                       </span>
                    </div>
                     <p className={`text-xs font-medium leading-relaxed ${n.isRead ? "text-gray-400 dark:text-slate-500" : "text-gray-600 dark:text-slate-300"}`}>{n.message}</p>
                    
                    <div className="flex items-center gap-4 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                       {!n.isRead && (
                         <button onClick={(e) => { e.stopPropagation(); markAsRead(n._id); }} className="text-[9px] font-black uppercase tracking-[0.15em] text-primary hover:underline">Mark as read</button>
                       )}
                       <button onClick={(e) => { e.stopPropagation(); deleteNotification(n._id); }} className="text-[9px] font-black uppercase tracking-[0.15em] text-red-400 hover:text-red-600 flex items-center gap-1">
                          <FiTrash2 /> Remove
                       </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        <div className="mt-16 text-center">
           <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
              <FiBell className="text-primary" /> Only showing notifications from the last 30 days
           </p>
        </div>
      </main>
    </div>
  );
};

export default Notifications;