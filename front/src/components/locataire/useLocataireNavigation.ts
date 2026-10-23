import { useMemo } from "react";
import { Bell, ClipboardCheck, FileText, History, House, UserRoundCog, Wallet, type LucideIcon } from "lucide-react";
import { useLocataireAuth } from "@/context/LocataireAuthContext";
import { useLocataireNotifications } from "@/hooks/useNotificationInApp";
import { useLocataireEcheancier } from "@/hooks/useLocataireEcheancier";

// Navigation de l'espace locataire, partagée par la barre latérale (desktop)
// et les onglets mobiles (charte, planches 27 et 34).

export interface LocataireNavItem {
  to: string;
  label: string;
  /** Libellé court des onglets mobiles. */
  shortLabel: string;
  icon: LucideIcon;
  badge?: number;
  /** Autres routes rattachées à cette entrée (sous-pages sans onglet propre). */
  actifSur?: string[];
  /** Routes sans onglet mobile propre, rattachées à cet onglet sur téléphone. */
  actifSurMobile?: string[];
}

/** Pages regroupées sous l'onglet mobile « Logement ». */
export const SOUS_PAGES_LOGEMENT = [
  { to: "/locataire/etats-des-lieux", label: "États des lieux" },
  { to: "/locataire/historique", label: "Mes logements" },
  { to: "/locataire/proprietaire", label: "Propriétaire" },
];

export const estSousPageLogement = (pathname: string) => SOUS_PAGES_LOGEMENT.some(({ to }) => pathname === to);

const STATUTS_BAIL_EN_COURS = ["ACTIF", "EN_PREAVIS"];

export function useLocataireNavigation() {
  const { locataire } = useLocataireAuth();
  const bailEnCours = locataire?.bails?.find((bail) => STATUTS_BAIL_EN_COURS.includes(bail.statut));
  const { data: notifications } = useLocataireNotifications();
  const { data: echeancier = [] } = useLocataireEcheancier(Boolean(bailEnCours));

  const nbRetards = echeancier.filter((echeance) => echeance.statut === "EN_RETARD").length;
  const nbNonLues = notifications?.unreadCount ?? 0;

  const items = useMemo<LocataireNavItem[]>(
    () => [
      { to: "/locataire/dashboard", label: "Accueil", shortLabel: "Accueil", icon: House },
      { to: "/locataire/paiements", label: "Paiements", shortLabel: "Paiements", icon: Wallet, badge: nbRetards },
      { to: "/locataire/documents", label: "Documents", shortLabel: "Documents", icon: FileText },
      {
        to: "/locataire/etats-des-lieux",
        label: "États des lieux",
        shortLabel: "Logement",
        icon: ClipboardCheck,
        actifSur: ["/locataire/bails/"],
        actifSurMobile: ["/locataire/historique", "/locataire/proprietaire"],
      },
      { to: "/locataire/historique", label: "Mes logements", shortLabel: "Logements", icon: History },
      { to: "/locataire/proprietaire", label: "Mon propriétaire", shortLabel: "Propriétaire", icon: UserRoundCog },
      { to: "/locataire/notifications", label: "Notifications", shortLabel: "Notifications", icon: Bell, badge: nbNonLues },
    ],
    [nbRetards, nbNonLues],
  );

  const initiales = `${locataire?.prenom?.[0] ?? ""}${locataire?.nom?.[0] ?? ""}`.toUpperCase() || "L";
  const titreLogement = bailEnCours?.bien?.titre || bailEnCours?.bien?.quartier || bailEnCours?.bien?.ville;

  return {
    items,
    nbNonLues,
    initiales,
    nomComplet: `${locataire?.prenom ?? ""} ${locataire?.nom ?? ""}`.trim(),
    sousTitre: titreLogement ? `Locataire · ${titreLogement}` : "Locataire",
  };
}
