import { useState, useEffect } from "react";
import { FiAward, FiDownload, FiInfo, FiExternalLink } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import API from "../../api/axios";
import Navbar from "../../components/common/Navbar";
import toast from "react-hot-toast";

const Certificates = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verifyCode, setVerifyCode] = useState("");
  const [verificationResult, setVerificationResult] = useState(null);
  const [isVerifyingLoading, setIsVerifyingLoading] = useState(false);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      const { data } = await API.get("/certificates/my-certificates");
      if (data.success) setCertificates(data.data);
    } catch (error) {
      console.error("Fetch certificates failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (code) => {
    const codeToVerify = code || verifyCode.trim();
    if (!codeToVerify) return toast.error("Please enter a verification code");
    setIsVerifyingLoading(true);
    setVerificationResult(null);
    try {
      const { data } = await API.get(`/certificates/verify/${codeToVerify}`);
      if (data.success) {
        setVerificationResult(data.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid or Expired Certificate ID");
    } finally {
      setIsVerifyingLoading(false);
    }
  };

  const verifyCertificate = (certId) => {
    setVerifyCode(certId);
    setVerifying(true);
    setVerificationResult(null);
    // Auto-verify with the correct ID
    handleVerify(certId);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 font-display text-gray-800 dark:text-slate-200 flex flex-col relative overflow-x-hidden transition-colors">
      <Navbar />

      {/* Verification Modal */}
      <AnimatePresence>
        {verifying && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              onClick={() => { setVerifying(false); setVerificationResult(null); }}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" 
            />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100"
            >
              <div className="p-8 md:p-10">
                <div className="flex justify-between items-center mb-8">
                   <h3 className="text-2xl font-black text-gray-900 tracking-tight">Verify <span className="text-primary">Authenticity</span></h3>
                   <button onClick={() => { setVerifying(false); setVerificationResult(null); }} className="size-10 rounded-full bg-gray-50 dark:bg-slate-800 flex items-center justify-center text-gray-400 dark:text-slate-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                     <span className="material-symbols-outlined text-lg">close</span>
                   </button>
                </div>

                <div className="space-y-6">
                  <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100/50 group focus-within:border-primary transition-all">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-3">Certificate Verification ID</p>
                    <input 
                      type="text" 
                      value={verifyCode}
                      onChange={(e) => setVerifyCode(e.target.value)}
                      placeholder="Paste your certificate ID here..."
                      className="w-full bg-transparent border-none text-gray-900 font-bold placeholder:text-gray-300 focus:ring-0 p-0 text-lg"
                    />
                  </div>

                  <button 
                    onClick={() => handleVerify()}
                    disabled={isVerifyingLoading}
                    className="w-full bg-primary hover:bg-primary-dark text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-[0.98]"
                  >
                    {isVerifyingLoading ? <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Validate Credentials"}
                  </button>
                </div>

                {verificationResult && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-8 pt-8 border-t border-gray-100">
                    <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 flex gap-4">
                       <div className="size-12 rounded-2xl bg-white border border-emerald-100 flex items-center justify-center text-emerald-500 shadow-sm shrink-0">
                          <FiAward className="text-2xl" />
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Authenticated Certificate</p>
                          <h4 className="text-lg font-black text-gray-900 leading-tight">{verificationResult.student?.firstName} {verificationResult.student?.lastName}</h4>
                          <p className="text-[11px] font-bold text-gray-500 mt-1">Has fulfilled all requirements for <span className="text-primary">"{verificationResult.event?.title}"</span></p>
                          <div className="mt-3 py-1.5 px-3 bg-white/50 rounded-lg border border-emerald-100 inline-block">
                             <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">Status: Verified & Valid</p>
                          </div>
                       </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="flex-grow max-w-[1140px] w-full mx-auto px-4 sm:px-8 py-10">
        <div className="mb-10">
          <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
             Achievement <span className="text-primary">Vault</span>
          </h2>
          <p className="text-gray-500 font-medium text-sm mt-1">Collect and showcase your official campus event certifications.</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-24">
             <div className="w-12 h-12 border-4 border-gray-200 border-t-primary rounded-full animate-spin mb-4" />
             <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Retrieving Records...</p>
          </div>
        ) : certificates.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center max-w-2xl mx-auto ring-1 ring-gray-100/50">
             <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-amber-100">
                <FiAward className="text-5xl" />
             </div>
             <p className="text-gray-900 font-black text-xl mb-2">Vault is empty</p>
             <p className="text-gray-400 text-sm font-medium px-10 leading-relaxed mb-10">You'll receive certificates here after successfully attending and completing events. Keep participating!</p>
             <button className="bg-primary hover:bg-primary-dark text-white px-10 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-primary/20">
               Browse Live Events
             </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {certificates.map((cert, idx) => (
              <motion.div key={cert._id} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.1 }}
                className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group overflow-hidden">
                      <div className="aspect-[1.414/1] bg-gray-50 dark:bg-slate-800 relative group-hover:bg-blue-50/50 dark:group-hover:bg-blue-900/10 transition-colors p-8 flex items-center justify-center">
                         {/* Mini Certificate Preview */}
                         <div className="w-full h-full border-8 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl relative p-6 flex flex-col items-center justify-center transition-colors">
                            <div className="size-12 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4">
                               <span className="material-symbols-outlined text-primary dark:text-blue-400 text-3xl">workspace_premium</span>
                            </div>
                            <div className="h-2 w-24 bg-gray-100 dark:bg-slate-800 rounded-lg mb-2" />
                            <div className="h-2 w-16 bg-gray-50 dark:bg-slate-800 rounded-lg" />
                         </div>
                      </div>
                      
                      <div className="p-8">
                         <div className="flex items-center gap-3 mb-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-lg border border-blue-100 dark:border-blue-800">
                               {cert.event?.category === 'technical' ? 'Tech' : cert.event?.category}
                            </span>
                             <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">
                               Issued {new Date(cert.issuedAt).toLocaleDateString()}
                            </span>
                         </div>
                         <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 group-hover:text-primary dark:group-hover:text-blue-400 transition-colors line-clamp-2 min-h-[3.5rem]">{cert.event?.title}</h3>
                         
                         <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => verifyCertificate(cert._id)} className="px-4 py-2.5 flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-primary/20">
                               <span className="material-symbols-outlined text-base">verified</span> Verify
                            </button>
                             <a href={API.defaults.baseURL.replace('/api', '') + '/media/' + cert.certificateUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2.5 flex items-center justify-center bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 rounded-xl transition-all border border-gray-100 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest">
                                <span className="material-symbols-outlined text-base">download</span> Get PDF
                             </a>
                         </div>
                      </div>
                   </motion.div>
            ))}
          </div>
        )}

        <div className="mt-16 bg-blue-600 rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl shadow-blue-500/20">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
           <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
           
           <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div className="space-y-6">
                 <div className="size-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white border border-white/20">
                    <FiInfo className="text-3xl" />
                 </div>
                 <h3 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">Authenticity Matters</h3>
                 <p className="text-blue-100 font-medium leading-relaxed max-w-sm">
                   Our digital certificates are secured with encrypted QR codes. They can be instantly verified by recruiters and academic departments.
                 </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                 <div className="flex-1 bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-3xl">
                    <h5 className="font-bold text-sm mb-1">Verify Certificate</h5>
                    <p className="text-[10px] text-blue-200 font-bold uppercase tracking-wider mb-4">Check validity online</p>
                     <button 
                        onClick={() => setVerifying(true)}
                        className="w-full bg-white text-blue-600 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-black/10 active:scale-95 transition-all"
                     >
                       Start Verification
                     </button>
                 </div>
                 <div className="flex-1 bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-3xl flex flex-col justify-between">
                    <p className="text-xs text-blue-100 font-medium mb-8 italic">"Building a strong co-curricular portfolio has never been easier."</p>
                    <div className="flex items-center gap-3">
                       <div className="size-8 bg-blue-400 rounded-full" />
                       <p className="text-[10px] font-black uppercase tracking-widest">Office of Dean</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </main>
    </div>
  );
};

export default Certificates;