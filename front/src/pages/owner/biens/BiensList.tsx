import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, TriangleAlert, X } from "lucide-react";
import type { Bien } from "@/api/bien";
import { useDeleteBien, useRetourBrouillon } from "@/hooks/useBien";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PropertyIllustration } from "@/components/brand/PropertyIllustration";
import { VerificationAlert } from "@/components/owner/VerificationAlert";
import { BienVignette } from "@/components/owner/BienVignette";
import { STATUT_ANNONCE, libelleOccupation } from "@/components/owner/bienStatut";
import { BienActions } from "@/components/owner/biens/BienActions";
import { FILTRES_BIENS, useListeBiens } from "@/components/owner/biens/useListeBiens";
import { formatMontant } from "@/lib/fcfa";
import { referenceBien } from "@/lib/referenceBien";

// « Mes biens » : puces de filtre, recherche et tableau de la charte (planche 25).

const DELAI_MASQUAGE_ALERTE_MS = 8000;

const localisation = (bien: Bien) =>
  [bien.quartier, bien.ville ?? bien.region].filter(Boolean).join(", ") || "Localisation à compléter";

const dateCourte = (date: string) => new Date(date).toLocaleDateString("fr-FR");

function BadgesAnnonce({ bien }: { bien: Bien }) {
  const statut = STATUT_ANNONCE[bien.statutAnnonce];
  return (
    <div className="flex flex-wrap items-center gap-2">
      <StatusBadge tone={statut.tone}>{statut.label}</StatusBadge>
      {bien.estMisEnAvant && <StatusBadge tone="premium">En avant</StatusBadge>}
    </div>
  );
}

interface ListeProps {
  biens: Bien[];
  onSupprimer: (id: string) => void;
  onRetirer: (id: string) => void;
}

function TableauBiens({ biens, onSupprimer, onRetirer }: ListeProps) {
  const entete = "px-4 py-4 text-left text-overline font-semibold uppercase text-texte2";
  return (
    <div className="hidden overflow-hidden rounded-card border border-filet bg-white md:block">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px]">
          <thead className="bg-surface">
            <tr>
              <th scope="col" className={`${entete} pl-6`}>Annonce</th>
              <th scope="col" className={entete}>Ville</th>
              <th scope="col" className={`${entete} text-right`}>Prix (FCFA)</th>
              <th scope="col" className={`${entete} hidden 2xl:table-cell`}>Créée le</th>
              <th scope="col" className={entete}>Statut</th>
              <th scope="col" className={`${entete} pr-6`}><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-filet">
            {biens.map((bien) => (
              <tr key={bien.id} className="transition-colors duration-hover hover:bg-surface/60">
                <td className="py-4 pl-6 pr-4">
                  <Link to={`/owner/biens/${bien.id}`} className="flex items-center gap-4 rounded-control">
                    <BienVignette photo={bien.photos?.[0]} typeLogement={bien.typeLogement?.slug} titre={bien.titre ?? "Bien"} />
                    <span className="min-w-[180px] max-w-[280px]">
                      <span className="line-clamp-2 text-title font-semibold text-encre">{bien.titre || "Bien sans titre"}</span>
                      <span className="block font-mono text-ref text-texte2">Réf. {referenceBien(bien.id)}</span>
                    </span>
                  </Link>
                </td>
                <td className="max-w-[180px] px-4 py-4 text-body-m text-encre">{localisation(bien)}</td>
                <td className="px-4 py-4 text-right text-body-l font-bold text-encre">
                  {bien.prix ? formatMontant(bien.prix) : ""}
                </td>
                <td className="hidden px-4 py-4 text-body-l text-encre 2xl:table-cell">{dateCourte(bien.createdAt)}</td>
                <td className="px-4 py-4">
                  <BadgesAnnonce bien={bien} />
                  <span className="mt-1.5 block text-body-m text-texte2">{libelleOccupation(bien)}</span>
                </td>
                <td className="py-4 pl-4 pr-6">
                  <BienActions bien={bien} onSupprimer={onSupprimer} onRetirer={onRetirer} compact />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CartesBiens({ biens, onSupprimer, onRetirer }: ListeProps) {
  return (
    <ul className="space-y-3 md:hidden">
      {biens.map((bien) => (
        <li key={bien.id} className="rounded-card bg-white p-4">
          <Link to={`/owner/biens/${bien.id}`} className="flex gap-4">
            <BienVignette
              photo={bien.photos?.[0]}
              typeLogement={bien.typeLogement?.slug}
              titre={bien.titre ?? "Bien"}
              className="h-20 w-24"
            />
            <span className="min-w-0 flex-1">
              <span className="line-clamp-2 text-title font-semibold text-encre">{bien.titre || "Bien sans titre"}</span>
              <span className="mt-0.5 block truncate text-body-m text-texte2">{localisation(bien)}</span>
              <span className="mt-1 block text-price font-bold text-encre">
                {bien.prix ? `${formatMontant(bien.prix)} FCFA` : ""}
              </span>
            </span>
          </Link>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-filet pt-4">
            <BadgesAnnonce bien={bien} />
            <BienActions bien={bien} onSupprimer={onSupprimer} onRetirer={onRetirer} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function EtatVide({ message }: { message: string }) {
  return (
    <div className="rounded-card border border-filet bg-white p-8 text-center">
      <div className="mx-auto h-32 max-w-[240px] overflow-hidden rounded-card">
        <PropertyIllustration kind="appartement" />
      </div>
      <p className="mt-5 text-title font-semibold text-encre">Aucun bien à afficher</p>
      <p className="mx-auto mt-1 max-w-md text-body-m text-texte2">{message}</p>
    </div>
  );
}

export default function BiensList() {
  const { biens, biensAffiches, isLoading, filtre, setFiltre, compteurs, recherche, setRecherche } = useListeBiens();
  const [suppressionId, setSuppressionId] = useState<string | null>(null);
  const [retraitId, setRetraitId] = useState<string | null>(null);
  const [alerteRejetVisible, setAlerteRejetVisible] = useState(true);
  const suppression = useDeleteBien();
  const retrait = useRetourBrouillon();

  useEffect(() => {
    const minuteur = setTimeout(() => setAlerteRejetVisible(false), DELAI_MASQUAGE_ALERTE_MS);
    return () => clearTimeout(minuteur);
  }, []);

  const nbRejetes = compteurs.REJETE ?? 0;
  const cibleRetrait = biens.find((b) => b.id === retraitId);
  const libelleRetrait = cibleRetrait?.statutAnnonce === "EN_ATTENTE" ? "Annuler la soumission" : "Dépublier";
  const filtreLabel = FILTRES_BIENS.find((f) => f.valeur === filtre)?.label.toLowerCase();
  const messageVide = recherche.trim()
    ? `Aucun bien ne correspond à « ${recherche.trim()} ».`
    : filtre === "TOUS"
      ? "Publiez votre premier bien pour le retrouver ici."
      : `Aucun bien dans « ${filtreLabel} ».`;

  return (
    <div className="space-y-6">
      <VerificationAlert variant="banner" />

      <header className="grid grid-cols-1 items-end gap-4 sm:grid-cols-[1fr_auto]">
        <div>
          <h1 className="font-display text-h2 font-bold text-encre lg:text-h1">Mes biens</h1>
          {!isLoading && (
            <p className="mt-1 text-body-l text-texte2">
              {biens.length} bien{biens.length > 1 ? "s" : ""} au total
            </p>
          )}
        </div>
        <Button asChild>
          <Link to="/owner/biens/ajouter">
            <Plus aria-hidden />
            Publier un bien
          </Link>
        </Button>
      </header>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_minmax(280px,360px)] xl:items-center">
        <div className="hide-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 xl:mx-0 xl:flex-wrap xl:overflow-visible xl:px-0">
          {FILTRES_BIENS.map(({ valeur, label }) => (
            <Chip key={valeur} selected={filtre === valeur} onClick={() => setFiltre(valeur)}>
              {label} · {compteurs[valeur] ?? 0}
            </Chip>
          ))}
        </div>
        <div className="relative">
          <label htmlFor="recherche-biens" className="sr-only">Rechercher un bien</label>
          <Search aria-hidden className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-texte2" />
          <Input
            id="recherche-biens"
            type="search"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Titre, quartier, type"
            className="pl-12 pr-12 focus-visible:pl-12 focus-visible:pr-12"
          />
          {recherche && (
            <button
              type="button"
              onClick={() => setRecherche("")}
              aria-label="Effacer la recherche"
              className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-texte2 hover:bg-surface"
            >
              <X aria-hidden className="size-4" />
            </button>
          )}
        </div>
      </div>

      {alerteRejetVisible && nbRejetes > 0 && (filtre === "TOUS" || filtre === "REJETE") && (
        <div role="status" className="flex items-start gap-3 rounded-card bg-soleil p-4 text-encre">
          <TriangleAlert aria-hidden className="mt-0.5 size-5 shrink-0" />
          <p className="flex-1 text-body-m font-semibold">
            {nbRejetes} annonce{nbRejetes > 1 ? "s" : ""} rejetée{nbRejetes > 1 ? "s" : ""}. Ouvrez-la pour lire le motif,
            corrigez-la puis soumettez-la à nouveau.
          </p>
          <button
            type="button"
            onClick={() => setAlerteRejetVisible(false)}
            aria-label="Masquer l'alerte"
            className="flex size-8 shrink-0 items-center justify-center rounded-full hover:bg-soleil-600"
          >
            <X aria-hidden className="size-4" />
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3" aria-busy="true" aria-label="Chargement des biens">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-card bg-white" />
          ))}
        </div>
      ) : biensAffiches.length === 0 ? (
        <EtatVide message={messageVide} />
      ) : (
        <>
          <TableauBiens biens={biensAffiches} onSupprimer={setSuppressionId} onRetirer={setRetraitId} />
          <CartesBiens biens={biensAffiches} onSupprimer={setSuppressionId} onRetirer={setRetraitId} />
        </>
      )}

      <ConfirmModal
        open={suppressionId !== null}
        title="Supprimer l'annonce"
        message="L'annonce sera supprimée définitivement. Cette action ne peut pas être annulée."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="danger"
        isPending={suppression.isPending}
        onConfirm={() => {
          if (suppressionId) suppression.mutate(suppressionId, { onSettled: () => setSuppressionId(null) });
        }}
        onCancel={() => setSuppressionId(null)}
      />
      <ConfirmModal
        open={retraitId !== null}
        title={libelleRetrait}
        message={
          cibleRetrait?.statutAnnonce === "EN_ATTENTE"
            ? "La soumission sera annulée. L'annonce repassera en brouillon."
            : "L'annonce ne sera plus visible et repassera en brouillon."
        }
        confirmLabel={libelleRetrait}
        cancelLabel="Annuler"
        variant="warning"
        isPending={retrait.isPending}
        onConfirm={() => {
          if (retraitId) retrait.mutate(retraitId, { onSettled: () => setRetraitId(null) });
        }}
        onCancel={() => setRetraitId(null)}
      />
    </div>
  );
}
