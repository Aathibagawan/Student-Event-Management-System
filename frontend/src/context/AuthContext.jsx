import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authService } from "../services/endpoints";
import { tokenStorage } from "../utils/tokenStorage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(tokenStorage.getUser());
  const [loading, setLoading] = useState(Boolean(tokenStorage.getAccess()));

  // On first load, if we have a token, confirm it is still valid and refresh user info.
  useEffect(() => {
    if (!tokenStorage.getAccess()) return;
    authService
      .me()
      .then((res) => {
        setUser(res.data);
        tokenStorage.save({ user: res.data });
      })
      .catch(() => {
        tokenStorage.clear();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const clearSession = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
  }, []);

  // Tell the server to blacklist the refresh token, then forget everything locally.
  const logout = useCallback(async () => {
    const refresh = tokenStorage.getRefresh();
    clearSession();
    if (refresh) {
      try {
        await authService.logout(refresh);
      } catch {
        /* token already invalid - nothing else to do */
      }
    }
  }, [clearSession]);

  // api.js fires this event when the refresh token itself has expired.
  useEffect(() => {
    window.addEventListener("ace:logout", clearSession);
    return () => window.removeEventListener("ace:logout", clearSession);
  }, [clearSession]);

  const login = useCallback(async (email, password) => {
    const { data } = await authService.login(email, password);
    tokenStorage.save(data);
    setUser(data.user);
    return data.user;
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, logout, isAuthenticated: Boolean(user) }),
    [user, loading, login, logout]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};
