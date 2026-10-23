import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
import { loginApi, logoutApi, meApi, refreshApi, type AdminInfo } from "@/api/auth";
import { useLocation } from "react-router-dom";
import { socketService } from "@/services/socketService";
import { broadcastGlobalLogout, subscribeGlobalLogout } from "@/lib/authSync";

const REFRESH_INTERVAL_MS = 14 * 60 * 1000;

interface AuthState {
  admin: AdminInfo | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { pathname } = useLocation();
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    refreshTimerRef.current = setInterval(async () => {
      try {
        await refreshApi();
      } catch {
        setAdmin(null);
        if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
      }
    }, REFRESH_INTERVAL_MS);
  }, []);

  const stopRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  const clearSession = useCallback(() => {
    stopRefreshTimer();
    setAdmin((currentAdmin) => {
      if (currentAdmin) socketService.leaveAdmin();
      return null;
    });
  }, [stopRefreshTimer]);

  const hasInitialized = useRef(false);

  useEffect(() => {
    const isFirstRun = !hasInitialized.current;

    if (isFirstRun) {
      hasInitialized.current = true;
    } else if (!pathname.startsWith("/admin")) {
      return;
    }

    (async () => {
      try {
        const { data } = await meApi();
        setAdmin(data.data);
        startRefreshTimer();
      } catch {
        try {
          await refreshApi();
          const { data } = await meApi();
          setAdmin(data.data);
          startRefreshTimer();
        } catch {
          setAdmin(null);
          stopRefreshTimer();
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => stopRefreshTimer(), [stopRefreshTimer]);

  useEffect(() => {
    return subscribeGlobalLogout(() => {
      clearSession();
      void logoutApi().catch(() => {
        // Ignore les erreurs de logout croisées.
      });
    });
  }, [clearSession]);

  useEffect(() => {
    if (!admin) return;

    if (pathname.startsWith("/admin")) {
      socketService.joinAdmin();
      return () => socketService.leaveAdmin();
    }

    socketService.leaveAdmin();
  }, [admin, pathname]);

  const login = useCallback(async (email: string, password: string) => {
    await loginApi({ email, password });
    const { data } = await meApi();
    setAdmin(data.data);
    startRefreshTimer();
  }, [startRefreshTimer]);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      // On déconnecte quand même côté client
    } finally {
      clearSession();
      broadcastGlobalLogout();
    }
  }, [clearSession]);

  return (
    <AuthContext.Provider
      value={{
        admin,
        isLoading,
        isAuthenticated: admin !== null,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans un <AuthProvider>");
  return ctx;
}
