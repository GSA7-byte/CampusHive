import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Scanner } from '@yudiel/react-qr-scanner';
import { FiCamera, FiCheckCircle, FiXCircle, FiArrowLeft, FiInfo, FiZap, FiCheck } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import API from "../../api/axios";
import OrganizerNavbar from "../../components/common/OrganizerNavbar";
import toast from "react-hot-toast";

const ScanQR = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [recentScans, setRecentScans] = useState([]);
  const [csvUrl, setCsvUrl] = useState(null);

  const handleScan = async (result) => {
    if (!result || loading) return;
    const rawValue = result[0]?.rawValue;
    if (!rawValue) return;

    setLoading(true);
    try {
      let qrData;
      try {
        qrData = JSON.parse(rawValue);
      } catch (e) {
        // Fallback if the data is just a studentId string
        qrData = { studentId: rawValue, eventId: eventId };
      }

      const { data } = await API.post("/registrations/verify-qr", {
        studentId: qrData.studentId,
        eventId: qrData.eventId || eventId
      });

      if (data.success) {
        setScanResult({ success: true, message: "Attendance Marked! ✨", student: data.data.student });
        setCsvUrl(data.data.csvUrl);
        setRecentScans(prev => [
          { ...data.data.student, checkedInAt: data.data.checkedInAt },
          ...prev
        ].slice(0, 5));
        toast.success("Attendance verified");
      }
    } catch (error) {
      setScanResult({ success: false, message: error.response?.data?.message || "Verification Failed" });
      toast.error(error.response?.data?.message || "Invalid or duplicate pass");
    } finally {
      setLoading(false);
      // Reset result after 3 seconds
      setTimeout(() => setScanResult(null), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-display text-gray-800 flex flex-col">
      <OrganizerNavbar />

      <main className="flex-grow max-w-[800px] w-full mx-auto px-4 sm:px-8 py-10">
        <button onClick={() => navigate(-1)} className="group flex items-center gap-2 text-gray-400 hover:text-primary font-bold text-[10px] uppercase tracking-widest mb-10 transition-all">
          <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Back
        </button>

        <div className="mb-10 text-center">
           <h2 className="text-3xl font-black text-gray-900 tracking-tight">Rapid <span className="text-primary italic">Verify</span></h2>
           <p className="text-gray-500 font-medium text-sm mt-1">Scan student QR codes to mark live attendance.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
           {/* Scanner Area */}
           <div className="relative aspect-square rounded-[3rem] overflow-hidden border-8 border-white shadow-2xl bg-gray-900 ring-1 ring-gray-100">
              <div className="absolute inset-0 z-10 pointer-events-none border-[40px] border-black/20" />
              <div className="absolute top-1/2 left-0 w-full h-1 bg-primary/50 blur-sm animate-pulse z-20" />
              
              <div className="size-full">
                 <Scanner onScan={handleScan} />
              </div>

              <AnimatePresence>
                {scanResult && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                    className={`absolute inset-0 z-30 flex flex-col items-center justify-center backdrop-blur-md ${scanResult.success ? "bg-emerald-600/90" : "bg-red-600/90"} text-white p-8 text-center`}>
                    {scanResult.success ? <FiCheckCircle className="text-7xl mb-4" /> : <FiXCircle className="text-7xl mb-4" />}
                    <h3 className="text-2xl font-black mb-2">{scanResult.success ? "Verified" : "Invalid"}</h3>
                    <p className="font-bold text-sm uppercase tracking-widest opacity-80">{scanResult.message}</p>
                  </motion.div>
                )}
              </AnimatePresence>
           </div>

           {/* Guidelines */}
           <div className="space-y-6">
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-6">
                 <div className="flex items-center gap-4">
                    <div className="size-12 bg-blue-50 text-primary rounded-2xl flex items-center justify-center border border-blue-100 shrink-0">
                       <FiZap className="text-2xl" />
                    </div>
                    <h4 className="font-black text-gray-900 uppercase tracking-widest text-sm">Best Practices</h4>
                 </div>
                 
                 <ul className="space-y-4">
                   <li className="flex gap-3">
                      <div className="text-primary mt-1"><FiCheck /></div>
                      <p className="text-xs text-gray-500 font-medium leading-relaxed">Ensure the student has high brightness on their screen.</p>
                   </li>
                   <li className="flex gap-3">
                      <div className="text-primary mt-1"><FiCheck /></div>
                      <p className="text-xs text-gray-500 font-medium leading-relaxed">Hold the camera steady about 6-10 inches from the QR.</p>
                   </li>
                   <li className="flex gap-3">
                      <div className="text-primary mt-1"><FiCheck /></div>
                      <p className="text-xs text-gray-500 font-medium leading-relaxed">Verification results are instantly synced with the cloud.</p>
                   </li>
                 </ul>
              </div>

              <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-3xl text-white shadow-xl shadow-black/10">
                 <div className="flex items-center gap-2 mb-4">
                    <div className="size-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Ready to Scan</span>
                 </div>
                 <h4 className="font-black text-lg mb-2">Manual Entry?</h4>
                 <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-6 leading-relaxed">If the scanner fails, you can manually mark attendance from the attendees list.</p>
                 <button onClick={() => navigate(`/organizer/attendees/${eventId}`)} className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-black text-[10px] uppercase tracking-widest py-3.5 rounded-xl transition-all">Go to Roster</button>
              </div>
           </div>
        </div>

        {/* Recent Scans & Reports */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                 <h4 className="font-black text-gray-900 uppercase tracking-widest text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">history</span> Recent Scans
                 </h4>
                 <span className="text-[10px] font-black text-primary px-2 py-0.5 bg-blue-50 rounded-lg">{recentScans.length} NEW</span>
              </div>
              
              {recentScans.length === 0 ? (
                 <div className="py-10 text-center border-2 border-dashed border-gray-50 rounded-2xl">
                    <p className="text-gray-300 font-bold text-xs uppercase tracking-widest">No scans this session</p>
                 </div>
              ) : (
                 <div className="space-y-4">
                    {recentScans.map((student, idx) => (
                       <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                          <div className="size-10 rounded-xl bg-white flex items-center justify-center text-primary font-black text-xs shadow-sm shadow-blue-500/5">
                             {student.firstName?.[0]}{student.lastName?.[0]}
                          </div>
                          <div className="flex-grow min-w-0">
                             <p className="font-black text-gray-900 text-xs truncate">{student.firstName} {student.lastName}</p>
                             <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{student.enrollmentNo}</p>
                          </div>
                          <div className="text-right shrink-0">
                             <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Verified</p>
                             <p className="text-[8px] font-bold text-gray-400">{new Date(student.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                       </motion.div>
                    ))}
                 </div>
              )}
           </div>

           <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm flex flex-col items-center justify-center text-center">
              <div className="size-20 bg-blue-50 text-primary rounded-[2rem] flex items-center justify-center mb-6 border border-blue-100 shadow-xl shadow-blue-500/5">
                 <span className="material-symbols-outlined text-4xl">description</span>
              </div>
              <h4 className="font-black text-gray-900 uppercase tracking-widest text-sm mb-2">Attendee Report</h4>
              <p className="text-gray-500 text-[10px] font-medium leading-relaxed max-w-[200px] mb-8">Download a full CSV log of all students who have scanned their pass.</p>
              
              <button 
                onClick={() => {
                  if (csvUrl) {
                    window.open(`http://localhost:4000${csvUrl}`, "_blank");
                    toast.success("Downloading report...");
                  } else {
                    toast.error("No scans recorded yet");
                  }
                }}
                className={`w-full py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${csvUrl ? "bg-gray-900 text-white hover:bg-black shadow-xl shadow-black/10" : "bg-gray-50 text-gray-300 cursor-not-allowed"}`}>
                Download CSV Log
              </button>
           </div>
        </div>
      </main>
    </div>
  );
};

export default ScanQR;