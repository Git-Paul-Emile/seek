import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CreditCard,
  FileText,
  Flag,
  IdCard,
  LayoutGrid,
  Layers,
  MapPin,
  MessageSquare,
  Settings2,
  Star,
  Ban,
  Users,
  Building2,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAnnoncesStatusCounts } from "@/hooks/useAnnonces";
import { usePendingVerificationsCount } from "@/hooks/useAdminVerification";
import { useAdminNotifications } from "@/hooks/useNotificationInApp";
import { fetchSignalementsAdmin } from "@/api/signalement";

// Navigation de l'administration (charte, planche 41) : barre encre en trois sections,
// Modération, Finances, Configuration. Partagée par la barre latérale et le mobile.

export interface AdminNavLien {
  to: string;
  label: string;
  /** Libellé court des onglets mobiles. */
  shortLabel?: string;
  icon: LucideIcon;
  badge?: number;
  /** Sous-pages affichées sous l'entrée quand elle est active. */
  enfants?: { to: string; label: string }[];
  /** Autres routes rattachées à l'entrée (pages de détail sans lien propre). */
  actifSur?: string[];
}

export interface AdminNavSection {
  titre?: string;
  liens: AdminNavLien[];
}

/** Même clé que la page Signalements : le compteur suit ses mises à jour. */
const useSignalementsEnAttente = () =>
  useQuery({
    queryKey: ["admin-signalements", "EN_ATTENTE", ""],
    queryFn: () => fetchSignalementsAdmin({ statut: "EN_ATTENTE", search: "" }),
    staleTime: 30 * 1000,
  });

export const routeActive = (pathname: string, route: string) => pathname === route || pathname.startsWith(`${route}/`);

export const estActif = (pathname: string, lien: Pick<AdminNavLien, "to" | "enfants" | "actifSur">) =>
  [lien.to, ...(lien.enfants?.map(({ to }) => to) ?? []), ...(lien.actifSur ?? [])].some((route) => routeActive(pathname, route));

export function useAdminNavigation() {
  const { admin } = useAuth();
  const { data: compteurs } = useAnnoncesStatusCounts();
  const { data: nbVerifications = 0 } = usePendingVerificationsCount();
  const { data: signalements = [] } = useSignalementsEnAttente();
  const { data: notifications } = useAdminNotifications();

  const nbAnnonces = compteurs?.EN_ATTENTE ?? 0;
  const nbSignalements = signalements.length;
  const nbNonLues = notifications?.unreadCount ?? 0;

  const sections: AdminNavSection[] = [
    { liens: [{ to: "/admin/dashboard", label: "Tableau de bord", shortLabel: "Tableau", icon: LayoutGrid }] },
    {
      titre: "Modération",
      liens: [
        { to: "/admin/annonces", label: "Annonces", shortLabel: "Annonces", icon: Building2, badge: nbAnnonces },
        { to: "/admin/verifications", label: "Vérifications d'identité", shortLabel: "Identités", icon: IdCard, badge: nbVerifications },
        { to: "/admin/signalements", label: "Signalements", shortLabel: "Signalés", icon: Flag, badge: nbSignalements },
        {
          to: "/admin/utilisateurs/proprietaires",
          label: "Utilisateurs",
          icon: Users,
          enfants: [
            { to: "/admin/utilisateurs/proprietaires", label: "Propriétaires" },
            { to: "/admin/utilisateurs/locataires", label: "Locataires" },
            { to: "/admin/proprietaires", label: "Statistiques propriétaires" },
          ],
          actifSur: ["/admin/locataires"],
        },
        { to: "/admin/suspensions", label: "Suspensions", icon: Ban },
        {
          to: "/admin/temoignages",
          label: "Avis et retours",
          icon: MessageSquare,
          enfants: [
            { to: "/admin/temoignages", label: "Témoignages" },
            { to: "/admin/feedbacks", label: "Retours d'expérience" },
          ],
        },
      ],
    },
    {
      titre: "Finances",
      liens: [
        { to: "/admin/transactions", label: "Transactions", icon: CreditCard },
        {
          to: "/admin/premium/formules",
          label: "Promotions et Premium",
          icon: Star,
          enfants: [
            { to: "/admin/premium/formules", label: "Formules premium" },
            { to: "/admin/premium/historique", label: "Mises en avant" },
            { to: "/admin/monetisation/config", label: "Monétisation" },
          ],
        },
      ],
    },
    {
      titre: "Configuration",
      liens: [
        {
          to: "/admin/geo/pays",
          label: "Géographie",
          icon: MapPin,
          enfants: [
            { to: "/admin/geo/pays", label: "Pays" },
            { to: "/admin/geo/villes", label: "Villes" },
            { to: "/admin/geo/quartiers", label: "Quartiers" },
          ],
        },
        {
          to: "/admin/biens/categories",
          label: "Catégories et champs",
          icon: Layers,
          enfants: [
            { to: "/admin/biens/categories", label: "Types de logement" },
            { to: "/admin/biens/transactions", label: "Types de transaction" },
            { to: "/admin/biens/statuts", label: "Statuts des biens" },
            { to: "/admin/biens/meuble-equipement", label: "Meubles et équipements" },
            { to: "/admin/champs/categories", label: "Catégories de champs" },
            { to: "/admin/champs", label: "Champs de formulaire" },
          ],
          actifSur: ["/admin/biens/types"],
        },
        { to: "/admin/contrats/modeles", label: "Modèles de contrats", icon: FileText },
        {
          to: "/admin/parametres/config-site",
          label: "Site et pages légales",
          icon: Settings2,
          enfants: [
            { to: "/admin/parametres/config-site", label: "Configuration du site" },
            { to: "/admin/parametres/pages-legales", label: "Pages légales" },
          ],
        },
      ],
    },
    { titre: "Compte", liens: [{ to: "/admin/notifications", label: "Notifications", icon: Bell, badge: nbNonLues }] },
  ];

  return {
    sections,
    nbAnnonces,
    nbNonLues,
    email: admin?.email ?? "",
    initiale: admin?.email?.[0]?.toUpperCase() ?? "A",
  };
}

export function useDeconnexionAdmin() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  return async () => {
    await logout();
    navigate("/admin/login", { replace: true });
  };
}
