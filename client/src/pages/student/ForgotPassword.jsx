import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import API from "../../api/axios";

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const navigate = useNavigate();

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await API.post("/auth/forgot-password-otp", { email });
      if (data.success) {
        toast.success("OTP sent to your email!");
        setResetToken(data.data?.resetToken || "");
        setStep(2);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await API.post("/auth/verify-otp", { email, otp });
      if (data.success) {
        toast.success("OTP verified!");
        setResetToken(data.data?.resetToken || resetToken);
        setStep(3);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const { data } = await API.post("/auth/reset-password-otp", { email, otp, newPassword });
      if (data.success) {
        toast.success("Password reset successfully! Please sign in.");
        navigate("/login");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-gray-800 placeholder:text-gray-400 text-sm";
  const btnClass = "w-full bg-primary hover:bg-primary-dark text-white font-semibold text-base py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70 shadow-lg shadow-primary/25 hover:shadow-primary/40";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4 font-display text-gray-800">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 py-10 w-full max-w-[440px]"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-blue-50 border border-blue-100 overflow-hidden">
             <img src="/campushive_logo.png" alt="CampusHive" className="w-12 h-12 object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Reset <span className="text-primary">Password</span>
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            {step === 1 && "Enter your email to receive a verification code"}
            {step === 2 && "Enter the 6-digit OTP sent to your email"}
            {step === 3 && "Create your new password"}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-1.5 rounded-full w-10 transition-all duration-500 ${step >= s ? "bg-primary" : "bg-gray-200"}`} />
          ))}
        </div>

        {/* Step 1: Email */}
        {step === 1 && (
          <form onSubmit={handleSendOTP} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">mail</span>
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@university.edu" required className={inputClass}
                />
              </div>
            </div>
            <button type="submit" disabled={loading} className={btnClass}>
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Send OTP <span className="material-symbols-outlined text-lg">send</span></>
              )}
            </button>
          </form>
        )}

        {/* Step 2: OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOTP} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Verification Code</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">pin</span>
                <input
                  type="text" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Enter 6-digit OTP" required maxLength={6}
                  className={`${inputClass} text-center text-2xl tracking-[0.5em] font-mono`}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">Check your inbox for <span className="text-primary">{email}</span></p>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)}
                className="px-6 py-3.5 bg-gray-100 border border-gray-200 hover:bg-gray-200 rounded-xl text-gray-600 font-semibold transition-all active:scale-[0.98] flex items-center gap-2">
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <button type="submit" disabled={loading || otp.length < 6} className={`flex-1 ${btnClass}`}>
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Verify <span className="material-symbols-outlined text-lg">verified</span></>
                )}
              </button>
            </div>
            <button type="button" onClick={handleSendOTP} disabled={loading}
              className="w-full text-center text-xs font-medium text-gray-400 hover:text-primary transition-colors disabled:opacity-50">
              Resend OTP
            </button>
          </form>
        )}

        {/* Step 3: New Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">lock</span>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters" required minLength={6} className={inputClass} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">lock_reset</span>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password" required minLength={6} className={inputClass} />
              </div>
            </div>
            <button type="submit" disabled={loading} className={btnClass}>
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Reset Password <span className="material-symbols-outlined text-lg">lock_open</span></>
              )}
            </button>
          </form>
        )}

        {/* Back to Login */}
        <p className="text-center mt-8 text-sm text-gray-500">
          Remember your password?{" "}
          <Link to="/login" className="text-primary font-semibold hover:underline transition-all">
             Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
