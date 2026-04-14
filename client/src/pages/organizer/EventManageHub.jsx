import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { FiEdit2, FiTrash2, FiUsers, FiClock, FiCalendar, FiMapPin, FiArrowLeft, FiGrid, FiSettings, FiCheckCircle, FiInfo } from "react-icons/fi";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import API from "../../api/axios";
import OrganizerNavbar from "../../components/common/OrganizerNavbar";
import EventBanner from "../../components/common/EventBanner";

const EventManageHub = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [feedback, setFeedback] = useState({ feedbacks: [], avgRating: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      const [eventRes, feedbackRes] = await Promise.all([
        API.get(`/events/${eventId}`),
        API.get(`/feedback/event/${eventId}`)
      ]);

      if (eventRes.data.success) {
        setEvent(eventRes.data.data);
      }
      if (feedbackRes.data.success) {
        setFeedback(feedbackRes.data.data);
      }
    } catch (error) {
      toast.error("Failed to load event details");
      navigate("/organizer/my-events");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAction = () => {
    if (confirmingDelete) {
      deleteEvent();
    } else {
      setConfirmingDelete(true);
      setTimeout(() => setConfirmingDelete(false), 3000);
    }
  };

  const deleteEvent = async () => {
    // ... same logic
  };

  const handleIntimate = async () => {
    try {
      const { data } = await API.post(`/certificates/intimate/${eventId}`);
      if (data.success) {
        toast.success("Students will be intimated about certificates!");
        fetchEventDetails();
      }
    } catch (error) {
      toast.error("Failed to intimate students");
    }
  };

  const handleRequestRelease = async () => {
    try {
      const { data } = await API.post(`/certificates/request-release/${eventId}`);
      if (data.success) {
        toast.success("Request sent to admin for approval");
        fetchEventDetails();
      }
    } catch (error) {
      toast.error("Failed to send request");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <OrganizerNavbar />
        <div className="flex-grow flex flex-col items-center justify-center py-24">
           <div className="w-12 h-12 border-4 border-gray-200 border-t-primary rounded-full animate-spin mb-4" />
           <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-[10px]">Initializing Hub...</p>
        </div>
      </div>
    );
  }

  if (!event) return null;

  const quickActions = [
    { 
      label: "Edit Details", 
      icon: <FiEdit2 />, 
      path: `/organizer/event/${eventId}/edit`,
      color: "bg-blue-50 text-blue-600 border-blue-100",
      hover: "hover:bg-blue-600 hover:text-white"
    },
    { 
      label: "View Attendees", 
      icon: <FiUsers />, 
      path: `/organizer/event/${eventId}/attendees`,
      color: "bg-indigo-50 text-indigo-600 border-indigo-100",
      hover: "hover:bg-indigo-600 hover:text-white"
    },
    { 
      label: "Open Scanner", 
      icon: <span className="material-symbols-outlined text-xl">qr_code_scanner</span>, 
      path: `/organizer/scan/${eventId}`,
      color: "bg-emerald-50 text-emerald-600 border-emerald-100",
      hover: "hover:bg-emerald-600 hover:text-white"
    },
    { 
      label: confirmingDelete ? "Confirm Delete?" : "Delete Event", 
      icon: <FiTrash2 />, 
      action: handleDeleteAction,
      color: confirmingDelete ? "bg-red-600 text-white border-red-600" : "bg-red-50 text-red-600 border-red-100",
      hover: confirmingDelete ? "animate-pulse" : "hover:bg-red-600 hover:text-white"
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-display text-gray-800 flex flex-col">
      <OrganizerNavbar />

      <main className="flex-grow max-w-[1100px] w-full mx-auto px-4 sm:px-8 py-10 md:py-16">
        <button onClick={() => navigate("/organizer/dashboard")} className="group flex items-center gap-2 text-gray-400 hover:text-primary font-bold text-[10px] uppercase tracking-widest mb-10 transition-all">
          <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Header Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-12">
            <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-xl shadow-blue-500/5 relative">
              <div className="h-64 sm:h-80 bg-gray-50 relative overflow-hidden">
                <EventBanner banner={event.banner} title={event.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-10 left-10 right-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-md border border-white/20 ${
                        event.status === 'approved' ? 'bg-emerald-500/80 text-white' : 
                        event.status === 'rejected' ? 'bg-red-500/80 text-white' : 'bg-amber-500/80 text-white'
                      }`}>
                        {event.status}
                      </span>
                      <span className="px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-md border border-white/20 bg-white/20 text-white">
                        {event.category}
                      </span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight tracking-tight">{event.title}</h1>
                  </div>
                  <div className="flex items-center gap-4 text-white/90 font-bold text-xs uppercase tracking-widest mb-1">
                    <div className="flex items-center gap-2"><FiCalendar className="text-primary text-base" /> {new Date(event.date).toLocaleDateString()}</div>
                    <div className="w-1 h-1 rounded-full bg-white/30" />
                    <div className="flex items-center gap-2"><FiClock className="text-primary text-base" /> {event.startTime} - {event.endTime}</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Left Column: Management Tools */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            <section>
              <h3 className="text-gray-900 font-black text-xs uppercase tracking-[0.2em] mb-6 flex items-center gap-2 ml-1">
                <FiGrid className="text-primary" /> Management Hub
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {quickActions.map((action, i) => (
                  action.path ? (
                    <Link key={i} to={action.path} className={`flex items-center gap-5 p-6 rounded-[2rem] border ${action.color} ${action.hover} transition-all group shadow-sm active:scale-95`}>
                      <div className="w-12 h-12 rounded-xl bg-white/50 backdrop-blur-sm flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform">
                        {action.icon}
                      </div>
                      <span className="font-black text-[11px] uppercase tracking-widest">{action.label}</span>
                    </Link>
                  ) : (
                    <button 
                      key={i} 
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        action.action();
                      }} 
                      className={`flex items-center gap-5 p-6 rounded-[2rem] border ${action.color} ${action.hover} transition-all group shadow-sm active:scale-95 text-left cursor-pointer z-10`}
                    >
                      <div className="w-12 h-12 rounded-xl bg-white/50 backdrop-blur-sm flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform">
                        {action.icon}
                      </div>
                      <span className="font-black text-[11px] uppercase tracking-widest">{action.label}</span>
                    </button>
                  )
                ))}
              </div>
            </section>

            <section className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
               <h3 className="font-black text-gray-900 uppercase tracking-widest text-[11px] mb-6 flex items-center gap-2">
                 <FiInfo className="text-primary" /> Event Description
               </h3>
               <p className="text-sm font-medium text-gray-500 leading-relaxed whitespace-pre-wrap">{event.description}</p>
            </section>

            <section className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
              <div className="flex justify-between items-center mb-10">
                <h3 className="font-black text-gray-900 uppercase tracking-widest text-[11px] flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">reviews</span> Student Feedback
                </h3>
                <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-xl border border-amber-100">
                  <span className="text-amber-500 material-symbols-outlined text-sm filled">star</span>
                  <span className="text-xs font-black text-amber-700">{feedback.avgRating.toFixed(1)}</span>
                  <span className="text-[10px] font-bold text-amber-400">/ 5.0</span>
                </div>
              </div>

              {feedback.feedbacks.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                   <p className="text-gray-400 text-xs font-medium uppercase tracking-widest">No feedback received yet</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {feedback.feedbacks.map((f, idx) => (
                    <div key={idx} className="p-6 bg-gray-50 rounded-3xl border border-gray-100 hover:border-blue-200 transition-all group">
                       <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                             <div className="size-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center font-black text-xs text-primary shadow-sm overflow-hidden">
                                {f.student?.profile ? <img src={f.student?.profile} alt="P" className="size-full object-cover" /> : (f.student?.firstName?.[0] || "?")}
                             </div>
                             <div>
                                <p className="text-[11px] font-black text-gray-900 uppercase tracking-wider">{f.student?.firstName} {f.student?.lastName}</p>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{new Date(f.createdAt).toLocaleDateString()}</p>
                             </div>
                          </div>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span key={star} className={`material-symbols-outlined text-[14px] ${star <= f.rating ? "text-amber-400 filled" : "text-gray-200"}`}>star</span>
                            ))}
                          </div>
                       </div>
                       <p className="text-[11px] font-medium text-gray-600 leading-relaxed pl-1">{f.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
               <div className="flex justify-between items-center mb-6">
                 <h3 className="font-black text-gray-900 uppercase tracking-widest text-[11px] flex items-center gap-2">
                   <span className="material-symbols-outlined text-primary text-lg">workspace_premium</span> Certification Control
                 </h3>
                 {event.certificateStatus !== 'none' && (
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                      event.certificateStatus === 'approved' ? 'bg-emerald-100 text-emerald-600' :
                      event.certificateStatus === 'requested' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {event.certificateStatus}
                    </span>
                 )}
                  {event.certificateRequestCount > 0 && event.certificateStatus !== 'approved' && (
                    <span className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-red-100 text-red-600 animate-pulse">
                      {event.certificateRequestCount} Requests
                    </span>
                  )}
               </div>

               <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                  <p className="text-[11px] font-medium text-gray-500 leading-relaxed mb-6">
                    {event.certificateStatus === 'none' ? "Hosting an event that provides certificates? Let your students know so more of them register!" :
                     event.certificateStatus === 'intimated' ? "The event has concluded or is ongoing. You can now request the admin to verify attendees and release certificates." :
                     event.certificateStatus === 'requested' ? "Your request is pending admin approval. Certificates will be available to students once approved." :
                     "All certificates have been successfully released to the attendees' vaults."}
                  </p>

                  <div className="flex gap-4">
                    {event.certificateStatus === 'none' && (
                      <button onClick={handleIntimate} className="flex-grow py-3 px-6 bg-primary text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:shadow-lg transition-all active:scale-95">
                        Intimate Participation Certificates
                      </button>
                    )}
                    {event.certificateStatus === 'intimated' && (
                      <button onClick={handleRequestRelease} className="flex-grow py-3 px-6 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:shadow-lg transition-all active:scale-95">
                        Request Admin Release
                      </button>
                    )}
                    {event.certificateStatus === 'requested' && (
                      <button disabled className="flex-grow py-3 px-6 bg-gray-200 text-gray-400 rounded-xl font-black text-[10px] uppercase tracking-widest cursor-not-allowed">
                        Waiting for Admin Approval...
                      </button>
                    )}
                    {event.certificateStatus === 'approved' && (
                      <div className="flex-grow py-3 px-6 bg-emerald-50 text-emerald-600 rounded-xl font-black text-[10px] uppercase tracking-widest text-center border border-emerald-100">
                         Certificates Released ✅
                      </div>
                    )}
                  </div>
               </div>
            </section>
          </div>

          {/* Right Column: Information & Stats */}
          <div className="lg:col-span-4 flex flex-col gap-8">
             <section className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
                <h3 className="font-black text-gray-900 uppercase tracking-widest text-[11px] mb-6 flex items-center gap-2">
                  <FiSettings className="text-primary" /> Detailed Info
                </h3>
                <div className="space-y-6">
                   <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100">
                        <FiMapPin className="text-primary" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Venue</p>
                        <p className="text-xs font-black text-gray-800 mt-0.5">{event.venue?.name}</p>
                        <p className="text-[10px] font-medium text-gray-500 mt-0.5">{event.venue?.location}</p>
                      </div>
                   </div>
                   <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100">
                        <FiUsers className="text-primary" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Attendance</p>
                        <p className="text-xs font-black text-gray-800 mt-0.5">{event.currentParticipants || 0} / {event.maxParticipants} Registered</p>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                           <div className="h-full bg-primary" style={{ width: `${Math.min(100, ((event.currentParticipants || 0) / event.maxParticipants) * 100)}%` }} />
                        </div>
                      </div>
                   </div>
                   <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3">
                      <FiCheckCircle className="text-emerald-500 text-lg" />
                      <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest">Event is Live & Trackable</p>
                   </div>
                </div>
             </section>

             <div className="bg-primary rounded-[2rem] p-8 text-white shadow-xl shadow-primary/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 font-black text-8xl pointer-events-none group-hover:scale-110 transition-transform">?</div>
                <h4 className="text-lg font-black mb-2 relative z-10">Need Help?</h4>
                <p className="text-xs text-white/80 font-medium leading-relaxed mb-6 relative z-10">Contact the admin support if you're facing issues with venue rescheduling or registration payouts.</p>
                <Link to="/support" className="inline-block px-6 py-3 bg-white text-primary rounded-xl font-black text-[10px] uppercase tracking-widest relative z-10 hover:shadow-lg transition-all active:scale-95">Support Center</Link>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EventManageHub;
