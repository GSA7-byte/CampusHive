import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    enrollmentNo: "",
    department: "",
    year: "",
    organizationName: "",
    designation: "",
    role: "student",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [step, setStep] = useState(1);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = (e) => {
    e.preventDefault();
    if(step === 1) {
      if(!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.phone){
        toast.error("Please fill in all basic details"); return;
      }
      if(formData.password.length < 6) {
         toast.error("Password must be at least 6 characters"); return;
      }
      setStep(2);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.role === "student") {
      if(!formData.department || !formData.year || !formData.enrollmentNo){
         toast.error("Please fill in all academic details"); return;
      }
    } else if (formData.role === "organizer") {
      if(!formData.organizationName || !formData.designation){
         toast.error("Please fill in all organization details"); return;
      }
    }
    
    setLoading(true);
    try {
      const { data } = await API.post("/auth/register", formData);
      if (data.success) {
        if (formData.role === "organizer") {
          toast.success("Registration successful! Please wait for admin verification. 🎉");
          navigate("/login");
        } else {
          login(data.data.token, data.data);
          toast.success("Registration successful! 🎉");
          navigate("/student/dashboard");
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const departments = ["CSE", "ECE", "EE", "ME", "CE", "IT", "BioTech", "Law", "MBA", "Other"];

  const inputClass = "w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-gray-800 placeholder:text-gray-400 text-sm";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";
  const iconClass = "material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors text-xl";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4 font-display text-gray-800">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8 w-full max-w-[500px]"
      >
        <div className="text-center mb-8">
           <motion.div 
             initial={{ y: -10, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 bg-blue-50 border border-blue-100 shadow-inner overflow-hidden"
           >
              <img src="/campushive_logo.png" alt="CampusHive" className="w-16 h-16 object-contain" />
           </motion.div>
           <h1 className="text-3xl font-black text-gray-900 tracking-tight">
             Create <span className="text-primary italic">Account</span>
           </h1>
           <p className="text-gray-500 mt-2 text-sm font-medium tracking-tight">
             {step === 1 ? "Enter your basic details to get started" : formData.role === "student" ? "Fill in your academic details" : "Provide your organization details"}
           </p>
        </div>
        
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
           <div className={`h-1.5 rounded-full w-12 transition-all duration-500 ${step >= 1 ? "bg-primary" : "bg-gray-200"}`} />
           <div className={`h-1.5 rounded-full w-12 transition-all duration-500 ${step >= 2 ? "bg-primary" : "bg-gray-200"}`} />
        </div>

        <form onSubmit={step === 1 ? handleNext : handleSubmit} className="space-y-5">
           <AnimatePresence mode="wait">
             {step === 1 ? (
               <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
                  {/* Role Selection */}
                  <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
                    <button type="button" onClick={() => setFormData({ ...formData, role: "student" })}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${formData.role === "student" ? "bg-white text-primary shadow-sm border border-gray-200" : "text-gray-500 hover:text-gray-700"}`}>
                      Student
                    </button>
                    <button type="button" onClick={() => setFormData({ ...formData, role: "organizer" })}
                       className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${formData.role === "organizer" ? "bg-white text-primary shadow-sm border border-gray-200" : "text-gray-500 hover:text-gray-700"}`}>
                      Organizer
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>First Name</label>
                      <div className="relative group">
                         <span className={iconClass}>person</span>
                        <input type="text" name="firstName" value={formData.firstName} onChange={handleChange}
                          placeholder="John" required className={inputClass} />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Last Name</label>
                      <div className="relative group">
                         <span className={iconClass}>person</span>
                        <input type="text" name="lastName" value={formData.lastName} onChange={handleChange}
                          placeholder="Doe" required className={inputClass} />
                      </div>
                    </div>
                  </div>
        
                  <div>
                    <label className={labelClass}>Email Address</label>
                    <div className="relative group">
                       <span className={iconClass}>mail</span>
                      <input type="email" name="email" value={formData.email} onChange={handleChange}
                        placeholder="you@university.edu" required className={inputClass} />
                    </div>
                  </div>
                  
                  <div>
                    <label className={labelClass}>Phone Number</label>
                    <div className="relative group">
                       <span className={iconClass}>call</span>
                      <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                        placeholder="10-digit number" required className={inputClass} />
                    </div>
                  </div>
        
                  <div>
                    <label className={labelClass}>Password</label>
                    <div className="relative group">
                       <span className={iconClass}>lock</span>
                      <input type="password" name="password" value={formData.password} onChange={handleChange}
                        placeholder="Min 6 characters" required minLength={6} className={inputClass} />
                    </div>
                  </div>
                  
                  <button type="submit"
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] mt-6 border border-gray-200 group">
                     Next Step <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </button>
               </motion.div>
             ) : (
               <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  {formData.role === "student" ? (
                    <>
                      <div className="grid grid-cols-[1fr_2fr] gap-4">
                        <div>
                          <label className={labelClass}>Year</label>
                          <div className="relative">
                            <select name="year" value={formData.year} onChange={handleChange} required={formData.role === "student"}
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-gray-800 text-sm appearance-none">
                              <option value="" disabled hidden>Yr</option>
                              <option value="1">1st Year</option>
                              <option value="2">2nd Year</option>
                              <option value="3">3rd Year</option>
                              <option value="4">4th Year</option>
                            </select>
                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xl">expand_more</span>
                          </div>
                        </div>
                        <div>
                          <label className={labelClass}>Department</label>
                          <div className="relative group">
                            <span className={iconClass}>school</span>
                            <select name="department" value={formData.department} onChange={handleChange} required={formData.role === "student"}
                              className="w-full pl-11 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-gray-800 text-sm appearance-none">
                              <option value="" disabled hidden>Select department</option>
                              {departments.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xl">expand_more</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <label className={labelClass}>Enrollment No.</label>
                        <div className="relative group">
                          <span className={iconClass}>tag</span>
                          <input type="text" name="enrollmentNo" value={formData.enrollmentNo} onChange={handleChange}
                            placeholder="e.g. 2101001" required={formData.role === "student"} className={inputClass} />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className={labelClass}>Organization Name</label>
                        <div className="relative group">
                          <span className={iconClass}>corporate_fare</span>
                          <input type="text" name="organizationName" value={formData.organizationName} onChange={handleChange}
                            placeholder="e.g. GDSC" required={formData.role === "organizer"} className={inputClass} />
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>Designation</label>
                        <div className="relative group">
                          <span className={iconClass}>badge</span>
                          <input type="text" name="designation" value={formData.designation} onChange={handleChange}
                            placeholder="e.g. Lead Organizer" required={formData.role === "organizer"} className={inputClass} />
                        </div>
                      </div>
                    </>
                  )}
                  
                  <div className="flex gap-3 pt-4">
                     <button type="button" onClick={() => setStep(1)}
                       className="w-[120px] bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-600 font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
                        <span className="material-symbols-outlined">arrow_back</span>
                     </button>
                    <button type="submit" disabled={loading}
                      className="w-full bg-primary hover:bg-primary-dark text-white font-semibold text-sm py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100">
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <span>Create Account</span>
                      )}
                    </button>
                  </div>
               </motion.div>
             )}
           </AnimatePresence>
        </form>

        <p className="text-center mt-8 text-sm text-gray-500">
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-semibold hover:underline transition-all">
             Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;