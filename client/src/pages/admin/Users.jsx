import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FiUser, FiMail, FiPhone, FiTag, FiCalendar, FiSearch, FiDownload, FiTrash2, FiShield, FiUserCheck, FiEye, FiX, FiAlertTriangle } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import API from "../../api/axios";
import AdminNavbar from "../../components/common/AdminNavbar";

const Users = () => {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const initialRole = searchParams.get("role") || "all";

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [roleFilter, setRoleFilter] = useState(initialRole);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setSearch(searchParams.get("search") || "");
    setRoleFilter(searchParams.get("role") || "all");
  }, [searchParams]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      console.log("Fetching users from: /auth/users");
      const { data } = await API.get("/auth/users");
      console.log("Fetch Users Response:", data);
      if (data.success) setUsers(data.data);
    } catch (error) {
      console.error("Fetch Users Error:", error.response || error);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = (id) => {
    setUserToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    setDeleting(true);
    try {
      console.log(`Deleting user with ID: ${userToDelete} at /auth/users/${userToDelete}`);
      const { data } = await API.delete(`/auth/users/${userToDelete}`);
      console.log("Delete User Response:", data);
      setUsers(users.filter(u => u._id !== userToDelete));
      toast.success("User removed from system");
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Delete User Error:", error.response || error);
      toast.error(error.response?.data?.message || "Action failed");
    } finally {
      setDeleting(false);
      setUserToDelete(null);
    }
  };

  const handleExportCSV = () => {
    if (filteredUsers.length === 0) return toast.error("No users to export");
    
    const headers = ["ID", "First Name", "Last Name", "Email", "Role", "Phone", "Created At"];
    const csvContent = [
      headers.join(","),
      ...filteredUsers.map(u => [
        u._id,
        u.firstName,
        u.lastName,
        u.email,
        u.role,
        u.phone,
        new Date(u.createdAt).toLocaleDateString()
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `campus_hive_users_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV Exported successfully");
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    
    if (roleFilter !== "all") return matchesSearch && u.role === roleFilter;
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 font-display text-gray-800 dark:text-slate-200 flex flex-col transition-colors">
      <AdminNavbar />

      <main className="flex-grow max-w-[1240px] w-full mx-auto px-4 sm:px-8 py-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">System <span className="text-primary italic">Directory</span></h2>
            <p className="text-gray-500 dark:text-slate-400 font-medium text-sm mt-1">Manage and audit all user accounts across the platform.</p>
          </div>
          <button onClick={handleExportCSV} className="bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border border-gray-100 dark:border-slate-800 flex items-center gap-2 shadow-sm">
             <FiDownload /> Export CSV
          </button>
        </div>

         {/* Directory Controls */}
         <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row gap-4 mb-8 transition-colors">
            <div className="relative flex-grow group">
               <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 group-focus-within:text-primary dark:group-focus-within:text-blue-400 transition-colors" />
               <input type="text" placeholder="Search by name, email or ID..." value={search} onChange={(e) => setSearch(e.target.value)}
                 className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-slate-800 border border-gray-50 dark:border-slate-700 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all dark:text-white dark:placeholder:text-slate-500" />
            </div>
            
            <div className="flex bg-gray-50 dark:bg-slate-800 p-1 rounded-2xl border border-gray-100 dark:border-slate-700">
               {["all", "student", "organizer", "admin"].map((r) => (
                 <button key={r} onClick={() => setRoleFilter(r)}
                   className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${roleFilter === r ? "bg-white dark:bg-slate-700 text-primary dark:text-blue-400 shadow-sm border border-gray-200 dark:border-slate-600" : "text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300"}`}>
                    {r === 'all' ? 'Every Role' : r}
                 </button>
               ))}
            </div>
         </div>

        {loading ? (
          <div className="flex flex-col items-center py-24">
             <div className="w-10 h-10 border-2 border-gray-200 border-t-primary rounded-full animate-spin mb-4" />
             <p className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Analyzing Directory...</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-xl shadow-blue-500/5 overflow-hidden ring-1 ring-gray-100/50 dark:ring-slate-800 transition-colors">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-slate-800/50 text-[10px] uppercase tracking-widest text-gray-400 dark:text-slate-500 font-black">
                    <th className="px-8 py-5">System Account</th>
                    <th className="px-8 py-5">Role / Affinity</th>
                    <th className="px-8 py-5">Onboarded</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                  <AnimatePresence>
                    {filteredUsers.map((u, idx) => (
                       <motion.tr key={u._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.01 }} className="hover:bg-gray-50/30 dark:hover:bg-slate-800/30 transition-colors group">
                        <td className="px-8 py-5">
                           <div className="flex items-center gap-4">
                              <div className={`size-10 rounded-xl font-black text-xs flex items-center justify-center border shrink-0 ${
                                u.role === 'admin' ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/30" :
                                u.role === 'organizer' ? "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/30" :
                                "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30"
                              }`}>
                                 {u.firstName?.[0]}{u.lastName?.[0]}
                              </div>
                              <div className="min-w-0">
                                 <p className="font-black text-gray-900 dark:text-white text-sm">{u.firstName} {u.lastName}</p>
                                 <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 truncate">{u.email}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-8 py-5">
                           <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 border shadow-sm ${
                             u.role === 'admin' ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/30" :
                             u.role === 'organizer' ? "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/30" :
                             "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30"
                           }`}>
                             {u.role === 'admin' && <FiShield className="text-[10px]" />}
                             {u.role === 'organizer' && <FiTag className="text-[10px]" />}
                             {u.role === 'student' && <FiUserCheck className="text-[10px]" />}
                             {u.role}
                           </span>
                        </td>
                        <td className="px-8 py-5">
                           <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                             <FiCalendar className="text-primary" /> {new Date(u.createdAt).toLocaleDateString()}
                           </p>
                        </td>
                         <td className="px-8 py-5 text-right flex items-center justify-end gap-2">
                           <button onClick={() => { setSelectedUser(u); setShowModal(true); }} className="p-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-primary hover:text-white text-primary dark:text-blue-400 rounded-xl transition-all border border-blue-100 dark:border-blue-900/30 group-hover:shadow-md">
                              <FiEye />
                           </button>
                           {u.role !== 'admin' && (
                             <button onClick={() => deleteUser(u._id)} className="p-3 bg-red-50 dark:bg-red-900/20 hover:bg-red-500 hover:text-white text-red-500 dark:text-red-400 rounded-xl transition-all border border-red-100 dark:border-red-900/30 group-hover:shadow-md">
                                <FiTrash2 />
                             </button>
                           )}
                           {u.role === 'admin' && (
                             <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest mr-2">Immutable</span>
                           )}
                         </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
            {filteredUsers.length === 0 && (
               <div className="p-20 text-center">
                  <p className="text-gray-400 font-bold">No accounts found.</p>
               </div>
            )}
          </div>
        )}
      </main>

      {/* User Detail Modal */}
      <AnimatePresence>
        {showModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-gray-900/60 dark:bg-slate-950/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden border border-white dark:border-slate-800 transition-colors">
              <div className="p-8">
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-5">
                    <div className={`size-16 rounded-2xl font-black text-xl flex items-center justify-center border ${
                      selectedUser.role === 'admin' ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/30" :
                      selectedUser.role === 'organizer' ? "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/30" :
                      "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30"
                    }`}>
                      {selectedUser.firstName?.[0]}{selectedUser.lastName?.[0]}
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-gray-900 dark:text-white">{selectedUser.firstName} {selectedUser.lastName}</h3>
                      <p className="text-gray-400 dark:text-slate-500 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded-md border ${
                          selectedUser.role === 'admin' ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/30" :
                          selectedUser.role === 'organizer' ? "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/30" :
                          "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30"
                        }`}>{selectedUser.role}</span>
                        • Joined {new Date(selectedUser.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-gray-400 dark:text-slate-500">
                    <FiX size={24} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-6">
                    <div className="bg-gray-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-gray-100 dark:border-slate-800">
                      <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-3">Contact Information</p>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 text-gray-700 dark:text-slate-300">
                          <FiMail className="text-primary dark:text-blue-400" />
                          <span className="text-sm font-bold">{selectedUser.email}</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-700 dark:text-slate-300">
                          <FiPhone className="text-primary dark:text-blue-400" />
                          <span className="text-sm font-bold">{selectedUser.phone || "Not provided"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-gray-100 dark:border-slate-800">
                      <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-3">System Identity</p>
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-gray-400">USER ID</p>
                        <p className="text-xs font-mono font-bold text-gray-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-2 rounded-lg border border-gray-100 dark:border-slate-700">{selectedUser._id}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-gray-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 h-full">
                      <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-3">
                        {selectedUser.role === 'student' ? 'Academic Details' : selectedUser.role === 'organizer' ? 'Organization Details' : 'Account Status'}
                      </p>
                      <div className="space-y-4">
                        {selectedUser.role === 'student' && (
                          <>
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase">Enrollment No</p>
                              <p className="text-sm font-black text-gray-800 dark:text-slate-200">{selectedUser.enrollmentNo || "N/A"}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase">Department</p>
                              <p className="text-sm font-black text-gray-800 dark:text-slate-200">{selectedUser.department || "N/A"}</p>
                            </div>
                            <div className="flex gap-4">
                              <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase">Year</p>
                                <p className="text-sm font-black text-gray-800 dark:text-slate-200">{selectedUser.year || "N/A"}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase">Semester</p>
                                <p className="text-sm font-black text-gray-800 dark:text-slate-200">{selectedUser.semester || "N/A"}</p>
                              </div>
                            </div>
                          </>
                        )}
                        {selectedUser.role === 'organizer' && (
                          <>
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase">Organization</p>
                              <p className="text-sm font-black text-gray-800 dark:text-slate-200">{selectedUser.organizationName || "N/A"}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase">Designation</p>
                              <p className="text-sm font-black text-gray-800 dark:text-slate-200">{selectedUser.designation || "N/A"}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase">Verification</p>
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase ${selectedUser.isVerified ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-100 dark:border-green-900/30" : "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-900/30"}`}>
                                {selectedUser.isVerified ? 'Verified' : 'Pending'}
                              </span>
                            </div>
                          </>
                        )}
                        <div className="pt-2 border-t border-gray-200/50 dark:border-slate-800">
                           <p className="text-[10px] font-bold text-gray-400 uppercase">Status</p>
                           <span className="text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-widest flex items-center gap-1 mt-1">
                             <div className="size-2 bg-green-500 rounded-full animate-pulse" /> {selectedUser.status}
                           </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-800 flex justify-end">
                   <button onClick={() => setShowModal(false)} className="px-8 py-3 bg-gray-900 dark:bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black dark:hover:bg-blue-700 transition-all shadow-lg shadow-gray-200 dark:shadow-blue-900/20">
                      Close Directory Data
                   </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !deleting && setShowDeleteModal(false)} className="absolute inset-0 bg-gray-900/60 dark:bg-slate-950/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden border border-white dark:border-slate-800 p-8 text-center transition-colors">
               <div className="size-16 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-100 dark:border-red-900/30">
                  <FiAlertTriangle size={32} />
               </div>
               <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Are you sure?</h3>
               <p className="text-gray-500 dark:text-slate-400 font-medium text-sm mb-8">This action is permanent and cannot be undone. The user will be removed from the directory.</p>
               
               <div className="flex gap-3">
                  <button onClick={() => setShowDeleteModal(false)} disabled={deleting} className="flex-1 px-6 py-3.5 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50 border dark:border-slate-700">
                     No, Keep it
                  </button>
                  <button onClick={confirmDelete} disabled={deleting} className="flex-1 px-6 py-3.5 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-red-200 dark:shadow-red-900/20 flex items-center justify-center gap-2 disabled:opacity-50">
                     {deleting ? (
                        <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                     ) : (
                        "Yes, Delete"
                     )}
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Users;