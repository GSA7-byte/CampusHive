import { useTheme } from "../../context/ThemeContext";
import { FiSun, FiMoon } from "react-icons/fi";

const ThemeToggle = ({ className = "" }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-xl transition-all duration-300 flex items-center justify-center 
        ${theme === "dark" 
          ? "bg-slate-800 text-yellow-400 hover:bg-slate-700 shadow-lg shadow-yellow-400/10" 
          : "bg-gray-100 text-gray-600 hover:bg-gray-200 shadow-sm"
        } ${className}`}
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? (
        <FiMoon className="text-xl" />
      ) : (
        <FiSun className="text-xl" />
      )}
    </button>
  );
};

export default ThemeToggle;
