import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiHome, FiCalendar, FiClipboard, FiBell, FiAward, FiMessageSquare } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import API from "../../api/axios";
import ThemeToggle from "./ThemeToggle";

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showOverlay, setShowOverlay] = useState(false);
  const overlayRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const { data } = await API.get("/notifications");
      if (data.success) setNotifications(data.data);
    } catch {
      console.error("Failed to fetch notifications");
    }
  };

  useEffect(() => {
    if (user) fetchNotifications();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (overlayRef.current && !overlayRef.current.contains(event.target)) {
        setShowOverlay(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navLinks = user?.role === "admin" 
    ? [
        { path: "/admin/dashboard", label: "Dashboard", icon: <FiHome className="text-lg" /> },
        { path: "/admin/all-events", label: "Events", icon: <FiCalendar className="text-lg" /> },
      ]
    : [
        { path: "/student/dashboard", label: "Dashboard", icon: <FiHome className="text-lg" /> },
        { path: "/events", label: "Events", icon: <FiCalendar className="text-lg" /> },
        { path: "/my-registrations", label: "My Registrations", icon: <FiClipboard className="text-lg" /> },
        { path: "/certificates", label: "Certificates", icon: <FiAward className="text-lg" /> },
      ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 px-4 md:px-8 lg:px-10 py-3 shadow-sm transition-colors">
      <div className="w-full max-w-[1400px] mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Link to={user?.role === "admin" ? "/admin/dashboard" : "/student/dashboard"} className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 overflow-hidden shadow-inner translate-colors">
               <img src="/campushive_logo.png" alt="CampusHive" className="w-8 h-8 object-contain" />
            </div>
            <div className="flex flex-col items-start leading-none">
              <h2 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">CampusHive</h2>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-primary opacity-80">{user?.role === "admin" ? 'Admin' : 'Student'}</span>
            </div>
          </Link>
          <nav className="hidden xl:flex items-center gap-1">
             {navLinks.map((link) => (
               <Link
                 key={link.path}
                 to={link.path}
                 className={`text-sm font-medium transition-all flex items-center gap-2 px-3 py-2 rounded-lg 
                   ${isActive(link.path)
                     ? "bg-blue-50 dark:bg-blue-900/30 text-primary dark:text-blue-400 border border-blue-100 dark:border-blue-800"
                     : "text-gray-500 dark:text-slate-400 hover:text-primary dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-slate-800 text-sm"
                   }`}
               >
                 {link.icon} <span className="whitespace-nowrap">{link.label}</span>
               </Link>
             ))}
          </nav>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <ThemeToggle className="mr-1" />

          <div className="hidden lg:block bg-gray-50 dark:bg-slate-800 rounded-xl p-1 border border-gray-100 dark:border-slate-700">
            <div className="flex items-center px-3 gap-2">
              <span className="material-symbols-outlined text-gray-400 dark:text-slate-500 text-xl">search</span>
              <input 
                className="bg-transparent border-none focus:ring-0 text-sm w-32 placeholder:text-gray-400 dark:placeholder:text-slate-600 text-gray-800 dark:text-slate-200 outline-none" 
                placeholder="Search events..." 
                type="text"
                onKeyDown={(e) => { 
                  if (e.key === "Enter" && e.target.value.trim()) {
                    const searchPath = user?.role === "admin" ? "/admin/all-events" : "/events";
                    navigate(`${searchPath}?search=${encodeURIComponent(e.target.value.trim())}`);
                  }
                }}
              />
            </div>
          </div>

          <div className="relative" ref={overlayRef}>
            <button 
              onClick={() => setShowOverlay(!showOverlay)}
              className="relative p-2 text-gray-400 hover:text-primary transition-colors group"
            >
              <span className="material-symbols-outlined text-2xl">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
              )}
            </button>

            {showOverlay && (
              <div className="absolute top-full right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="bg-gray-50/50 dark:bg-slate-900/50 px-4 py-3 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                  <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold text-white bg-red-500 px-1.5 py-0.5 rounded">
                      {unreadCount}
                    </span>
                  )}
                </div>
                
                <div className="max-h-80 overflow-y-auto custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-gray-400 dark:text-slate-500 text-sm">No notifications yet.</div>
                  ) : (
                     notifications.slice(0, 5).map((n) => (
                       <div key={n._id} className={`p-4 border-b border-gray-50 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-900/50 transition-colors ${!n.isRead ? "bg-blue-50/30 dark:bg-blue-900/10" : ""}`}>
                         <h4 className={`text-sm font-semibold truncate ${!n.isRead ? "text-primary dark:text-blue-400" : "text-gray-700 dark:text-slate-300"}`}>{n.title}</h4>
                         <p className="text-xs text-gray-500 dark:text-slate-500 mt-1 line-clamp-2 leading-relaxed">{n.message}</p>
                       </div>
                     ))
                  )}
                </div>
                
                <Link to="/notifications" onClick={() => setShowOverlay(false)} className="block text-center py-3 text-xs font-bold uppercase tracking-widest text-primary dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-900 transition-colors border-t border-gray-100 dark:border-slate-700">
                  View All
                </Link>
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-gray-100 dark:bg-slate-800 mx-1"></div>

          <Link to="/profile" className="size-9 rounded-full bg-gray-50 dark:bg-slate-800 flex items-center justify-center border border-gray-200 dark:border-slate-700 cursor-pointer overflow-hidden font-bold text-primary dark:text-blue-400 hover:border-primary transition-all shadow-sm" title="My Profile">
             {user?.firstName?.[0] || "U"}
          </Link>

          <button className="xl:hidden text-gray-500 dark:text-slate-400 hover:text-primary dark:hover:text-blue-400 transition-colors" onClick={() => setMobileOpen(!mobileOpen)}>
            <span className="material-symbols-outlined text-3xl">{mobileOpen ? "close" : "menu"}</span>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="xl:hidden absolute top-full left-0 w-full bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 px-4 py-4 shadow-xl flex flex-col gap-1 z-50 transition-colors">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                isActive(link.path) 
                   ? "bg-blue-50 dark:bg-blue-900/30 text-primary dark:text-blue-400" 
                   : "text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-primary dark:hover:text-blue-400"
              }`}
            >
              {link.icon} {link.label}
            </Link>
          ))}
          <div className="h-px bg-gray-100 dark:bg-slate-800 my-2"></div>
          <Link
            to="/profile"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-primary dark:hover:text-blue-400 transition-colors"
          >
            <span className="material-symbols-outlined">person</span> My Profile
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50"
          >
            <span className="material-symbols-outlined">logout</span> Logout
          </button>
        </div>
      )}
    </header>
  );
};

export default Navbar;