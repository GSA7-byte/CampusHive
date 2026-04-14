import { createContext, useContext, useState, useEffect } from "react";
import API from "../api/axios";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchProfile = async () => {
    try {
      const { data } = await API.get("/auth/me");
      if (data.success) {
        setUser(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = (tokenValue, userData) => {
    localStorage.setItem("token", tokenValue);
    localStorage.setItem("role", userData.role);
    localStorage.setItem("userId", userData.userId || userData._id);
    setToken(tokenValue);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    setToken(null);
    setUser(null);
  };

  const removeProfilePhoto = async () => {
    try {
      const { data } = await API.post("/auth/remove-profile-photo");
      if (data.success) {
        setUser(data.data);
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (error) {
      console.error("Remove Profile Photo Error:", error);
      return { success: false, message: error.response?.data?.message || "Failed to remove photo" };
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, token, loading, login, logout, fetchProfile, removeProfilePhoto }}>
      {children}
    </AuthContext.Provider>
  );
};