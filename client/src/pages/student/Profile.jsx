import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FiUser, FiMail, FiPhone, FiLock, FiEdit2, FiCheck, FiX, FiCamera, FiShield, FiLogOut } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/common/Navbar";
import OrganizerNavbar from "../../components/common/OrganizerNavbar";
import AdminNavbar from "../../components/common/AdminNavbar";

const Profile = () => {
  const navigate = useNavigate();
  const { user, setUser, fetchProfile, removeProfilePhoto, login, logout } = useAuth();
  const fileInputRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  // ... (lines omitted for brevity, will target specifically below)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    department: "",
    year: "",
    organizationName: "",
    designation: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showCameraOptions, setShowCameraOptions] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const processingRef = useRef(false);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
        department: user.department || "",
        year: user.year || "",
        organizationName: user.organizationName || "",
        designation: user.designation || "",
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await API.patch("/auth/me", formData);
      if (data.success) {
        setUser(data.data);
        setIsEditing(false);
        toast.success("Profile updated successfully! ✨");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const dataToSend = new FormData();
    dataToSend.append("profile", file);

    setPhotoLoading(true);
    try {
      const { data } = await API.patch("/auth/me", dataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (data.success) {
        setUser(data.data);
        toast.success("Profile photo updated! 📸");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to upload photo");
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleRemovePhoto = async (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    if (processingRef.current || photoLoading) {
      console.log("[Profile] Already processing or loading, ignoring click");
      return;
    }

    console.log("[Profile] handleRemovePhoto click triggered, showing custom confirm...");
    setShowConfirmDelete(true);
    setShowCameraOptions(false); // Close dropdown immediately
  };

  const confirmRemovePhoto = async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    setPhotoLoading(true);
    setShowConfirmDelete(false);

    console.log("[Profile] Starting photo removal process...");
    try {
      console.log("[Profile] Sending POST request to /auth/remove-profile-photo...");
      const { data } = await API.post("/auth/remove-profile-photo");
      
      console.log("[Profile] API Response:", data);
      if (data.success) {
        toast.success("Profile photo removed! ✨");
        
        // Direct local state update for immediate feedback
        if (data.data) {
          setUser(data.data);
        } else {
          setUser(prev => ({ ...prev, profile: "" }));
        }
        
        // Background sync
        fetchProfile().catch(err => console.error("[Profile] Background sync failed:", err));
      } else {
        console.warn("[Profile] API reported failure:", data.message);
        toast.error(data.message || "Failed to remove photo");
      }
    } catch (error) {
      console.error("[Profile] Network/Server Error:", error);
      const msg = error.response?.data?.message || "Networking error occurred";
      toast.error(msg);
    } finally {
      console.log("[Profile] photo removal finished");
      setPhotoLoading(false);
      processingRef.current = false;
    }
  };

  const startCamera = async () => {
    console.log("[Profile] Starting camera...");
    try {
      const s = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1024 },
          height: { ideal: 1024 },
          facingMode: "user"
        } 
      });
      setStream(s);
      setShowCameraModal(true);
      setShowCameraOptions(false);
      console.log("[Profile] Stream initialized");
    } catch (err) {
      console.error("[Profile] Camera Error:", err);
      toast.error("Camera access denied or not available");
    }
  };

  useEffect(() => {
    if (showCameraModal && stream && videoRef.current) {
      console.log("[Profile] Attaching stream to video element");
      videoRef.current.srcObject = stream;
    }
  }, [showCameraModal, stream]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCameraModal(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);
      
      canvasRef.current.toBlob(async (blob) => {
        const file = new File([blob], `capture_${Date.now()}.jpg`, { type: "image/jpeg" });
        await handlePhotoUpload({ target: { files: [file] } });
        stopCamera();
      }, "image/jpeg");
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match"); return;
    }
    setLoading(true);
    try {
      const { data } = await API.post("/auth/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      if (data.success) {
        toast.success("Password updated successfully! 🛡️");
        setShowPasswordChange(false);
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const renderNavbar = () => {
    if (user?.role === "admin") return <AdminNavbar />;
    if (user?.role === "organizer") return <OrganizerNavbar />;
    return <Navbar />;
  };

  const inputClass = "w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-gray-800 placeholder:text-gray-400 text-sm disabled:opacity-60 disabled:cursor-not-allowed";
  const labelClass = "block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1";
  const iconClass = "material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors text-xl";

  return (
    <div className="min-h-screen bg-gray-50 font-display text-gray-800 flex flex-col">
      {renderNavbar()}

      <main className="flex-grow max-w-[1000px] w-full mx-auto px-4 sm:px-8 py-10 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-10">
          
          {/* Sidebar Info */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl shadow-blue-500/5 text-center relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-primary to-blue-700 opacity-5" />
               
               <div className="relative mb-6 inline-block">
                  <div className="size-28 md:size-32 rounded-[2rem] bg-blue-50 text-primary border-4 border-white shadow-xl flex items-center justify-center text-4xl font-black shrink-0 mx-auto overflow-hidden">
                     {user?.profile ? (
                        <img src={`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/media/${user.profile}`} alt="Profile" className="w-full h-full object-cover" />
                     ) : (
                        <>{user?.firstName?.[0]}{user?.lastName?.[0]}</>
                     )}
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" accept="image/*" />
                  <div className="absolute -bottom-1 -right-1 z-20">
                    <button onClick={() => setShowCameraOptions(!showCameraOptions)} className="size-10 bg-white border border-gray-100 text-primary rounded-2xl shadow-lg flex items-center justify-center hover:bg-gray-50 transition-all">
                       <FiCamera />
                    </button>
                    
                    <AnimatePresence>
                      {showCameraOptions && (
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 10 }}
                          className="absolute bottom-12 right-0 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-30 overflow-hidden">
                          <button onClick={startCamera} className="w-full text-left px-4 py-3 hover:bg-blue-50 text-blue-600 rounded-xl flex items-center gap-3 transition-colors text-xs font-bold uppercase tracking-wider">
                            <span className="material-symbols-outlined text-lg text-blue-500">photo_camera</span> Take Photo
                          </button>
                          <button onClick={() => { fileInputRef.current.click(); setShowCameraOptions(false); }} className="w-full text-left px-4 py-3 hover:bg-gray-50 text-gray-700 rounded-xl flex items-center gap-3 transition-colors text-xs font-bold uppercase tracking-wider">
                            <span className="material-symbols-outlined text-lg text-gray-400">upload_file</span> Upload File
                          </button>
                          {user?.profile && (
                            <button onClick={handleRemovePhoto} className="w-full text-left px-4 py-3 hover:bg-red-50 text-red-600 rounded-xl flex items-center gap-3 transition-colors text-xs font-bold uppercase tracking-wider">
                              <span className="material-symbols-outlined text-lg text-red-500">delete</span> Remove Photo
                            </button>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
               </div>
               
               <h2 className="text-2xl font-black text-gray-900 leading-tight">
                  {user?.firstName} {user?.lastName}
               </h2>
               <p className="text-xs font-bold text-primary uppercase tracking-[0.2em] mt-2 mb-6 bg-blue-50 inline-block px-4 py-1.5 rounded-full ring-1 ring-blue-100">
                  {user?.role}
               </p>
               
               <div className="space-y-4 pt-6 border-t border-gray-50">
                  <div className="flex items-center gap-3 text-sm text-gray-500 font-medium">
                     <FiMail className="text-primary" /> <span className="truncate">{user?.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-500 font-medium">
                     <FiPhone className="text-primary" /> {user?.phone || "Not set"}
                  </div>
               </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-2">
               <button onClick={() => setShowPasswordChange(false)} 
                 className={`w-full text-left px-5 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-between ${!showPasswordChange ? "bg-blue-50 text-primary border border-blue-100" : "text-gray-400 hover:bg-gray-50"}`}>
                  Personal Details <span className="material-symbols-outlined text-base">person</span>
               </button>
               <button onClick={() => setShowPasswordChange(true)}
                 className={`w-full text-left px-5 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-between ${showPasswordChange ? "bg-blue-50 text-primary border border-blue-100" : "text-gray-400 hover:bg-gray-50"}`}>
                  Security & Access <span className="material-symbols-outlined text-base">security</span>
               </button>
            </div>

            <div className="p-8 bg-gray-900 rounded-3xl text-white relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-x-1/3 -translate-y-1/3 group-hover:scale-110 transition-transform duration-700" />
               <h4 className="font-black text-lg mb-2 relative z-10 tracking-tight">System Status</h4>
               <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-6 relative z-10">Account active since {new Date(user?.createdAt).getFullYear()}</p>
               <div className="flex items-center gap-2 relative z-10">
                  <div className="size-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">Verified Identity</span>
               </div>
            </div>
          </div>

          {/* Main Form Area */}
          <div className="lg:col-span-6">
            <AnimatePresence mode="wait">
              {!showPasswordChange ? (
                <motion.div key="details" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="bg-white rounded-[2.5rem] p-8 sm:p-10 border border-gray-100 shadow-xl shadow-blue-500/5">
                  <div className="flex justify-between items-center mb-10">
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">Edit <span className="text-primary italic">Profile</span></h3>
                    {!isEditing ? (
                      <button onClick={() => setIsEditing(true)} className="size-10 bg-primary hover:bg-primary-dark text-white rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center transition-all">
                        <FiEdit2 />
                      </button>
                    ) : (
                      <button onClick={() => { setIsEditing(false); setFormData({ ...user }); }} className="size-10 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-2xl flex items-center justify-center transition-all">
                        <FiX />
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleUpdate} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="group relative">
                        <label className={labelClass}>First Name</label>
                        <div className="relative">
                           <span className={iconClass}>person</span>
                           <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} disabled={!isEditing} className={inputClass} />
                        </div>
                      </div>
                      <div className="group relative">
                        <label className={labelClass}>Last Name</label>
                        <div className="relative">
                           <span className={iconClass}>person</span>
                           <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} disabled={!isEditing} className={inputClass} />
                        </div>
                      </div>
                    </div>

                    <div className="group relative">
                      <label className={labelClass}>Phone Reference</label>
                      <div className="relative">
                        <span className={iconClass}>call</span>
                        <input type="tel" name="phone" value={formData.phone} onChange={handleChange} disabled={!isEditing} className={inputClass} />
                      </div>
                    </div>

                    {user?.role === "student" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                        <div className="group relative">
                          <label className={labelClass}>Academic Dept</label>
                          <div className="relative">
                            <span className={iconClass}>school</span>
                            <input type="text" name="department" value={formData.department} onChange={handleChange} disabled={!isEditing} className={inputClass} />
                          </div>
                        </div>
                        <div className="group relative">
                          <label className={labelClass}>Current Year</label>
                          <div className="relative">
                            <span className={iconClass}>event</span>
                            <input type="text" name="year" value={formData.year} onChange={handleChange} disabled={!isEditing} className={inputClass} />
                          </div>
                        </div>
                      </div>
                    )}

                    {user?.role === "organizer" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                        <div className="group relative">
                          <label className={labelClass}>Affiliation</label>
                          <div className="relative">
                            <span className={iconClass}>corporate_fare</span>
                            <input type="text" name="organizationName" value={formData.organizationName} onChange={handleChange} disabled={!isEditing} className={inputClass} />
                          </div>
                        </div>
                        <div className="group relative">
                          <label className={labelClass}>Official Title</label>
                          <div className="relative">
                            <span className={iconClass}>badge</span>
                            <input type="text" name="designation" value={formData.designation} onChange={handleChange} disabled={!isEditing} className={inputClass} />
                          </div>
                        </div>
                      </div>
                    )}

                    {isEditing && (
                      <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} type="submit" disabled={loading}
                        className="w-full bg-primary hover:bg-primary-dark text-white p-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 group mt-8">
                        {loading ? <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Save Changes <FiCheck className="text-lg group-hover:scale-125 transition-transform" /></>}
                      </motion.button>
                    )}
                  </form>
                </motion.div>
              ) : (
                <motion.div key="security" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="bg-white rounded-[2.5rem] p-8 sm:p-10 border border-gray-100 shadow-xl shadow-blue-500/5">
                  <h3 className="text-xl font-black text-gray-900 tracking-tight mb-10">Access <span className="text-primary italic">Security</span></h3>
                  
                   <form onSubmit={handlePasswordChange} className="space-y-6">
                      <div className="group relative">
                         <label className={labelClass}>Current Password</label>
                         <div className="relative">
                            <span className={iconClass}>lock</span>
                            <input type="password" placeholder="••••••••" value={passwordData.currentPassword} onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})} required className={inputClass} />
                         </div>
                      </div>
                      <div className="h-px bg-gray-50 my-6" />
                      <div className="group relative">
                         <label className={labelClass}>New Password</label>
                         <div className="relative">
                            <span className={iconClass}>key</span>
                            <input type="password" placeholder="New Secret" value={passwordData.newPassword} onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})} required minLength={6} className={inputClass} />
                         </div>
                      </div>
                      <div className="group relative">
                         <label className={labelClass}>Confirm New Password</label>
                         <div className="relative">
                            <span className={iconClass}>verified_user</span>
                            <input type="password" placeholder="Repeat Secret" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})} required minLength={6} className={inputClass} />
                         </div>
                      </div>

                      <button type="submit" disabled={loading}
                        className="w-full bg-gray-900 hover:bg-black text-white p-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-3 group mt-8">
                        {loading ? <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Update Security <FiShield className="text-lg group-hover:scale-125 transition-transform" /></>}
                      </button>
                   </form>
                </motion.div>
              )}
            </AnimatePresence>
            
             <button 
                onClick={() => {
                   logout();
                   navigate("/login");
                   toast.success("Logged out successfully");
                }}
                className="w-full mt-8 p-5 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 border border-red-100 group"
             >
                Sign Out <FiLogOut className="text-lg group-hover:translate-x-1 transition-transform" />
             </button>
          </div>
        </div>
      </main>

      {/* Camera Capture Modal */}
      <AnimatePresence>
        {showCameraModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white rounded-[2.5rem] p-8 max-w-lg w-full relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-2 bg-primary" />
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-gray-900 tracking-tight italic uppercase drop-shadow-sm">Capture <span className="text-primary italic">Photo</span></h3>
                <button onClick={stopCamera} className="size-10 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-2xl flex items-center justify-center transition-all shadow-md">
                  <FiX />
                </button>
              </div>

              <div className="relative aspect-square rounded-[2rem] bg-gray-900 overflow-hidden shadow-inner border-[12px] border-gray-50">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
                <div className="absolute inset-0 pointer-events-none border-[2px] border-white/20 rounded-[1.5rem]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-48 md:size-64 border-2 border-dashed border-white/30 rounded-full" />
              </div>

              <div className="flex gap-4 mt-8">
                <button onClick={capturePhoto} disabled={loading} className="flex-grow bg-primary hover:bg-primary-dark text-white p-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 group">
                   {loading ? <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Capture Snapshot <FiCamera className="text-lg group-hover:scale-125 transition-transform" /></>}
                </button>
              </div>
              
              <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-6">Align your face within the frame for best results</p>

              <canvas ref={canvasRef} className="hidden" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Custom Confirmation Modal */}
      <AnimatePresence>
        {showConfirmDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full relative overflow-hidden shadow-2xl text-center">
              <div className="size-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <span className="material-symbols-outlined text-3xl font-bold">delete_forever</span>
              </div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight mb-2">Remove Photo?</h3>
              <p className="text-sm font-medium text-gray-500 mb-8 leading-relaxed">Are you sure you want to delete your profile photo? This action cannot be undone.</p>
              
              <div className="flex gap-3">
                <button onClick={() => setShowConfirmDelete(false)} className="flex-1 px-6 py-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 font-black text-xs uppercase tracking-widest transition-all">
                  Cancel
                </button>
                <button onClick={confirmRemovePhoto} className="flex-1 px-6 py-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-red-200">
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;
