import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

// Bandeau hors ligne de la PWA : les pages et annonces déjà vues restent lisibles,
// les actions (paiement, publication, message) attendent le retour du réseau.
export function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <div role="status" className="sticky top-0 z-40 border-b border-soleil bg-soleil-100 lg:top-20">
      <p className="container flex items-start gap-3 py-3 text-body-m text-encre">
        <WifiOff aria-hidden className="mt-0.5 size-5 shrink-0" />
        <span>
          <strong className="font-semibold">Vous êtes hors ligne.</strong> Les annonces déjà consultées restent lisibles.
          Les envois reprendront au retour du réseau.
        </span>
      </p>
    </div>
  );
}
