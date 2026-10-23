import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ClipboardCheck, FileDown, PlusCircle, Search, Trash2 } from "lucide-react";
import { getEtatsDesLieuxByBailOwner, deleteEtatDesLieux, getCreationContextOwner, type EtatDesLieux, type EtatDesLieuxCreationContext, type StatutEtatDesLieux } from "@/api/etatDesLieux.api";
import { Button, buttonVariants } from "@/components/ui/button";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { SkListItems } from "@/components/ui/Skeleton";
import { StatusBadge, type StatusTone } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/brand/EmptyState";
import { formatDateLongue } from "@/lib/dates";
import { cn } from "@/lib/utils";

// États des lieux d'un bail, côté propriétaire, au modèle de la liste du locataire (lot 3) :
// une ligne par état des lieux, puis les actions de création et de comparaison.

const STATUTS: Record<StatutEtatDesLieux, { label: string; tone: StatusTone }> = {
  BROUILLON: { label: "Brouillon", tone: "neutre" },
  EN_ATTENTE_VALIDATION: { label: "Envoyé au locataire", tone: "attente" },
  VALIDE: { label: "Signé", tone: "positif" },
  CONTESTE: { label: "Contesté", tone: "alerte" },
  EN_LITIGE: { label: "En litige", tone: "alerte" },
};

const MODIFIABLE: StatutEtatDesLieux[] = ["BROUILLON", "CONTESTE"];

function LigneEtatDesLieux({ edl, onSupprimer }: { edl: EtatDesLieux; onSupprimer: () => void }) {
  const statut = STATUTS[edl.statut] ?? { label: edl.statut, tone: "neutre" as const };
  const aReprendre = MODIFIABLE.includes(edl.statut);
  return (
    <li className="grid grid-cols-[auto_1fr] items-center gap-4 py-4 sm:grid-cols-[auto_1fr_auto]">
      <span className={cn("flex size-11 items-center justify-center rounded-control", aReprendre ? "bg-soleil text-encre" : "bg-baobab-100 text-baobab")}>
        <ClipboardCheck aria-hidden className="size-5" strokeWidth={1.75} />
      </span>
      <div className="min-w-0">
        <p className="text-title font-semibold text-encre">État des lieux {edl.type === "ENTREE" ? "d'entrée" : "de sortie"}</p>
        <p className="text-body-m text-texte2">Créé le {formatDateLongue(edl.createdAt)}</p>
        <StatusBadge tone={statut.tone} size="sm" className="mt-2">
          {statut.label}
        </StatusBadge>
      </div>
      <div className="col-span-2 flex flex-wrap gap-2 sm:col-span-1 sm:justify-end">
        <Link to={`/owner/etats-des-lieux/${edl.id}`} className={buttonVariants({ size: "sm", variant: aReprendre ? "default" : "outline" })}>
          {aReprendre ? "Reprendre" : "Voir"}
        </Link>
        {edl.documentPdf && (
          <a href={edl.documentPdf} target="_blank" rel="noreferrer" className={buttonVariants({ size: "sm", variant: "outline" })}>
            <FileDown aria-hidden />
            PDF
          </a>
        )}
        {edl.statut === "BROUILLON" && (
          <Button size="icon-sm" variant="outline" aria-label="Supprimer ce brouillon" onClick={onSupprimer}>
            <Trash2 aria-hidden />
          </Button>
        )}
      </div>
    </li>
  );
}

export default function EtatDesLieuxList() {
  const { bailId = "" } = useParams<{ bailId: string }>();
  const [edls, setEdls] = useState<EtatDesLieux[]>([]);
  const [contexte, setContexte] = useState<EtatDesLieuxCreationContext | null>(null);
  const [chargement, setChargement] = useState(true);
  const [aSupprimer, setASupprimer] = useState<string | null>(null);
  const [suppression, setSuppression] = useState(false);

  const charger = useCallback(async () => {
    try {
      setChargement(true);
      const [liste, contexteCreation] = await Promise.all([getEtatsDesLieuxByBailOwner(bailId), getCreationContextOwner(bailId)]);
      setEdls(liste);
      setContexte(contexteCreation);
    } catch {
      toast.error("Les états des lieux n'ont pas pu être chargés. Réessayez.");
    } finally {
      setChargement(false);
    }
  }, [bailId]);

  useEffect(() => {
    if (bailId) charger();
  }, [bailId, charger]);

  const supprimer = async () => {
    if (!aSupprimer) return;
    setSuppression(true);
    try {
      await deleteEtatDesLieux(aSupprimer);
      toast.success("Brouillon supprimé");
      setASupprimer(null);
      charger();
    } catch {
      toast.error("Le brouillon n'a pas pu être supprimé. Réessayez.");
    } finally {
      setSuppression(false);
    }
  };

  const aEntree = edls.some(({ type }) => type === "ENTREE");
  const aSortie = edls.some(({ type }) => type === "SORTIE");
  const sortiePossible = contexte?.canCreateSortie ?? false;

  return (
    <div className="max-w-3xl space-y-6">
      <header className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <h1 className="font-display text-h2 font-bold text-encre lg:text-h1">États des lieux</h1>
          <p className="mt-1 text-body-l text-texte2">L'état des lieux d'entrée et celui de sortie de ce bail.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {aEntree && aSortie && (
            <Link to={`/owner/bails/${bailId}/etats-des-lieux/comparaison`} className={buttonVariants({ variant: "outline" })}>
              <Search aria-hidden />
              Comparer entrée et sortie
            </Link>
          )}
          {!aEntree && (
            <Link to={`/owner/bails/${bailId}/etats-des-lieux/creer?type=ENTREE`} className={buttonVariants()}>
              <PlusCircle aria-hidden />
              État des lieux d'entrée
            </Link>
          )}
          {aEntree && !aSortie && sortiePossible && (
            <Link to={`/owner/bails/${bailId}/etats-des-lieux/creer?type=SORTIE`} className={buttonVariants()}>
              <PlusCircle aria-hidden />
              État des lieux de sortie
            </Link>
          )}
        </div>
      </header>

      {aEntree && !aSortie && !sortiePossible && contexte?.sortieBlockReason && (
        <p className="rounded-card bg-soleil-100 p-4 text-body-m text-encre">{contexte.sortieBlockReason}</p>
      )}

      {chargement ? (
        <SkListItems items={2} itemHeight="h-20" />
      ) : edls.length === 0 ? (
        <EmptyState titre="Aucun état des lieux" texte="Commencez par l'état des lieux d'entrée : pièce par pièce, avec photos, puis envoyez-le au locataire pour signature." />
      ) : (
        <ul className="divide-y divide-filet rounded-card bg-white px-4 lg:px-6">
          {edls.map((edl) => (
            <LigneEtatDesLieux key={edl.id} edl={edl} onSupprimer={() => setASupprimer(edl.id)} />
          ))}
        </ul>
      )}

      <ConfirmModal
        open={Boolean(aSupprimer)}
        title="Supprimer ce brouillon ?"
        message="Les pièces et les éléments déjà saisis seront supprimés définitivement."
        confirmLabel="Supprimer"
        isPending={suppression}
        onConfirm={supprimer}
        onCancel={() => setASupprimer(null)}
      />
    </div>
  );
}
