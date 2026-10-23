import { useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { toast } from "sonner";

// Cycle de vie de la PWA : prévient quand l'app fonctionne hors ligne, et propose la mise à jour
// au lieu de recharger la page sans prévenir (un formulaire en cours serait perdu).

const VERIFICATION_MAJ_MS = 60 * 60 * 1000;

export function PwaUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (registration) setInterval(() => void registration.update(), VERIFICATION_MAJ_MS);
    },
  });

  useEffect(() => {
    if (!offlineReady) return;
    toast("Seek est prêt à fonctionner hors connexion.");
    setOfflineReady(false);
  }, [offlineReady, setOfflineReady]);

  useEffect(() => {
    if (!needRefresh) return;
    toast("Une nouvelle version de Seek est disponible.", {
      duration: Infinity,
      action: { label: "Mettre à jour", onClick: () => void updateServiceWorker(true) },
      onDismiss: () => setNeedRefresh(false),
    });
  }, [needRefresh, setNeedRefresh, updateServiceWorker]);

  return null;
}
