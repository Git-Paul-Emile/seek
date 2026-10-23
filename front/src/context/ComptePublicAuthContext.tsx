import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
import {
  meComptePublicApi,
  refreshComptePublicApi,
  logoutComptePublicApi,
  type ComptePublic,
} from "@/api/comptePublicAuth";
import { broadcastGlobalLogout, subscribeGlobalLogout } from "@/lib/authSync";

const REFRESH_INTERVAL_MS = 14 * 60 * 1000;

interface State {
  compte: ComptePublic | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface ContextValue extends State {
  setCompte: (c: ComptePublic | null) => void;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
}

const ComptePublicAuthContext = createContext<ContextValue | null>(null);

export function ComptePublicAuthProvider({ children }: { children: ReactNode }) {
  const [compte, setCompte] = useState<ComptePublic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const refreshRequestRef = useRef<Promise<void> | null>(null);

  const startRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    refreshTimerRef.current = setInterval(async () => {
      try {
        await refreshComptePublicApi();
      } catch {
        setCompte(null);
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
    setCompte(null);
  }, [stopRefreshTimer]);

  const refreshMe = useCallback(async () => {
    if (refreshRequestRef.current) {
      return refreshRequestRef.current;
    }

    const request = (async () => {
      try {
        const data = await meComptePublicApi();
        setCompte(data);
        startRefreshTimer();
      } catch {
        setCompte(null);
        stopRefreshTimer();
      } finally {
        setIsLoading(false);
        refreshRequestRef.current = null;
      }
    })();

    refreshRequestRef.current = request;
    return request;
  }, [startRefreshTimer, stopRefreshTimer]);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  useEffect(() => () => stopRefreshTimer(), [stopRefreshTimer]);

  useEffect(() => {
    return subscribeGlobalLogout(() => {
      clearSession();
      void logoutComptePublicApi().catch(() => {
        // ignore
      });
    });
  }, [clearSession]);

  const logout = useCallback(async () => {
    try {
      await logoutComptePublicApi();
    } catch {
      // ignore
    } finally {
      clearSession();
      broadcastGlobalLogout();
    }
  }, [clearSession]);

  return (
    <ComptePublicAuthContext.Provider
      value={{ compte, isLoading, isAuthenticated: compte !== null, setCompte, logout, refreshMe }}
    >
      {children}
    </ComptePublicAuthContext.Provider>
  );
}

export function useComptePublicAuth(): ContextValue {
  const ctx = useContext(ComptePublicAuthContext);
  if (!ctx) throw new Error("useComptePublicAuth must be used inside <ComptePublicAuthProvider>");
  return ctx;
}
