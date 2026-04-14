import { useState, useEffect } from "react";
import { FiCheckCircle, FiXCircle, FiImage, FiSearch, FiClock } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import API from "../../api/axios";
import AdminNavbar from "../../components/common/AdminNavbar";
import toast from "react-hot-toast";

const PaymentVerification = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [selectedScreenshot, setSelectedScreenshot] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const { data } = await API.get("/payments/pending");
      if (data.success) {
        setPayments(data.data);
      }
    } catch (error) {
      toast.error("Failed to load pending payments");
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (id, action) => {
    // action is 'approve' or 'reject'
    if (action === 'reject') {
      if (!window.confirm("Are you sure you want to REJECT this payment? This will cancel the student's registration.")) {
        return;
      }
    }

    setProcessingId(id);
    try {
      const { data } = await API.patch(`/payments/${id}/review`, { action });
      if (data.success) {
        toast.success(`Payment ${action === 'approve' ? 'approved' : 'rejected'}`);
        // Remove from list
        setPayments((prev) => prev.filter((p) => p._id !== id));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${action} payment`);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredPayments = payments.filter((p) => {
    const search = searchTerm.toLowerCase();
    return (
      p.transactionId?.toLowerCase().includes(search) ||
      p.student?.firstName?.toLowerCase().includes(search) ||
      p.student?.lastName?.toLowerCase().includes(search) ||
      p.event?.title?.toLowerCase().includes(search)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 font-display flex flex-col transition-colors">
        <AdminNavbar />
        <div className="flex-grow flex justify-center items-center py-32">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 font-display text-gray-800 dark:text-slate-200 flex flex-col transition-colors">
      <AdminNavbar />

      <main className="flex-grow max-w-[1240px] w-full mx-auto px-4 md:px-8 py-8 md:py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white">Payment <span className="text-primary italic">Verification</span></h2>
            <p className="text-gray-500 dark:text-slate-400 text-sm mt-1 font-medium">Verify UPI transaction screenshots to approve registrations.</p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-center px-4 py-3 w-full md:w-80 transition-colors">
            <FiSearch className="text-gray-400 text-lg mr-3" />
            <input 
              type="text" 
              placeholder="Search txn ID, student, event..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent outline-none text-sm font-medium text-gray-800 dark:text-gray-200 placeholder:text-gray-400"
            />
          </div>
        </div>

        {payments.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-gray-100 dark:border-slate-800 shadow-xl shadow-blue-500/5 p-16 text-center transition-colors">
             <div className="w-24 h-24 bg-green-50 dark:bg-green-900/20 text-green-500 mx-auto rounded-full flex items-center justify-center mb-6 border border-green-100 dark:border-green-900/50">
                <FiCheckCircle className="text-5xl" />
             </div>
             <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">All Caught Up!</h3>
             <p className="text-gray-500 dark:text-slate-400 font-medium max-w-sm mx-auto">There are no pending payments to verify right now. Check back later when students submit new registrations.</p>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="text-center py-20 text-gray-500">No matching payments found for your search.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredPayments.map((payment) => (
                <motion.div 
                  key={payment._id} 
                  initial={{ opacity: 0, scale: 0.95 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  exit={{ opacity: 0, scale: 0.9 }}
                  layout
                  className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-gray-100 dark:border-slate-800 shadow-xl shadow-blue-500/5 flex flex-col transition-colors"
                >
                   {/* Header info */}
                   <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-3">
                         <div className="size-12 rounded-full bg-blue-50 dark:bg-blue-900/20 text-primary border border-blue-100 dark:border-blue-800/50 flex items-center justify-center font-black">
                            {payment.student?.firstName?.[0]}{payment.student?.lastName?.[0]}
                         </div>
                         <div>
                            <h4 className="font-bold text-gray-900 dark:text-white leading-tight">{payment.student?.firstName} {payment.student?.lastName}</h4>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{payment.student?.enrollmentNo}</p>
                         </div>
                      </div>
                      <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 border border-amber-100 dark:border-amber-900/50">
                        <FiClock /> Pending
                      </div>
                   </div>

                   {/* Event Details */}
                   <div className="bg-gray-50 dark:bg-slate-800/50 rounded-2xl p-4 mb-6 border border-gray-100 dark:border-slate-800">
                      <p className="text-[10px] uppercase tracking-widest font-black text-gray-400 mb-1">Event Application</p>
                      <p className="font-bold text-gray-800 dark:text-gray-200 line-clamp-1">{payment.event?.title}</p>
                      <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200 dark:border-slate-700">
                         <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Amount Due</span>
                         <span className="font-black text-primary">₹{payment.event?.price}</span>
                      </div>
                   </div>

                   {/* Payment Proof Details */}
                   <div className="space-y-4 mb-8 flex-grow">
                      <div>
                         <p className="text-[10px] uppercase tracking-widest font-black text-gray-400 mb-1">UPI Transaction ID</p>
                         <div className="font-mono text-xs font-bold bg-gray-50 dark:bg-slate-800 px-3 py-2 rounded-lg border border-gray-100 dark:border-slate-700 text-gray-900 dark:text-white break-all">
                            {payment.transactionId}
                         </div>
                      </div>
                      
                      <div>
                         <p className="text-[10px] uppercase tracking-widest font-black text-gray-400 mb-2">Attached Proof</p>
                         <button 
                            onClick={() => setSelectedScreenshot(`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/media/${payment.paymentScreenshot}`)}
                            className="w-full aspect-video bg-gray-100 dark:bg-slate-800 rounded-xl overflow-hidden relative group border border-gray-200 dark:border-slate-700 block"
                         >
                            <img 
                               src={`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/media/${payment.paymentScreenshot}`} 
                               alt="Payment Proof" 
                               className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                               <span className="bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                  <FiImage /> View Full Image
                               </span>
                            </div>
                         </button>
                      </div>
                   </div>

                   {/* Actions */}
                   <div className="grid grid-cols-2 gap-3 mt-auto">
                      <button 
                         onClick={() => handleReview(payment._id, 'reject')}
                         disabled={processingId === payment._id}
                         className="flex items-center justify-center gap-2 py-3 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 font-black text-[10px] uppercase tracking-widest border border-red-100 dark:border-red-900/50 transition-colors disabled:opacity-50"
                      >
                         <FiXCircle className="text-lg" /> Reject
                      </button>
                      <button 
                         onClick={() => handleReview(payment._id, 'approve')}
                         disabled={processingId === payment._id}
                         className="flex items-center justify-center gap-2 py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-green-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
                      >
                         {processingId === payment._id ? <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><FiCheckCircle className="text-lg" /> Approve</>}
                      </button>
                   </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

      </main>

      {/* Full Screen Image Modal */}
      <AnimatePresence>
         {selectedScreenshot && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                  className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
                  onClick={() => setSelectedScreenshot(null)} 
               />
               <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} 
                  className="relative z-10 w-full max-w-3xl aspect-[4/5] sm:aspect-video bg-black rounded-[2rem] overflow-hidden shadow-2xl"
               >
                  <button onClick={() => setSelectedScreenshot(null)} className="absolute top-4 right-4 size-10 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-red-500 transition-colors z-20">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                  <img src={selectedScreenshot} alt="Full Proof" className="w-full h-full object-contain" />
               </motion.div>
            </div>
         )}
      </AnimatePresence>

    </div>
  );
};

export default PaymentVerification;
