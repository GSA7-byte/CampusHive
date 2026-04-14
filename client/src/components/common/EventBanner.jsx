import React from "react";

const EventBanner = ({ banner, title, className = "" }) => {
  const bannerSrc = banner ? `${import.meta.env.VITE_API_URL || "http://localhost:4000"}/media/${banner}` : null;

  if (bannerSrc) {
    return (
      <img
        src={bannerSrc}
        alt={title}
        className={`w-full h-full object-cover ${className}`}
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = "/campushive_logo.png"; // Fallback if image fails to load
        }}
      />
    );
  }

  // Fallback: Show stylized div with event name
  return (
    <div className={`w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-indigo-500 via-blue-600 to-primary text-white ${className}`}>
      <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-4 border border-white/30 shadow-xl">
         <span className="material-symbols-outlined text-4xl">event</span>
      </div>
      <h3 className="text-xl font-black uppercase tracking-tight line-clamp-2 max-w-[80%] leading-tight">
        {title}
      </h3>
      <div className="mt-4 flex items-center gap-2">
         <div className="h-px w-8 bg-white/40"></div>
         <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">CampusHive Experience</span>
         <div className="h-px w-8 bg-white/40"></div>
      </div>
    </div>
  );
};

export default EventBanner;
