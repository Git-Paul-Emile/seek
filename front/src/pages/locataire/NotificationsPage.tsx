import { Link } from "react-router-dom";
import { Bell, CheckCheck, CircleCheck, TriangleAlert, type LucideIcon } from "lucide-react";
import {
  useLocataireNotifications,
  useMarkLocataireNotificationsRead,
  useMarkLocataireOneNotificationRead,
} from "@/hooks/useNotificationInApp";
import type { InAppNotification } from "@/api/notificationInApp";
import { SkListItems } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/brand/EmptyState";
import { formatIlYA } from "@/lib/dates";
import { cn } from "@/lib/utils";

const TYPE_LABELS: Record<string, string> = {
  RAPPEL_LOYER: "Rappel de loyer",
  CONFIRMATION_PAIEMENT: "Paiement confirmé",
  ALERTE_RETARD: "Loyer en retard",
  PREAVIS: "Préavis",
  RESILIATION: "Résiliation",
  FIN_BAIL: "Fin de bail",
  CONTRAT: "Contrat",
  ALERTE: "Alerte",
  INVITATION_BAIL: "Invitation à un bail",
  PAIEMENT_ESPECES_LOCATAIRE: "Paiement en espèces",
  ETAT_DES_LIEUX_DISPONIBLE: "État des lieux à valider",
  ETAT_DES_LIEUX_VALIDE: "État des lieux validé",
  ETAT_DES_LIEUX_MODIFIE: "État des lieux mis à jour",
};

// Pas de rouge : les alertes sont en Soleil avec le triangle (planche « Statuts »).
const TYPES_ALERTE = ["ALERTE_RETARD", "RESILIATION", "FIN_BAIL", "ALERTE"];
const TYPES_POSITIFS = ["CONFIRMATION_PAIEMENT", "ETAT_DES_LIEUX_VALIDE"];

function apparence(type: string): { icon: LucideIcon; className: string } {
  if (TYPES_ALERTE.includes(type)) return { icon: TriangleAlert, className: "bg-soleil text-encre" };
  if (TYPES_POSITIFS.includes(type)) return { icon: CircleCheck, className: "bg-baobab-100 text-baobab" };
  return { icon: Bell, className: "bg-surface text-encre" };
}

function destination(type: string) {
  if (type.startsWith("ETAT_DES_LIEUX_")) return "/locataire/etats-des-lieux";
  if (type.includes("PAIEMENT") || type === "RAPPEL_LOYER" || type === "ALERTE_RETARD") return "/locataire/paiements";
  return "/locataire/dashboard";
}

function LigneNotification({ notification }: { notification: InAppNotification }) {
  const { mutate: marquerLue } = useMarkLocataireOneNotificationRead();
  const { icon: Icon, className } = apparence(notification.type);
  const libelle = TYPE_LABELS[notification.type] ?? notification.type;
  return (
    <li>
      <Link
        to={destination(notification.type)}
        onClick={() => !notification.lu && marquerLue(notification.id)}
        className="grid grid-cols-[auto_1fr_auto] items-start gap-4 py-4 transition-colors duration-hover hover:bg-surface/60"
      >
        <span className={cn("flex size-11 items-center justify-center rounded-full", className)}>
          <Icon aria-hidden className="size-5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <p className={cn("text-title text-encre", notification.lu ? "font-medium" : "font-bold")}>{notification.sujet ?? libelle}</p>
          <p className="mt-1 text-body-m text-texte2">
            {libelle} · {formatIlYA(notification.createdAt)}
          </p>
        </div>
        {!notification.lu && (
          <span className="mt-2 size-3 rounded-full bg-soleil">
            <span className="sr-only">Non lue</span>
          </span>
        )}
      </Link>
    </li>
  );
}

export default function NotificationsLocatairePage() {
  const { data, isLoading } = useLocataireNotifications();
  const { mutate: toutMarquerLu, isPending } = useMarkLocataireNotificationsRead();
  const notifications = data?.notifications ?? [];
  const nonLues = data?.unreadCount ?? 0;

  return (
    <div className="max-w-3xl space-y-6">
      <header className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <h1 className="font-display text-h2 font-bold text-encre lg:text-h1">Notifications</h1>
          <p className="mt-1 text-body-l text-texte2">
            {nonLues > 0 ? `${nonLues} non lue${nonLues > 1 ? "s" : ""}` : "Tout est lu"}
          </p>
        </div>
        {nonLues > 0 && (
          <Button variant="outline" onClick={() => toutMarquerLu()} disabled={isPending}>
            <CheckCheck aria-hidden />
            Tout marquer comme lu
          </Button>
        )}
      </header>
      {isLoading ? (
        <SkListItems items={5} itemHeight="h-20" />
      ) : notifications.length === 0 ? (
        <EmptyState titre="Aucune notification" texte="Les rappels de loyer, confirmations de paiement et messages de votre propriétaire apparaîtront ici." />
      ) : (
        <ul className="divide-y divide-filet rounded-card bg-white px-4 lg:px-6">
          {notifications.map((notification) => (
            <LigneNotification key={notification.id} notification={notification} />
          ))}
        </ul>
      )}
    </div>
  );
}
