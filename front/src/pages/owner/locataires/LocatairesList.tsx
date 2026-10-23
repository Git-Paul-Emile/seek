import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Phone, Plus, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/input";
import { StatusBadge, type StatusTone } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/brand/EmptyState";
import { Initiales } from "@/components/owner/dashboard/SuiviLoyers";
import { useLocataires, useDeleteLocataire, usePendingVerificationsCount } from "@/hooks/useLocataire";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { toast } from "sonner";
import type { BailResume } from "@/api/locataire";

// ─── Constantes ───────────────────────────────────────────────────────────────

const STATUTS_BAIL_ACTIFS = ["ACTIF", "EN_PREAVIS", "EN_RENOUVELLEMENT", "EN_ATTENTE"] as const;
const STATUTS_BAIL_ANCIENS = ["TERMINE", "RESILIE", "ARCHIVE"] as const;

const BAIL_STATUT: Record<string, { label: string; tone: StatusTone }> = {
  ACTIF: { label: "Bail actif", tone: "positif" },
  EN_PREAVIS: { label: "En préavis", tone: "alerte" },
  EN_RENOUVELLEMENT: { label: "En renouvellement", tone: "attente" },
  EN_ATTENTE: { label: "Bail en attente", tone: "attente" },
  TERMINE: { label: "Terminé", tone: "arret" },
  RESILIE: { label: "Résilié", tone: "arret" },
  ARCHIVE: { label: "Archivé", tone: "neutre" },
};

const COMPTE: Record<string, { label: string; tone: StatusTone }> = {
  INVITE: { label: "Invitation envoyée", tone: "attente" },
  ACTIF: { label: "Compte actif", tone: "positif" },
  INACTIF: { label: "Inactif", tone: "neutre" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getBailActif = (bails?: BailResume[]) =>
  bails?.find((b) => (STATUTS_BAIL_ACTIFS as readonly string[]).includes(b.statut));

const getBailAncien = (bails?: BailResume[]) =>
  bails?.find((b) => (STATUTS_BAIL_ANCIENS as readonly string[]).includes(b.statut));

const isAncienLocataire = (bails?: BailResume[]) =>
  !getBailActif(bails) && !!getBailAncien(bails);

const isActifLocataire = (bails?: BailResume[]) =>
  !!getBailActif(bails);

type ViewTab = "ACTIFS" | "ANCIENS" | "INVITE" | "TOUS";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LocatairesList() {
  const { data: locataires = [], isLoading } = useLocataires();
  const { data: pendingData } = usePendingVerificationsCount();
  const pendingCount = pendingData?.count ?? 0;
  const deleteLocataire = useDeleteLocataire();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<ViewTab>("ACTIFS");

  // Dériver les groupes
  const actifs  = useMemo(() => locataires.filter((l) => isActifLocataire(l.bails)), [locataires]);
  const anciens  = useMemo(() => locataires.filter((l) => isAncienLocataire(l.bails)), [locataires]);
  const invites  = useMemo(() => locataires.filter((l) => !isActifLocataire(l.bails) && !isAncienLocataire(l.bails)), [locataires]);

  const baseList = useMemo(() => {
    switch (tab) {
      case "ACTIFS":  return actifs;
      case "ANCIENS": return anciens;
      case "INVITE":  return invites;
      default:        return locataires;
    }
  }, [tab, actifs, anciens, invites, locataires]);

  const filtered = useMemo(() => {
    if (!search.trim()) return baseList;
    const q = search.toLowerCase();
    return baseList.filter(
      (l) =>
        l.prenom.toLowerCase().includes(q) ||
        l.nom.toLowerCase().includes(q) ||
        l.telephone.includes(q) ||
        l.email?.toLowerCase().includes(q)
    );
  }, [baseList, search]);

  const handleDelete = async (id: string) => {
    try {
      await deleteLocataire.mutateAsync(id);
      toast.success("Locataire supprimé");
    } catch {
      toast.error("La fiche n'a pas pu être supprimée. Réessayez dans un instant.");
    } finally {
      setConfirmId(null);
    }
  };

  const tabs: { key: ViewTab; label: string; count: number }[] = [
    { key: "ACTIFS", label: "Avec bail", count: actifs.length },
    { key: "INVITE", label: "Sans bail", count: invites.length },
    { key: "ANCIENS", label: "Anciens", count: anciens.length },
    { key: "TOUS", label: "Tous", count: locataires.length },
  ];

  return (
    <div className="space-y-6">
      <header className="grid grid-cols-1 items-end gap-4 sm:grid-cols-[1fr_auto]">
        <div>
          <h1 className="font-display text-h2 font-bold text-encre lg:text-h1">Locataires</h1>
          {locataires.length > 0 && (
            <p className="mt-1 text-body-l text-texte2">
              {locataires.length} locataire{locataires.length > 1 ? "s" : ""}
              {pendingCount > 0 && ` · ${pendingCount} pièce${pendingCount > 1 ? "s" : ""} d'identité à vérifier`}
            </p>
          )}
        </div>
        <Button asChild>
          <Link to="/owner/locataires/ajouter">
            <Plus aria-hidden />
            Inviter un locataire
          </Link>
        </Button>
      </header>

      {locataires.length > 0 && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_minmax(280px,360px)] xl:items-center">
          <div className="hide-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 xl:mx-0 xl:px-0">
            {tabs.map((t) => (
              <Chip key={t.key} selected={tab === t.key} onClick={() => setTab(t.key)}>
                {t.label} · {t.count}
              </Chip>
            ))}
          </div>
          <div className="relative">
            <label htmlFor="recherche-locataires" className="sr-only">Rechercher un locataire</label>
            <Search aria-hidden className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-texte2" />
            <Input
              id="recherche-locataires"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nom, téléphone, e-mail"
              className="pl-12 pr-12 focus-visible:pl-12 focus-visible:pr-12"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Effacer la recherche"
                className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-texte2 hover:bg-surface"
              >
                <X aria-hidden className="size-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3" aria-busy="true" aria-label="Chargement des locataires">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-card bg-white" />)}
        </div>
      ) : locataires.length === 0 ? (
        <EmptyState
          titre="Aucun locataire pour l'instant"
          texte="Invitez votre locataire : il reçoit un lien pour compléter sa fiche et suivre ses paiements."
          illustration="appartement"
          action={
            <Button asChild>
              <Link to="/owner/locataires/ajouter">Inviter un locataire</Link>
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <p className="rounded-card bg-white p-6 text-center text-body-l text-texte2">
          {search ? `Aucun locataire ne correspond à « ${search.trim()} ».` : "Aucun locataire dans cette catégorie."}
        </p>
      ) : (
        <ul className="divide-y divide-filet rounded-card border border-filet bg-white px-4 lg:px-6">
          {filtered.map((loc) => {
            const bailActif = getBailActif(loc.bails);
            const bail = bailActif ?? getBailAncien(loc.bails);
            const statutBail = bail ? BAIL_STATUT[bail.statut] ?? { label: bail.statut, tone: "neutre" as const } : null;
            const compte = COMPTE[loc.statut] ?? { label: loc.statut, tone: "neutre" as const };
            const nom = `${loc.prenom} ${loc.nom}`;
            return (
              <li key={loc.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-4 py-4">
                <Initiales nom={nom} className={bailActif ? undefined : "bg-surface text-texte2"} />
                <Link to={`/owner/locataires/${loc.id}`} className="min-w-0">
                  <span className="block truncate text-title font-semibold text-encre">{nom}</span>
                  <span className="block truncate text-body-m text-texte2">
                    {bail?.bien ? bail.bien.titre || bail.bien.ville || "Bien loué" : "Aucun bail"}
                  </span>
                  <span className="mt-2 flex flex-wrap gap-2">
                    {statutBail && <StatusBadge tone={statutBail.tone} size="sm">{statutBail.label}</StatusBadge>}
                    <StatusBadge tone={compte.tone} size="sm">{compte.label}</StatusBadge>
                  </span>
                </Link>
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${loc.telephone}`}
                    aria-label={`Appeler ${nom}`}
                    title={loc.telephone}
                    className="flex size-10 items-center justify-center rounded-control border border-bord-champ text-encre hover:bg-surface"
                  >
                    <Phone aria-hidden className="size-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => setConfirmId(loc.id)}
                    aria-label={`Supprimer la fiche de ${nom}`}
                    className="flex size-10 items-center justify-center rounded-control border border-bord-champ text-encre hover:bg-surface"
                  >
                    <Trash2 aria-hidden className="size-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmModal
        open={confirmId !== null}
        title="Supprimer ce locataire ?"
        message="La fiche sera supprimée définitivement. Cette action ne peut pas être annulée."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="danger"
        isPending={deleteLocataire.isPending}
        onConfirm={() => { if (confirmId) handleDelete(confirmId); }}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
}
