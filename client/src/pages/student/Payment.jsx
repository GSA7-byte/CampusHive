import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiCheck, FiArrowLeft, FiShield, FiInfo, FiLock, FiUpload, FiImage } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import API from "../../api/axios";
import Navbar from "../../components/common/Navbar";
import toast from "react-hot-toast";

// Import the saved QR code
import adminQr from "../../assets/payment/admin_qr.jpg";

const Payment = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Form states
  const [transactionId, setTransactionId] = useState("");
  const [screenshot, setScreenshot] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      const { data } = await API.get(`/events/${eventId}`);
      if (data.success) setEvent(data.data);
    } catch (error) {
      toast.error("Event not found");
      navigate("/events");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size should be less than 5MB");
        return;
      }
      setScreenshot(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handlePayment = async () => {
    if (!transactionId.trim()) {
      toast.error("Please enter the UPI Transaction ID");
      return;
    }
    if (!screenshot) {
      toast.error("Please upload the payment screenshot");
      return;
    }

    setProcessing(true);
    try {
      const formData = new FormData();
      formData.append("eventId", eventId);
      formData.append("transactionId", transactionId.trim());
      formData.append("paymentScreenshot", screenshot);

      const { data } = await API.post(`/registrations/submit-payment`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (data.success) {
        toast.success("Payment submitted successfully! 🎉");
        navigate("/my-registrations");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Payment submission failed");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex flex-col transition-colors">
       <Navbar />
       <div className="flex-grow flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
       </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 font-display text-gray-800 dark:text-slate-200 flex flex-col transition-colors">
      <Navbar />

      <main className="flex-grow max-w-[1100px] w-full mx-auto px-4 sm:px-8 py-10 md:py-16">
        <button onClick={() => navigate(-1)} className="group flex items-center gap-2 text-gray-400 hover:text-primary font-bold text-[10px] uppercase tracking-widest mb-10 transition-all">
          <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Cancel Payment
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Main Payment Section */}
          <div className="lg:col-span-7 space-y-8">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 sm:p-10 border border-gray-100 dark:border-slate-800 shadow-xl shadow-blue-500/5 transition-colors">
               
               <div className="mb-8">
                 <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Complete <span className="text-primary italic">Payment</span></h2>
                 <p className="text-gray-500 dark:text-slate-400 font-medium text-sm mt-1">Scan the QR code to pay using any UPI app securely.</p>
               </div>

               {/* Admin QR Code Area */}
               <div className="flex flex-col items-center justify-center p-8 bg-gray-50/50 dark:bg-slate-800/50 rounded-3xl border border-gray-100/50 dark:border-slate-700/50 mb-10">
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6">
                     <img src={adminQr} alt="Admin UPI QR Code" className="w-48 h-48 object-contain rounded-xl" />
                  </div>
                  <div className="text-center space-y-1">
                     <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">Official CampusHive UPI</p>
                     <p className="font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2">
                        ds9956552655-1@oksbi
                        <button className="text-primary hover:text-blue-600 transition-colors" 
                           onClick={() => {
                             navigator.clipboard.writeText("ds9956552655-1@oksbi");
                             toast.success("UPI ID copied!");
                           }} title="Copy UPI ID">
                           <span className="material-symbols-outlined text-sm">content_copy</span>
                        </button>
                     </p>
                  </div>
               </div>

               {/* Transaction Details Form */}
               <div className="space-y-6">
                 <div className="group relative">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 mb-2 ml-1">UPI Transaction ID / UTR</label>
                    <div className="relative">
                       <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xl">receipt_long</span>
                       <input 
                         type="text" 
                         value={transactionId}
                         onChange={(e) => setTransactionId(e.target.value)}
                         placeholder="e.g. 123456789012" 
                         className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400" 
                       />
                    </div>
                 </div>

                 <div className="group relative pt-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 mb-2 ml-1 flex items-center gap-2">
                      Payment Screenshot Proof <FiInfo className="text-primary" title="Upload the successful payment screen clearly showing the transaction ID and amount." />
                    </label>
                    
                    <div className="relative w-full border-2 border-dashed border-gray-200 dark:border-slate-700 hover:border-primary/50 transition-colors rounded-2xl overflow-hidden bg-gray-50/50 dark:bg-slate-800/50">
                       <input 
                         type="file" 
                         accept="image/*" 
                         onChange={handleFileChange}
                         className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                       />
                       
                       <div className="p-6 flex flex-col items-center justify-center gap-3 text-center pointer-events-none">
                          {preview ? (
                            <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-white/50 border border-gray-100">
                               <img src={preview} alt="Proof preview" className="w-full h-full object-contain" />
                               <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                  <span className="text-white text-[10px] font-black uppercase tracking-widest bg-primary px-3 py-1.5 rounded-full">Change File</span>
                               </div>
                            </div>
                          ) : (
                            <>
                              <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-900 shadow-sm border border-gray-100 dark:border-slate-800 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                <FiUpload className="text-xl" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-gray-700 dark:text-slate-300">Click or drag image to upload</p>
                                <p className="text-xs text-gray-400 font-medium mt-1">JPEG, PNG up to 5MB</p>
                              </div>
                            </>
                          )}
                       </div>
                    </div>
                 </div>
               </div>

               <div className="mt-10">
                  <button onClick={handlePayment} disabled={processing}
                     className="w-full bg-primary hover:bg-primary-dark text-white p-4 sm:p-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-primary/25 hover:shadow-primary/40 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50">
                     {processing ? <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Submit for Verification <FiCheck className="text-lg" /></>}
                  </button>
                  <p className="text-center text-[10px] font-bold text-gray-400 dark:text-slate-500 mt-4 leading-relaxed px-4">
                     Your registration will be confirmed once the admin verifies the payment. This usually takes 1-2 hours.
                  </p>
               </div>
            </motion.div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
            <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-x-1/2 -translate-y-1/2" />
               <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white/40 mb-8">Summary of Order</h3>
               
               <div className="space-y-6">
                  <div className="flex gap-4">
                     <div className="size-14 bg-white/10 rounded-2xl overflow-hidden shrink-0 border border-white/10">
                        {event.bannerUrl ? (
                          <img src={event.bannerUrl} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-white/5"><FiImage className="text-white/30" /></div>
                        )}
                     </div>
                     <div className="min-w-0">
                        <h4 className="font-black text-base leading-tight truncate">{event.title}</h4>
                        <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mt-1">{event.category} Event</p>
                     </div>
                  </div>

                  <div className="pt-6 border-t border-white/10 space-y-4">
                     <div className="flex justify-between text-xs font-bold text-white/60">
                        <span className="uppercase tracking-widest">Base Amount</span>
                        <span>₹{event.price}</span>
                     </div>
                     <div className="flex justify-between text-xs font-bold text-white/60">
                        <span className="uppercase tracking-widest">Platform Fee</span>
                        <span className="text-emerald-400">₹0.00</span>
                     </div>
                     <div className="flex justify-between items-center pt-4 border-t border-white/10">
                        <span className="font-black text-sm uppercase tracking-widest">Total Payable</span>
                        <span className="text-2xl font-black text-primary">₹{event.price}</span>
                     </div>
                  </div>
               </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-gray-100 dark:border-slate-800 shadow-sm flex items-start gap-4 transition-colors">
               <div className="size-10 bg-amber-50 dark:bg-amber-900/20 text-amber-500 rounded-xl flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-900/50">
                  <FiShield />
               </div>
               <div>
                  <h5 className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-widest mb-1">Verification Process</h5>
                  <p className="text-[11px] text-gray-500 dark:text-slate-400 leading-relaxed font-medium">To prevent fraud, all payments manually verified by admins against the submitted transaction ID before your pass is generated.</p>
               </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Payment;
