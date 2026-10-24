// FILE: context/AuthContext.jsx
// Responsibility: React auth state (who is logged in), login(), logout(). Satisfies AUTH-07, AUTH-08, SOCK-06.
//
// TOKEN STORAGE DECISION: the JWT is kept in sessionStorage.
//  + Survives page refresh, cleared when the tab is closed (shorter exposure than localStorage).
//  + Works across different domains (Vercel frontend + Render backend) without cross-site cookie problems.
//  - JavaScript can read it, so an XSS bug could steal it. Mitigations: React escapes output by default,
//    we render user text only as plain text, and the token expires after 1 hour.
// An HTTP-only cookie would protect against XSS theft, but needs SameSite=None cookies across two domains (documented in README).
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api, { setAuthToken, setUnauthorizedHandler } from "../services/api.js";
import { connectSocket, disconnectSocket } from "../services/socket.js";

const AuthContext = createContext(null);
const TOKEN_KEY = "instaport_token";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while we check a saved token on page load
  const [sessionMessage, setSessionMessage] = useState("");

  // Clears everything and closes the socket. Used by the Logout button AND by expired-token handling.
  const logout = useCallback((message = "") => {
    const hadSession = !!sessionStorage.getItem(TOKEN_KEY);
    if (hadSession) api.post("/auth/logout").catch(() => {}); // best effort; JWT logout is client-side
    sessionStorage.removeItem(TOKEN_KEY);
    setAuthToken(null);
    disconnectSocket();
    setUser(null);
    setSessionMessage(typeof message === "string" ? message : "");
  }, []);

  // Any 401 from the API logs the user out and shows a clear message on the login page.
  useEffect(() => {
    setUnauthorizedHandler((msg) => logout(msg || "Your session expired. Please log in again."));
  }, [logout]);

  // On first load: if a token is saved, ask the server who it belongs to.
  useEffect(() => {
    async function restoreSession() {
      const saved = sessionStorage.getItem(TOKEN_KEY);
      if (!saved) {
        setLoading(false);
        return;
      }
      try {
        setAuthToken(saved);
        const res = await api.get("/auth/me");
        connectSocket(saved, logout);
        setUser(res.data.user);
      } catch (err) {
        sessionStorage.removeItem(TOKEN_KEY);
        setAuthToken(null);
      } finally {
        setLoading(false);
      }
    }
    restoreSession();
  }, [logout]);

  
  // Shared by login and registration: save the token, open the socket, store the user.
  function startSession(data) {
    sessionStorage.setItem(TOKEN_KEY, data.token);
    setAuthToken(data.token);
    connectSocket(data.token, logout);
    setSessionMessage("");
    setUser(data.user);
    return data.user;
  }

  async function login(email, password) {
    const res = await api.post("/auth/login", { email, password });
    return startSession(res.data);
  }

  // form = { name, email, password, role, agentCode }
  async function register(form) {
    const res = await api.post("/auth/register", form);
    return startSession(res.data);
  }


  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, sessionMessage }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
