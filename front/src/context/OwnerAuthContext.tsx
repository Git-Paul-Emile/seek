import { useLocation } from "react-router-dom";
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
  loginOwnerApi,
  meOwnerApi,
  refreshOwnerApi,
  logoutOwnerApi,
  type OwnerInfo,
} from "@/api/ownerAuth";
import { socketService } from "@/services/socketService";
import { broadcastGlobalLogout, subscribeGlobalLogout } from "@/lib/authSync";
import { useComptePublicAuth } from "@/context/ComptePublicAuthContext";

const REFRESH_INTERVAL_MS = 14 * 60 * 1000;

interface OwnerAuthState {
  owner: OwnerInfo | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface OwnerAuthContextValue extends OwnerAuthState {
  login: (identifiant: string, password: string) => Promise<OwnerInfo>;
  setOwner: (owner: OwnerInfo | null) => void;
  logout: () => Promise<void>;
}

const OwnerAuthContext = createContext<OwnerAuthContextValue | null>(null);

export function OwnerAuthProvider({ children }: { children: ReactNode }) {
  const [owner, setOwner] = useState<OwnerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { pathname } = useLocation();
  const { refreshMe: refreshPublicAccount } = useComptePublicAuth();

  const startRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    refreshTimerRef.current = setInterval(async () => {
      try {
        await refreshOwnerApi();
      } catch {
        setOwner(null);
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
    setOwner((currentOwner) => {
      if (currentOwner) socketService.leaveOwner(currentOwner.id);
      return null;
    });
  }, [stopRefreshTimer]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await meOwnerApi();
        setOwner(data.data);
        await refreshPublicAccount();
        startRefreshTimer();
      } catch {
        try {
          await refreshOwnerApi();
          const { data } = await meOwnerApi();
          setOwner(data.data);
          await refreshPublicAccount();
          startRefreshTimer();
        } catch {
          setOwner(null);
          stopRefreshTimer();
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, [refreshPublicAccount]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => stopRefreshTimer(), [stopRefreshTimer]);

  useEffect(() => {
    return subscribeGlobalLogout(() => {
      clearSession();
      void logoutOwnerApi().catch(() => {
        // Ignore les erreurs de logout croisées.
      });
    });
  }, [clearSession]);

  useEffect(() => {
    if (!owner) return;

    if (pathname.startsWith("/owner")) {
      socketService.joinOwner(owner.id);
      return () => socketService.leaveOwner(owner.id);
    }

    socketService.leaveOwner(owner.id);
  }, [owner, pathname]);

  const login = useCallback(async (identifiant: string, password: string) => {
    const response = await loginOwnerApi({ identifiant, password });
    const authenticatedOwner = response.data.data;

    setOwner(authenticatedOwner);
    await refreshPublicAccount();
    startRefreshTimer();

    return authenticatedOwner;
  }, [refreshPublicAccount, startRefreshTimer]);

  const logout = useCallback(async () => {
    try {
      await logoutOwnerApi();
    } catch {
      // Déconnexion côté client quoi qu'il arrive
    } finally {
      clearSession();
      broadcastGlobalLogout();
    }
  }, [clearSession]);

  return (
    <OwnerAuthContext.Provider
      value={{
        owner,
        isLoading,
        isAuthenticated: owner !== null,
        login,
        setOwner,
        logout,
      }}
    >
      {children}
    </OwnerAuthContext.Provider>
  );
}

export function useOwnerAuth(): OwnerAuthContextValue {
  const ctx = useContext(OwnerAuthContext);
  if (!ctx) {
    throw new Error("useOwnerAuth doit être utilisé dans un <OwnerAuthProvider>");
  }
  return ctx;
}
