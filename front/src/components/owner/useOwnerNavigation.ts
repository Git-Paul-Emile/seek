import { useMemo } from "react";
import { Bell, Building2, LayoutGrid, Users, Wallet, type LucideIcon } from "lucide-react";
import { useOwnerAuth } from "@/context/OwnerAuthContext";
import { useOwnerNotifications } from "@/hooks/useNotificationInApp";
import { useBiensEnRetard, useTableauDeBord } from "@/hooks/useBail";

// Navigation de l'espace propriétaire, partagée par la barre latérale (desktop)
// et les onglets mobiles (charte, planche 27).

export interface OwnerNavItem {
  to: string;
  label: string;
  /** Libellé court des onglets mobiles. */
  shortLabel: string;
  icon: LucideIcon;
  badge?: number;
  /** Autres routes rattachées à cette entrée (sous-pages sans entrée propre). */
  actifSur?: string[];
}

export function useOwnerNavigation() {
  const { owner } = useOwnerAuth();
  const { data: notifications } = useOwnerNotifications();
  const { data: biensEnRetard } = useBiensEnRetard();
  const { data: tableauDeBord } = useTableauDeBord();

  const nbRetards = biensEnRetard?.length ?? 0;
  const nbNonLues = notifications?.unreadCount ?? 0;

  const items = useMemo<OwnerNavItem[]>(
    () => [
      { to: "/owner/dashboard", label: "Tableau de bord", shortLabel: "Tableau", icon: LayoutGrid },
      { to: "/owner/biens", label: "Mes biens", shortLabel: "Biens", icon: Building2 },
      { to: "/owner/locataires", label: "Locataires", shortLabel: "Locataires", icon: Users },
      { to: "/owner/paiements", label: "Paiements", shortLabel: "Paiements", icon: Wallet, badge: nbRetards, actifSur: ["/owner/loyers-retard"] },
      { to: "/owner/notifications", label: "Notifications", shortLabel: "Notifications", icon: Bell, badge: nbNonLues },
    ],
    [nbRetards, nbNonLues],
  );

  const initiales = `${owner?.prenom?.[0] ?? ""}${owner?.nom?.[0] ?? ""}`.toUpperCase() || "P";
  const nbBiens = tableauDeBord?.biens.total;
  const sousTitre =
    nbBiens === undefined ? "Propriétaire" : `Propriétaire · ${nbBiens} bien${nbBiens > 1 ? "s" : ""}`;

  return {
    items,
    nbNonLues,
    initiales,
    nomComplet: `${owner?.prenom ?? ""} ${owner?.nom ?? ""}`.trim(),
    sousTitre,
  };
}
