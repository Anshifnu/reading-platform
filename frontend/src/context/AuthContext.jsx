import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/Api";


const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [loading, setLoading] = useState(true);
  

  // 🔁 Load auth data on refresh
useEffect(() => {
  const access = localStorage.getItem("access_token");
  const refresh = localStorage.getItem("refresh_token");
  const storedUser = localStorage.getItem("user");

  if (access && refresh && storedUser) {
    const parsedUser = JSON.parse(storedUser);

    const normalizedUser = {
      ...parsedUser,
      role: parsedUser.role?.toLowerCase(), // 🔥 FIX HERE
    };

    setAccessToken(access);
    setRefreshToken(refresh);
    setUser(normalizedUser);

    // optional: overwrite storage with fixed value
    localStorage.setItem("user", JSON.stringify(normalizedUser));
  }

  setLoading(false);
}, []);


  // ✅ FLEXIBLE LOGIN (accepts backend response)
const login = (response) => {
  const access = response?.tokens?.access;
  const refresh = response?.tokens?.refresh;
  const user = response?.user;

  if (!access || !refresh || !user) return;

  const normalizedUser = {
    ...user,
    role: user.role?.toLowerCase(), 
  };

  localStorage.setItem("access_token", access);
  localStorage.setItem("refresh_token", refresh);
  localStorage.setItem("user", JSON.stringify(normalizedUser));

  setAccessToken(access);
  setRefreshToken(refresh);
  setUser(normalizedUser);
};




  const logout = async () => {
    try {
      if (refreshToken) {
        await api.post("/logout/", { refresh: refreshToken });
      }
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.clear();
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        refreshToken,
        login,
        logout,
        isAuthenticated: !!accessToken,
        loading,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
