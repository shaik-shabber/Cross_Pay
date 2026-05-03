import { createContext, useCallback, useContext, useEffect, useState } from "react";
import api, { getErrorMessage, getPayload } from "../lib/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const applySession = (payload) => {
    setSession(payload);
    setUser(payload?.user || null);
  };

  const refreshSession = useCallback(async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      applySession(null);
      setLoading(false);
      return null;
    }

    try {
      const res = await api.get("/auth/me");
      const payload = getPayload(res);
      applySession(payload);
      return payload;
    } catch {
      localStorage.removeItem("token");
      applySession(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = async (data) => {
    setLoading(true);
    try {
      const res = await api.post("/auth/login", data);
      const payload = getPayload(res);
      localStorage.setItem("token", payload.token);
      applySession(payload);
      return payload;
    } catch (err) {
      throw new Error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const register = async (data) => {
    setLoading(true);
    try {
      const res = await api.post("/auth/register", data);
      return getPayload(res);
    } catch (err) {
      throw new Error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    applySession(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, session, login, register, logout, refreshSession, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
