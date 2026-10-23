import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Bell, ChevronRight, FileSearch, Flag, IdCard, RefreshCw } from "lucide-react";
import { useAdminNotifications } from "@/hooks/useNotificationInApp";
import type { AdminNotifItem, AdminNotifType } from "@/api/notificationInApp";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/brand/EmptyState";
import { BlocChargement, CarteAdmin, EnTeteAdmin } from "@/components/admin/table/Tableau";

// Notifications système de l'administration : une ligne par file à traiter, avec son compteur
// et un lien vers la page qui la traite (modèle de liste du tableau de bord).

const ICONE_TYPE: Record<AdminNotifType, LucideIcon> = {
  ANNONCE_EN_ATTENTE: FileSearch,
  VERIFICATION_EN_ATTENTE: IdCard,
  SIGNALEMENT_ACTIF: Flag,
};

function LigneNotification({ item }: { item: AdminNotifItem }) {
  const Icone = ICONE_TYPE[item.type] ?? Bell;
  return (
    <li>
      <Link to={item.lien} className="grid min-h-16 grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-4 hover:bg-surface/60 sm:px-6">
        <span className="flex size-12 items-center justify-center rounded-control bg-soleil-100 text-encre">
          <Icone aria-hidden className="size-5" />
        </span>
        <span className="min-w-0">
          <span className="block text-title font-semibold text-encre">{item.titre}</span>
          <span className="mt-0.5 block text-body-m text-texte2">{item.message}</span>
        </span>
        <span className="flex items-center gap-3">
          <span className="font-display text-h2 font-bold tabular-nums text-encre">{item.count}</span>
          <ChevronRight aria-hidden className="size-5 text-texte2" />
        </span>
      </Link>
    </li>
  );
}

export default function AdminNotificationsPage() {
  const { data, isLoading, refetch, isFetching } = useAdminNotifications();

  const items = data?.items ?? [];
  const total = data?.unreadCount ?? 0;

  return (
    <div className="mx-auto max-w-3xl">
      <EnTeteAdmin
        titre="Notifications"
        description={total > 0 ? `${total} élément${total > 1 ? "s" : ""} en attente d'une action` : "Rien en attente"}
        actions={
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw aria-hidden className={isFetching ? "animate-spin" : undefined} />
            Actualiser
          </Button>
        }
      />

      {isLoading ? (
        <BlocChargement label="Chargement des notifications" />
      ) : items.length === 0 ? (
        <CarteAdmin>
          <EmptyState titre="Tout est traité" texte="Aucune annonce, vérification ou signalement n'attend votre décision." illustration="bureau" />
        </CarteAdmin>
      ) : (
        <ul className="divide-y divide-filet rounded-card border border-filet bg-white">
          {items.map((item) => (
            <LigneNotification key={item.id} item={item} />
          ))}
        </ul>
      )}

      <p className="mt-6 text-center text-caption text-texte2">La liste se met à jour toute seule toutes les 15 secondes.</p>
    </div>
  );
}
