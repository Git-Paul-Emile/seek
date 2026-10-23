import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
import { useLocation } from "react-router-dom";
import {
  meLocataireApi,
  refreshLocataireApi,
  logoutLocataireApi,
} from "@/api/locataireAuth";
import type { Locataire } from "@/api/locataire";
import { socketService } from "@/services/socketService";
import { broadcastGlobalLogout, subscribeGlobalLogout } from "@/lib/authSync";
import { useComptePublicAuth } from "@/context/ComptePublicAuthContext";

const REFRESH_INTERVAL_MS = 14 * 60 * 1000;

interface LocataireAuthState {
  locataire: Locataire | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface LocataireAuthContextValue extends LocataireAuthState {
  setLocataire: (locataire: Locataire | null) => void;
  logout: () => Promise<void>;
}

const PUBLIC_LOCATAIRE_PATHS = ["/locataire/login", "/locataire/activer"];

const isPublicLocatairePage = (pathname: string) =>
  PUBLIC_LOCATAIRE_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));

const LocataireAuthContext = createContext<LocataireAuthContextValue | null>(null);

export function LocataireAuthProvider({ children }: { children: ReactNode }) {
  const [locataire, setLocataire] = useState<Locataire | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { pathname } = useLocation();
  const { refreshMe: refreshPublicAccount } = useComptePublicAuth();
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    refreshTimerRef.current = setInterval(async () => {
      try {
        await refreshLocataireApi();
      } catch {
        setLocataire(null);
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
    setLocataire((currentLocataire) => {
      if (currentLocataire) socketService.leaveLocataire(currentLocataire.id);
      return null;
    });
  }, [stopRefreshTimer]);

  const hasInitialized = useRef(false);

  useEffect(() => {
    const isFirstRun = !hasInitialized.current;

    if (isFirstRun) {
      hasInitialized.current = true;
    } else if (!pathname.startsWith("/locataire") || isPublicLocatairePage(pathname)) {
      return;
    }

    (async () => {
      try {
        const data = await meLocataireApi();
        setLocataire(data);
        await refreshPublicAccount();
        startRefreshTimer();
      } catch {
        try {
          await refreshLocataireApi();
          const data = await meLocataireApi();
          setLocataire(data);
          await refreshPublicAccount();
          startRefreshTimer();
        } catch {
          setLocataire(null);
          stopRefreshTimer();
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, [pathname, refreshPublicAccount]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => stopRefreshTimer(), [stopRefreshTimer]);

  useEffect(() => {
    return subscribeGlobalLogout(() => {
      clearSession();
      void logoutLocataireApi().catch(() => {
        // Ignore les erreurs de logout croisées.
      });
    });
  }, [clearSession]);

  useEffect(() => {
    if (!locataire) return;

    if (pathname.startsWith("/locataire")) {
      socketService.joinLocataire(locataire.id);
      return () => socketService.leaveLocataire(locataire.id);
    }

    socketService.leaveLocataire(locataire.id);
  }, [locataire, pathname]);

  const logout = useCallback(async () => {
    try {
      await logoutLocataireApi();
    } catch {
      // Déconnexion côté client quoi qu'il arrive
    } finally {
      clearSession();
      broadcastGlobalLogout();
    }
  }, [clearSession]);

  return (
    <LocataireAuthContext.Provider
      value={{
        locataire,
        isLoading,
        isAuthenticated: locataire !== null,
        setLocataire,
        logout,
      }}
    >
      {children}
    </LocataireAuthContext.Provider>
  );
}

export function useLocataireAuth(): LocataireAuthContextValue {
  const ctx = useContext(LocataireAuthContext);
  if (!ctx) {
    throw new Error("useLocataireAuth doit être utilisé dans un <LocataireAuthProvider>");
  }
  return ctx;
}
