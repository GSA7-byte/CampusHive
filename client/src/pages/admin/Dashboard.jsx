import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { motion } from "framer-motion";
import API from "../../api/axios";
import AdminNavbar from "../../components/common/AdminNavbar";

const COLORS = ["#2563EB", "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899"];

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [certRequests, setCertRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState(null);
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [analyticsRes, certRes, paymentsRes] = await Promise.all([
        API.get("/analytics/dashboard"),
        API.get("/events/admin/all"),
        API.get("/payments/pending")
      ]);
      
      if (analyticsRes.data.success) {
        setAnalytics(analyticsRes.data.data);
      }
      
      if (certRes.data.success) {
        const requests = certRes.data.data.filter(e => e.certificateStatus === 'requested');
        setCertRequests(requests);
      }

      if (paymentsRes.data.success) {
        setPendingPaymentsCount(paymentsRes.data.data.length);
      }
    } catch (error) {
      console.error("Analytics error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveCertificates = async (eventId) => {
    try {
      setApprovingId(eventId);
      const { data } = await API.post(`/certificates/approve-release/${eventId}`);
      if (data.success) {
        setCertRequests(prev => prev.filter(e => e._id !== eventId));
        // Show success toast? We need to import toast or just use console
        alert("Certificates released successfully to all attended students!");
      }
    } catch (error) {
      console.error("Approve cert error:", error);
      alert("Failed to release certificates");
    } finally {
      setApprovingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 font-display flex flex-col items-center transition-colors">
        <AdminNavbar />
        <div className="flex-grow flex justify-center items-center py-32">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const categoryData = analytics?.eventsByCategory?.map((item) => ({
    name: item._id?.charAt(0).toUpperCase() + item._id?.slice(1),
    value: item.count,
  })) || [];

  const deptData = analytics?.topDepartments?.map((item) => ({
    name: item._id || "N/A",
    events: item.count,
  })) || [];

  const statCards = [
    { label: "Total Events", value: analytics?.totalEvents || 0, link: "/admin/all-events", icon: "calendar_today", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
    { label: "Approved", value: analytics?.approvedEvents || 0, link: "/admin/all-events?status=approved", icon: "verified", color: "text-green-600", bg: "bg-green-50", border: "border-green-100" },
    { label: "Event Approvals", value: analytics?.pendingEvents || 0, link: "/admin/pending-events", icon: "hourglass_empty", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
    { label: "Pending Payments", value: pendingPaymentsCount, link: "/admin/payment-verification", icon: "credit_card", color: "text-red-500", bg: "bg-red-50", border: "border-red-100" },
    { label: "Students", value: analytics?.totalStudents || 0, link: "/admin/users?role=student", icon: "school", color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100" },
    { label: "Registrations", value: analytics?.totalRegistrations || 0, link: "/admin/all-registrations", icon: "how_to_reg", color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 font-display text-gray-800 dark:text-slate-200 flex flex-col transition-colors">
      <AdminNavbar />

      <main className="flex-grow max-w-[1240px] w-full mx-auto px-4 md:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Overview</h2>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1 font-medium">Platform-wide activity and metrics.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
          {statCards.map((stat, i) => {
            const CardWrapper = stat.link ? Link : "div";
            return (
              <motion.div key={stat.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
                <CardWrapper
                  to={stat.link}
                  className={`bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col items-center text-center transition-colors h-full ${
                    stat.link ? 'cursor-pointer hover:border-blue-100 dark:hover:border-slate-700 hover:shadow-md' : ''
                  }`}>
                  <div className={`w-11 h-11 ${stat.bg} dark:bg-slate-800 ${stat.color} rounded-xl flex items-center justify-center border ${stat.border} dark:border-slate-700 mb-3`}>
                     <span className="material-symbols-outlined text-2xl">{stat.icon}</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mb-0.5">{stat.value}</p>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">{stat.label}</p>
                </CardWrapper>
              </motion.div>
            );
          })}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* Pie Chart */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-gray-100 dark:border-slate-800 shadow-sm transition-colors">
            <h3 className="text-sm font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-8">
               <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">donut_large</span> Event Categories
            </h3>
            {categoryData.length === 0 ? (
              <p className="text-gray-400 text-center py-10 font-medium italic">No category data available</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={4} dataKey="value" stroke="none">
                    {categoryData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderColor: '#F1F5F9', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '12px', fontWeight: 'bold' }} 
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: 'bold', color: '#64748B' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Bar Chart */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-gray-100 dark:border-slate-800 shadow-sm transition-colors">
            <h3 className="text-sm font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-8">
               <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">bar_chart</span> Activity by Department
            </h3>
            {deptData.length === 0 ? (
              <p className="text-gray-400 text-center py-10 font-medium italic">No department activity recorded</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={deptData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: '#F8FAFC' }} 
                    contentStyle={{ backgroundColor: '#fff', borderColor: '#F1F5F9', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '12px', fontWeight: 'bold' }} 
                  />
                  <Bar dataKey="events" fill="#3B82F6" radius={[6, 6, 0, 0]} maxBarSize={45} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Certificate Requests Section */}
        {certRequests.length > 0 && (
          <div className="mb-10">
            <h3 className="text-sm font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">verified</span> Certificate Release Requests
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {certRequests.map((req) => (
                <motion.div key={req._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-blue-100 dark:border-blue-900 shadow-sm border-l-4 border-l-blue-600 dark:border-l-blue-400">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white leading-tight">{req.title}</h4>
                      <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mt-1">{req.organizer?.organizationName || "Unknown Organizer"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-6">
                    <span className="material-symbols-outlined text-sm text-gray-400 dark:text-slate-500">group</span>
                    <span className="text-xs font-bold text-gray-600 dark:text-slate-300">{req.currentParticipants} Attendees waiting</span>
                  </div>
                  <button 
                    onClick={() => handleApproveCertificates(req._id)}
                    disabled={approvingId === req._id}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-md shadow-blue-200"
                  >
                    {approvingId === req._id ? "Releasing..." : "Approve & Release Certificates"}
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
         <h3 className="text-sm font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">bolt</span> Shortcuts
         </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link to="/admin/pending-events"
            className="bg-white dark:bg-slate-900 hover:bg-amber-50 dark:hover:bg-amber-900/10 rounded-2xl p-5 border border-gray-100 dark:border-slate-800 hover:border-amber-200 dark:hover:border-amber-800 shadow-sm transition-all group flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-2xl">pending_actions</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">Event Approvals</h3>
              <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">{analytics?.pendingEvents || 0} items</p>
            </div>
          </Link>

          <Link to="/admin/payment-verification"
             className="bg-white dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl p-5 border border-gray-100 dark:border-slate-800 hover:border-red-200 dark:hover:border-red-800 shadow-sm transition-all group flex items-center gap-4">
             <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
               <span className="material-symbols-outlined text-2xl">receipt_long</span>
             </div>
             <div>
               <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-red-700 dark:group-hover:text-red-400 transition-colors">Verify Payments</h3>
               <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">{pendingPaymentsCount} pending</p>
             </div>
          </Link>

          <Link to="/admin/users"
            className="bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 rounded-2xl p-5 border border-gray-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 shadow-sm transition-all group flex items-center gap-4">
             <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-2xl">manage_accounts</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">User Records</h3>
              <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">{(analytics?.totalStudents || 0) + (analytics?.totalOrganizers || 0)} accounts</p>
            </div>
          </Link>

          <Link to="/admin/announcements"
            className="bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-2xl p-5 border border-gray-100 dark:border-slate-800 hover:border-rose-200 dark:hover:border-rose-800 shadow-sm transition-all group flex items-center gap-4">
             <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-2xl">campaign</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-rose-700 dark:group-hover:text-rose-400 transition-colors">Post Notice</h3>
              <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Broadcast to all</p>
            </div>
          </Link>

          <Link to="/admin/all-events"
            className="bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-2xl p-5 border border-gray-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800 shadow-sm transition-all group flex items-center gap-4">
             <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-2xl">data_table</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">Event Log</h3>
              <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">View all system events</p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;