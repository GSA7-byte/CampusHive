import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [selectedRole, setSelectedRole] = useState("student");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await API.post("/auth/login", formData);
      if (data.success) {
        if (data.data.status && data.data.status !== "active") {
           toast.error(`Account is ${data.data.status}. Please contact an Admin.`);
           return;
        }

        // Validate role
        if (data.data.role !== selectedRole) {
          toast.error(`This account is registered as a ${data.data.role}. Please login through the correct section.`);
          return;
        }

        login(data.data.token, data.data);
        toast.success("Login successful!");
        
        const role = data.data.role;
        if (role === "admin") navigate("/admin/dashboard");
        else if (role === "organizer") navigate("/organizer/dashboard");
        else navigate("/student/dashboard");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { key: "student", label: "Student", icon: "school" },
    { key: "organizer", label: "Organizer", icon: "groups" },
    { key: "admin", label: "Admin", icon: "shield_person" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4 font-display text-gray-800">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="bg-white rounded-[2rem] shadow-2xl border border-gray-100 p-8 py-10 w-full max-w-[460px] relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-primary" />
        
        {/* Logo */}
        <div className="text-center mb-8">
           <motion.div 
             initial={{ y: -10, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 bg-blue-50 border border-blue-100 shadow-inner overflow-hidden"
           >
              <img src="/campushive_logo.png" alt="CampusHive" className="w-16 h-16 object-contain" />
           </motion.div>
           <h1 className="text-3xl font-black text-gray-900 tracking-tight">
             Welcome to <span className="text-primary italic">CampusHive</span>
           </h1>
           <p className="text-gray-500 mt-2 text-sm font-medium tracking-tight">Sign in to manage your campus events</p>
        </div>

        {/* Role Selection with Sliding Animation */}
        <div className="relative flex bg-gray-100 p-1.5 rounded-2xl mb-8 isolate">
          <motion.div
            className="absolute top-1.5 left-1.5 bottom-1.5 bg-white shadow-lg shadow-primary/10 border border-gray-100 rounded-xl z-0"
            initial={false}
            animate={{
              x: selectedRole === "student" ? 0 : selectedRole === "organizer" ? "100%" : "200%",
              width: "33.333%"
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
          {roles.map((role) => (
            <button
              key={role.key}
              type="button"
              onClick={() => setSelectedRole(role.key)}
              className={`relative z-10 flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2 ${
                selectedRole === role.key ? "text-primary" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <span className="material-symbols-outlined text-base leading-none">{role.icon}</span>
              {role.label}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Account Identifier</label>
              <div className="relative group">
                 <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors text-xl">
                   {selectedRole === "student" ? "badge" : "mail"}
                 </span>
                <input
                  type="text"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={selectedRole === "student" ? "Email or Student ID" : "Email Address"}
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-gray-800 placeholder:text-gray-400 text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2 ml-1">
                 <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400">Security Key</label>
                 <Link to="/forgot-password" hidden={selectedRole === "admin"} className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary-dark transition-colors">
                   Forgot Password?
                 </Link>
              </div>
              <div className="relative group">
                 <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors text-xl">lock</span>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-gray-800 placeholder:text-gray-400 text-sm font-medium"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-dark text-white font-black text-xs uppercase tracking-[0.2em] py-5 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 shadow-xl shadow-primary/20 hover:shadow-primary/30"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>Sign In <span className="material-symbols-outlined text-lg">login</span></>
            )}
          </button>
        </form>

        {/* Register link */}
        {selectedRole !== "admin" && (
          <p className="text-center mt-10 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            First time here?{" "}
            <Link to="/register" className="text-primary hover:text-primary-dark transition-all">
               Create Account
            </Link>
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default Login;