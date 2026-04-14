import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { FiCalendar, FiClock, FiMapPin, FiTag, FiUser, FiArrowLeft, FiCircle, FiMail, FiPhone } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/common/Navbar";
import EventBanner from "../../components/common/EventBanner";
import toast from "react-hot-toast";

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState(null);

  useEffect(() => {
    fetchEventDetails();
    if (user && user.role === 'student') {
      checkRegistrationStatus();
    }
  }, [id, user]);

  const checkRegistrationStatus = async () => {
    try {
      const { data } = await API.get(`/registrations/check/${id}`);
      if (data.success && data.data.isRegistered) {
        setRegistrationStatus(data.data);
      }
    } catch (error) {
      console.error("Check registration error:", error);
    }
  };

  const fetchEventDetails = async () => {
    try {
      const { data } = await API.get(`/events/${id}`);
      if (data.success) setEvent(data.data);
    } catch (error) {
      toast.error("Event not found");
      navigate("/events");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!user) {
      toast.error("Please login to register");
      navigate("/login");
      return;
    }

    if(event.isPaid) {
       navigate(`/payment/${event._id}`);
       return;
    }

    setRegistering(true);
    try {
      const { data } = await API.post(`/registrations`, { eventId: id });
      if (data.success) {
        toast.success("Successfully registered! 🎉");
        navigate("/my-registrations");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col transition-colors">
        <Navbar />
        <div className="flex-grow flex items-center justify-center p-20">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const isEventPast = new Date(event.date) < new Date();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 font-display text-gray-800 dark:text-slate-200 transition-colors">
      <Navbar />

      <main className="max-w-[1140px] w-full mx-auto px-4 sm:px-8 py-8 md:py-12">
        <Link to="/events" className="group flex items-center gap-2 text-gray-400 hover:text-primary font-bold text-xs uppercase tracking-widest mb-8 transition-all">
          <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Back to Events
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-8">
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
              className="relative aspect-video rounded-3xl overflow-hidden bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-lg transition-colors">
              <EventBanner banner={event.banner} title={event.title} />
              <div className="absolute top-6 left-6 flex flex-wrap gap-2">
                 <span className={`px-4 py-2 rounded-2xl backdrop-blur-md shadow-xl text-[10px] font-black uppercase tracking-widest text-white ring-1 ring-white/20 ${event.isPaid ? "bg-indigo-600/80" : "bg-emerald-600/80"}`}>
                   {event.isPaid ? `₹${event.price}` : 'Free Entry'}
                 </span>
                  <span className="px-4 py-2 rounded-2xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-md shadow-xl border border-gray-100 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest text-primary dark:text-blue-400">
                     {event.category === 'technical' ? 'Tech' : event.category}
                  </span>
                  {event.providesCertificate && (
                    <span className="px-4 py-2 rounded-2xl bg-amber-500/90 backdrop-blur-md shadow-xl text-[10px] font-black uppercase tracking-widest text-white ring-1 ring-white/20 flex items-center gap-2">
                       <span className="material-symbols-outlined text-[14px]">workspace_premium</span>
                       Certificate Included
                    </span>
                  )}
               </div>
            </motion.div>

            <div className="space-y-6">
              <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white leading-tight tracking-tight">
                {event.title}
              </h1>

              <div className="flex flex-wrap items-center gap-6 p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm transition-colors">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center border border-blue-100 dark:border-blue-800">
                      <FiCalendar className="text-xl" />
                   </div>
                   <div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">Date & Day</p>
                     <p className="text-sm font-bold text-gray-900 dark:text-white">{new Date(event.date).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
                   </div>
                </div>
                
                <div className="h-10 w-px bg-gray-100 dark:bg-slate-800 hidden md:block" />

                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center border border-purple-100 dark:border-purple-800">
                      <FiClock className="text-xl" />
                   </div>
                   <div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">Time Window</p>
                     <p className="text-sm font-bold text-gray-900 dark:text-white">{event.startTime} – {event.endTime}</p>
                   </div>
                </div>

                <div className="h-10 w-px bg-gray-100 dark:bg-slate-800 hidden lg:block" />

                <div className="flex items-center gap-4 flex-grow">
                   <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-100 dark:border-emerald-800">
                      <FiMapPin className="text-xl" />
                   </div>
                   <div className="flex-grow">
                     <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">Location</p>
                     <p className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[200px]">{event.venue?.name || "TBA"}</p>
                   </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm transition-colors">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400 dark:text-slate-500 mb-6 flex items-center gap-2">
                   <FiTag className="text-primary dark:text-blue-400" /> Event Brief
                </h3>
                <p className="text-gray-600 dark:text-slate-300 leading-relaxed font-medium whitespace-pre-line text-lg">
                  {event.description}
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar / Actions */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-xl transition-colors sticky top-28">
               <div className="mb-8">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary dark:text-blue-400 mb-3">Organizer Profile</p>
                  <div className="flex items-center gap-4 group">
                     <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-primary dark:text-blue-400 border border-blue-100 dark:border-blue-800 flex items-center justify-center transition-all duration-300">
                        <FiUser className="text-2xl" />
                     </div>
                     <div>
                        <h4 className="font-black text-gray-900 dark:text-white text-lg leading-tight">{event.organizer?.firstName} {event.organizer?.lastName}</h4>
                        <p className="text-xs font-bold text-gray-400 dark:text-slate-500 mt-1 uppercase tracking-wider">{event.organizer?.organizationName || "Official Committee"}</p>
                     </div>
                  </div>
               </div>

               <div className="space-y-4 pt-6 border-t border-gray-50 dark:border-slate-800">
                  <div className="flex justify-between items-center text-sm">
                     <span className="font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest text-[10px]">Max Capacity</span>
                     <span className="font-black text-gray-900 dark:text-white">{event.capacity || "Unlimited"}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                     <span className="font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest text-[10px]">Registered</span>
                     <span className="font-black text-primary dark:text-blue-400">{(event.registeredStudents?.length || 0) + (event.paidAttendees?.length || 0)}</span>
                  </div>
               </div>

               {isEventPast ? (
                 <div className="mt-10 p-5 rounded-2xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 text-center">
                    <p className="text-gray-400 dark:text-slate-500 font-black text-xs uppercase tracking-widest">Entry Closed</p>
                    <p className="text-gray-400 dark:text-slate-600 text-[10px] mt-1">This event has already ended.</p>
                 </div>
               ) : user?.role === "admin" ? (
                 <div className="mt-10 p-6 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 text-center">
                    <p className="text-amber-600 dark:text-amber-400 font-black text-xs uppercase tracking-widest">Admin Access</p>
                    <p className="text-amber-500 dark:text-amber-600 text-[10px] mt-2 font-bold leading-relaxed uppercase tracking-wider">Administrators cannot participate in campus events.</p>
                 </div>
               ) : registrationStatus ? (
                 <div className="mt-10 p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 text-center flex flex-col items-center">
                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-800/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-3">
                       <span className="material-symbols-outlined text-2xl">check_circle</span>
                    </div>
                    <p className="text-emerald-600 dark:text-emerald-400 font-black text-sm uppercase tracking-widest">{
                      registrationStatus.status === 'cancelled' ? 'Registration Cancelled' :
                      registrationStatus.paymentStatus === 'pending' ? 'Verification Pending' :
                      registrationStatus.paymentStatus === 'failed' ? 'Payment Failed' :
                      'Already Registered'
                    }</p>
                    <Link to="/my-registrations" className="text-emerald-700 dark:text-emerald-300 text-[11px] mt-2 font-bold underline hover:text-emerald-800 dark:hover:text-emerald-200">View My Registrations</Link>
                 </div>
               ) : (
                 <button
                    onClick={handleRegister}
                    disabled={registering}
                    className="w-full mt-10 bg-primary hover:bg-primary-dark text-white p-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-50 py-5 shadow-lg shadow-primary/25 hover:shadow-primary/40 group flex items-center justify-center gap-3"
                 >
                    {registering ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        {event.isPaid ? 'Proceed to Payment' : 'Register'}
                        <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">confirmation_number</span>
                      </>
                    )}
                 </button>
               )}

               <p className="text-[10px] text-gray-400 dark:text-slate-500 text-center mt-6 font-bold leading-relaxed px-4">
                 By registering, you agree to follow the campus code of conduct during the event.
               </p>
            </div>

            <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-3xl text-white shadow-lg overflow-hidden relative">
               <div className="absolute -right-8 -bottom-8 opacity-10">
                  <FiCircle className="text-[120px]" />
               </div>
               <h4 className="font-black text-lg mb-2 relative z-10 tracking-tight">Support Event?</h4>
               <p className="text-white/60 text-[11px] mb-6 font-medium relative z-10 leading-relaxed uppercase tracking-widest">Contact organizer for sponsorship or volunteering opportunities.</p>
                <button 
                  onClick={() => setShowContact(!showContact)}
                  className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-black text-[10px] uppercase tracking-[0.2em] py-3 rounded-xl transition-all relative z-10"
                >
                  {showContact ? 'Hide Contacts' : 'Contact Now'}
                </button>

                <AnimatePresence>
                  {showContact && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-6 space-y-4 relative z-10 overflow-hidden"
                    >
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1">Email Address</p>
                        <a href={`mailto:${event.organizer?.email}`} className="text-sm font-bold text-white hover:text-primary transition-colors">{event.organizer?.email || "Not provided"}</a>
                      </div>
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1">Phone Number</p>
                        <a href={`tel:${event.organizer?.phone}`} className="text-sm font-bold text-white hover:text-primary transition-colors">{event.organizer?.phone || "Not provided"}</a>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EventDetails;