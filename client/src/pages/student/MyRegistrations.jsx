import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FiCalendar, FiMapPin, FiClock, FiCheckCircle, FiXCircle, FiInfo, FiCopy, FiCircle, FiZap, FiAward, FiMessageSquare } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import API from "../../api/axios";
import Navbar from "../../components/common/Navbar";
import EventBanner from "../../components/common/EventBanner";
import toast from "react-hot-toast";

const MyRegistrations = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQrCode, setSelectedQrCode] = useState(null);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      const { data } = await API.get("/registrations/my-registrations");
      if (data.success) {
        setRegistrations(Array.isArray(data.data) ? data.data : []);
      }
    } catch (error) {
      console.error("[MyRegistrations] Fetch Error:", error);
      toast.error("Failed to load registrations");
    } finally {
      setLoading(false);
    }
  };

  const claimCertificate = async (eventId, studentId) => {
    try {
      const toastId = toast.loading("Generating certificate...");
      const { data } = await API.post('/certificates/generate', { eventId, studentId });
      
      if (data.success) {
        toast.success("Certificate claimed successfully! Check your vault.", { id: toastId });
      } else {
        toast.error("Could not claim certificate.", { id: toastId });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to generate certificate");
    }
  };

  const cancelRegistration = async (id) => {
     if(!window.confirm("Are you sure you want to cancel this registration?")) return;
     try {
       const { data } = await API.patch(`/registrations/${id}/cancel`);
       if (data.success) {
         toast.success("Registration cancelled");
         fetchRegistrations();
       }
     } catch (error) {
       toast.error(error.response?.data?.message || "Failed to cancel");
     }
  };

   const requestCertificate = async (eventId) => {
     try {
       const toastId = toast.loading("Sending request to organizer...");
       const { data } = await API.post('/certificates/request-reissue', { eventId });
       if (data.success) {
         toast.success("Nudge sent! The organizer has been notified. 📢", { id: toastId });
         fetchRegistrations();
       }
     } catch (error) {
       toast.error(error.response?.data?.message || "Failed to send request");
     }
   };

    const handleDownloadGuide = () => {
      window.open("http://localhost:4000/media/guides/student_guide.pdf", "_blank");
    };

   const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      month: "short", day: "numeric", weekday: "short",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 font-display text-gray-800 dark:text-slate-200 flex flex-col transition-colors">
      <Navbar />

      <main className="flex-grow max-w-[1240px] w-full mx-auto px-4 sm:px-8 py-10">
        <div className="mb-10">
          <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Your <span className="text-primary">Journey</span></h2>
          <p className="text-gray-500 dark:text-slate-400 font-medium text-sm mt-1">Manage your event participations and history.</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-20">
             <div className="w-12 h-12 border-4 border-gray-200 border-t-primary rounded-full animate-spin mb-4" />
             <p className="text-gray-400 dark:text-slate-500 font-bold uppercase tracking-widest text-[10px]">Syncing Records...</p>
          </div>
        ) : registrations.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col items-center">
             <div className="w-20 h-20 bg-gray-50 dark:bg-slate-800 text-gray-200 dark:text-slate-700 rounded-full flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-5xl">inventory_2</span>
             </div>
             <p className="text-gray-400 dark:text-slate-500 font-bold text-lg">No active registrations</p>
             <p className="text-gray-400 dark:text-slate-600 text-sm mt-1 mb-8">You haven't signed up for any events yet.</p>
             <Link to="/events" className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-primary/20">
               Discover Events
             </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <AnimatePresence>
              {registrations.map((reg) => (
                <motion.div 
                  key={reg._id} 
                  layout 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group p-4 flex flex-col md:flex-row gap-6"
                >
                  <div className="h-44 md:w-60 bg-gray-50 dark:bg-slate-800 rounded-2xl overflow-hidden shrink-0">
                    <EventBanner banner={reg.event?.banner} title={reg.event?.title} className="group-hover:scale-110 transition-transform duration-700" />
                  </div>

                  <div className="flex flex-col flex-grow py-2">
                     <div className="flex items-center gap-3 mb-3">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors ${
                          reg.status === 'confirmed' || reg.status === 'attended' || reg.status === 'registered' || reg.paymentStatus === 'completed'
                            ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800" 
                            : "bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-700"
                        }`}>
                          {reg.status}
                        </span>
                        
                        {reg.paymentStatus === 'pending' && (
                          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800 flex items-center gap-1">
                            <FiClock /> Verify Pending
                          </span>
                        )}
                        {reg.paymentStatus === 'failed' && (
                          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800 flex items-center gap-1">
                            <FiXCircle /> Payment Failed
                          </span>
                        )}

                        <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-auto">
                          {reg.event?.category === 'technical' ? 'Tech' : reg.event?.category}
                        </span>
                     </div>

                     <h3 className="text-xl font-black text-gray-900 dark:text-white mb-4 line-clamp-2 group-hover:text-primary dark:group-hover:text-blue-400 transition-colors">
                        {reg.event?.title || "Event deleted"}
                     </h3>

                     <div className="space-y-2 mb-6">
                        <div className="flex items-center gap-3 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">
                           <FiCalendar className="text-primary dark:text-blue-400" /> {reg.event ? formatDate(reg.event.date) : "N/A"}
                        </div>
                        <div className="flex items-center gap-3 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">
                           <FiMapPin className="text-primary dark:text-blue-400 shrink-0" /> <span className="truncate">{reg.event?.venue?.name || "Venue TBA"}</span>
                        </div>
                     </div>

                     <div className="mt-auto pt-4 border-t border-gray-50 dark:border-slate-800 flex flex-wrap gap-2">
                        {reg.status !== 'cancelled' && (
                          <button 
                            onClick={() => setSelectedQrCode(reg.qrCode)} 
                            className="flex-grow text-center py-2.5 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-800 dark:text-slate-200 font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all border border-gray-200 dark:border-slate-700 flex items-center justify-center gap-2"
                          >
                             <FiZap className="text-primary" /> Pass
                          </button>
                        )}
                        
                        {reg.status === 'registered' && (
                          <button 
                            onClick={() => cancelRegistration(reg._id)} 
                            className="flex-grow py-2.5 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all border border-red-200 dark:border-red-800 flex items-center justify-center gap-2"
                          >
                             <FiXCircle /> Cancel
                          </button>
                        )}

                        {reg.event?.providesCertificate && reg.status === 'attended' && (
                          <div className="flex gap-2 w-full mt-2">
                            <button 
                              onClick={() => claimCertificate(reg.event?._id, reg.student)} 
                              className="flex-1 py-2.5 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all border border-emerald-200 dark:border-emerald-800 flex items-center justify-center gap-1.5"
                            >
                               <FiAward /> Claim
                            </button>
                            <button 
                              onClick={() => requestCertificate(reg.event?._id)} 
                              className={`flex-1 py-2.5 font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all border flex items-center justify-center gap-1.5 ${
                                reg.certificateRequested 
                                ? "bg-blue-600 text-white border-blue-600" 
                                : "bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                              }`}
                            >
                               <span className="material-symbols-outlined text-[16px]">campaign</span> Nudge
                            </button>
                          </div>
                        )}

                        {reg.status === 'attended' && (
                          <Link 
                            to={`/feedback/${reg.event?._id}`}
                            className="flex-grow py-2.5 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-400 font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all border border-purple-200 dark:border-purple-800 flex items-center justify-center gap-2"
                          >
                             <FiMessageSquare /> Review
                          </Link>
                        )}
                     </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        <div className="mt-16 p-8 bg-blue-50 dark:bg-slate-900 rounded-[2.5rem] border border-blue-100 dark:border-slate-800 flex flex-col md:flex-row items-center gap-6 transition-colors">
           <div className="size-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-slate-700 shadow-sm shrink-0">
              <FiInfo className="text-3xl" />
           </div>
           <div>
              <h4 className="font-black text-gray-900 dark:text-white mb-1">Entry Guidelines</h4>
              <p className="text-gray-500 dark:text-slate-400 text-sm font-medium leading-relaxed">Always carry your digital pass or a printed copy for QR verification at the venue. For paid events, ensure your payment status is 'Completed'.</p>
           </div>
           <button 
             onClick={handleDownloadGuide}
             className="md:ml-auto w-full md:w-auto bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-primary dark:text-blue-400 font-black text-[10px] uppercase tracking-widest px-8 py-4 rounded-xl transition-all border border-blue-100 dark:border-slate-700 shadow-sm"
           >
             Download Guide
           </button>
        </div>
      </main>

      <AnimatePresence>
        {selectedQrCode && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedQrCode(null)} />
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-12 w-full max-w-sm relative z-10 shadow-2xl flex flex-col items-center text-center transition-colors">
                <button onClick={() => setSelectedQrCode(null)} className="absolute top-6 right-6 size-10 flex items-center justify-center rounded-full bg-gray-50 dark:bg-slate-800 text-gray-400 hover:text-red-500 transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
                <div className="size-16 bg-blue-50 dark:bg-blue-900/20 text-primary dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-4xl">qr_code_scanner</span>
                </div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Digital Pass</h3>
                <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-8 max-w-[200px]">Show this QR code at the event entrance for verification.</p>
                <div className="p-4 bg-white rounded-3xl shrink-0 pointer-events-none select-none shadow-inner border border-gray-100">
                  {selectedQrCode ? (
                    <img src={selectedQrCode} alt="Registration QR Code" className="w-48 h-48 object-contain" />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center text-gray-400 text-xs">QR Code Not Available</div>
                  )}
                </div>
                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-800 w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary dark:text-blue-400">
                  <span className="material-symbols-outlined text-[16px]">encrypted</span> Secure & Unique
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MyRegistrations;