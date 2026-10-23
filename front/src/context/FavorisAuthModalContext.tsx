import { createContext, useContext, useState, useRef, useCallback, type ReactNode } from "react";
import FavorisAuthModal from "@/components/FavorisAuthModal";

interface ContextValue {
  openModal: (bienId?: string) => void;
  getPendingBienId: () => string | null;
  clearPendingBienId: () => void;
}

const FavorisAuthModalContext = createContext<ContextValue | null>(null);

export function FavorisAuthModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pendingBienIdRef = useRef<string | null>(null);

  const openModal = useCallback((bienId?: string) => {
    if (bienId) pendingBienIdRef.current = bienId;
    setOpen(true);
  }, []);

  const getPendingBienId = useCallback(() => pendingBienIdRef.current, []);
  const clearPendingBienId = useCallback(() => { pendingBienIdRef.current = null; }, []);

  return (
    <FavorisAuthModalContext.Provider value={{ openModal, getPendingBienId, clearPendingBienId }}>
      {children}
      {open && (
        <FavorisAuthModal
          onClose={() => setOpen(false)}
          hasPendingBien={pendingBienIdRef.current !== null}
        />
      )}
    </FavorisAuthModalContext.Provider>
  );
}

export function useFavorisAuthModal(): ContextValue {
  const ctx = useContext(FavorisAuthModalContext);
  if (!ctx) throw new Error("useFavorisAuthModal must be used inside <FavorisAuthModalProvider>");
  return ctx;
}
