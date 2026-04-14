import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiHome, FiCheckSquare, FiUsers, FiVolume2, FiList, FiBell } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import API from "../../api/axios";
import { useEffect } from "react";
import ThemeToggle from "./ThemeToggle";

const AdminNavbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const { data } = await API.get("/notifications");
      if (data.success) {
        setUnreadCount(data.data.filter(n => !n.isRead).length);
      }
    } catch (error) {
      console.error("Failed to fetch notifications count");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navLinks = [
    { path: "/admin/dashboard", label: "Dashboard", icon: <FiHome className="text-lg" /> },
    { path: "/admin/pending-events", label: "Approvals", icon: <FiCheckSquare className="text-lg" /> },
    { path: "/admin/all-events", label: "All Events", icon: <FiList className="text-lg" /> },
    { path: "/admin/users", label: "Users", icon: <FiUsers className="text-lg" /> },
    { path: "/admin/announcements", label: "Announcements", icon: <FiVolume2 className="text-lg" /> },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 px-4 md:px-8 lg:px-10 py-3 shadow-sm transition-colors">
      <div className="w-full max-w-[1400px] mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Link to="/admin/dashboard" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 overflow-hidden shadow-inner transition-colors">
               <img src="/campushive_logo.png" alt="CampusHive" className="w-8 h-8 object-contain" />
            </div>
            <div className="flex flex-col items-start leading-none">
              <h2 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">CampusHive</h2>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 opacity-80">Admin</span>
            </div>
          </Link>
          <nav className="hidden lg:flex items-center gap-1">
             {navLinks.map((link) => (
               <Link
                 key={link.path}
                 to={link.path}
                 className={`text-sm font-medium transition-all flex items-center gap-2 px-3 py-2 rounded-lg 
                   ${isActive(link.path)
                     ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800"
                     : "text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-slate-800"
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
                placeholder="Search..." 
                type="text"
                onKeyDown={(e) => { if (e.key === "Enter" && e.target.value.trim()) navigate(`/admin/all-events?search=${encodeURIComponent(e.target.value.trim())}`); }}
              />
            </div>
          </div>
          
          <div className="h-6 w-px bg-gray-100 mx-1"></div>

          <Link to="/notifications" className="relative group p-2 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition-all mr-1">
             <FiBell className="text-xl text-gray-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
             {unreadCount > 0 && (
               <span className="absolute top-1 right-1 size-4 bg-red-500 text-white text-[8px] font-black flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900 animate-bounce">
                 {unreadCount > 9 ? "9+" : unreadCount}
               </span>
             )}
          </Link>

          <Link to="/profile" className="w-9 h-9 rounded-full bg-gray-50 dark:bg-slate-800 flex items-center justify-center border border-gray-200 dark:border-slate-700 cursor-pointer overflow-hidden font-bold text-blue-600 dark:text-blue-400 hover:border-blue-500 transition-all shadow-sm" title="My Profile">
             {user?.firstName?.[0] || "A"}
          </Link>

          <button className="lg:hidden text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" onClick={() => setMobileOpen(!mobileOpen)}>
            <span className="material-symbols-outlined text-3xl">{mobileOpen ? "close" : "menu"}</span>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden absolute top-full left-0 w-full bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 px-4 py-4 shadow-xl flex flex-col gap-1 z-50 transition-colors">
           {navLinks.map((link) => (
             <Link
               key={link.path}
               to={link.path}
               onClick={() => setMobileOpen(false)}
               className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                 isActive(link.path) 
                   ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" 
                   : "text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400"
               }`}
             >
               {link.icon} {link.label}
             </Link>
           ))}
          <div className="h-px bg-gray-100 dark:bg-slate-800 my-2"></div>
          <Link
            to="/profile"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
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

export default AdminNavbar;