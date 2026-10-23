import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ChevronLeft } from "lucide-react";
import { getComparisonOwner, getComparisonLocataire, type EtatDesLieux } from "@/api/etatDesLieux.api";
import { SkListItems } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/brand/EmptyState";
import { formatDateLongue } from "@/lib/dates";
import { cn } from "@/lib/utils";

// Comparaison entrée et sortie d'un bail (propriétaire et locataire) : une carte par pièce,
// chaque élément avec son état à l'entrée et à la sortie, l'écart signalé par un statut.

interface Props {
  role: "PROPRIETAIRE" | "LOCATAIRE";
}

type Ecart = "DEGRADE" | "AMELIORE" | "IDENTIQUE" | "NON_EVALUE";

const SCORE_ETAT: Record<string, number> = { NEUF: 4, BON: 3, USAGE: 2, MAUVAIS: 1, DEGRADE: 0 };
const LIBELLE_ETAT: Record<string, string> = { NEUF: "Neuf", BON: "Bon état", USAGE: "Usé", MAUVAIS: "Mauvais état", DEGRADE: "Dégradé" };

const libelleEtat = (etat: string) => LIBELLE_ETAT[etat] ?? etat.replace(/_/g, " ").toLowerCase();

const ecartEntre = (entree: string, sortie: string | undefined): Ecart => {
  if (!sortie) return "NON_EVALUE";
  const difference = (SCORE_ETAT[entree] ?? 0) - (SCORE_ETAT[sortie] ?? 0);
  if (difference > 0) return "DEGRADE";
  if (difference < 0) return "AMELIORE";
  return "IDENTIQUE";
};

function Etat({ moment, etat, commentaire, ecart }: { moment: string; etat?: string; commentaire?: string | null; ecart?: Ecart }) {
  return (
    <div className={cn("rounded-control p-3", ecart === "DEGRADE" ? "bg-soleil-100" : "bg-surface")}>
      <p className="text-overline font-semibold uppercase text-texte2">{moment}</p>
      <p className="mt-1 font-semibold text-encre">{etat ? libelleEtat(etat) : "Non évalué"}</p>
      {commentaire && <p className="mt-1 text-body-m text-texte2">« {commentaire} »</p>}
    </div>
  );
}

export default function EtatDesLieuxComparison({ role }: Props) {
  const { bailId = "" } = useParams<{ bailId: string }>();
  const navigate = useNavigate();
  const [chargement, setChargement] = useState(true);
  const [entree, setEntree] = useState<EtatDesLieux | null>(null);
  const [sortie, setSortie] = useState<EtatDesLieux | null>(null);

  const charger = useCallback(async () => {
    try {
      setChargement(true);
      const donnees = role === "PROPRIETAIRE" ? await getComparisonOwner(bailId) : await getComparisonLocataire(bailId);
      setEntree(donnees.entree);
      setSortie(donnees.sortie);
    } catch {
      toast.error("La comparaison n'a pas pu être chargée. Réessayez.");
    } finally {
      setChargement(false);
    }
  }, [bailId, role]);

  useEffect(() => {
    if (bailId) charger();
  }, [bailId, charger]);

  const entete = (
    <header>
      <button type="button" onClick={() => navigate(-1)} className="inline-flex min-h-10 items-center gap-1 text-body-m font-semibold text-baobab hover:underline">
        <ChevronLeft aria-hidden className="size-4" />
        États des lieux
      </button>
      <h1 className="mt-1 font-display text-h2 font-bold text-encre lg:text-h1">Entrée et sortie</h1>
      {entree && sortie && (
        <p className="mt-1 text-body-l text-texte2">
          Entrée du {formatDateLongue(entree.createdAt)}, sortie du {formatDateLongue(sortie.createdAt)}.
        </p>
      )}
    </header>
  );

  if (chargement) {
    return (
      <div className="max-w-4xl space-y-6">
        {entete}
        <SkListItems items={3} itemHeight="h-32" />
      </div>
    );
  }

  if (!entree || !sortie) {
    return (
      <div className="max-w-4xl space-y-6">
        {entete}
        <EmptyState titre="Comparaison pas encore possible" texte="Il faut un état des lieux d'entrée et un état des lieux de sortie pour comparer les deux." />
      </div>
    );
  }

  const elementSortie = (piece: string, element: string) => sortie.pieces.find(({ nom }) => nom === piece)?.elements.find(({ nom }) => nom === element);

  return (
    <div className="max-w-4xl space-y-6">
      {entete}

      {entree.pieces.map((piece) => (
        <section key={piece.nom} aria-label={piece.nom} className="rounded-card bg-white p-5 lg:p-6">
          <h2 className="font-display text-h3 font-bold text-encre">{piece.nom}</h2>
          <ul className="mt-4 divide-y divide-filet">
            {piece.elements.map((element) => {
              const aLaSortie = elementSortie(piece.nom, element.nom);
              const ecart = ecartEntre(element.etat, aLaSortie?.etat);
              return (
                <li key={element.nom} className="grid gap-3 py-4 md:grid-cols-[200px_1fr_1fr]">
                  <div>
                    <p className="font-semibold text-encre">{element.nom}</p>
                    {ecart === "DEGRADE" && (
                      <StatusBadge tone="alerte" size="sm" className="mt-1">
                        Dégradé
                      </StatusBadge>
                    )}
                    {ecart === "AMELIORE" && (
                      <StatusBadge tone="positif" size="sm" className="mt-1">
                        Amélioré
                      </StatusBadge>
                    )}
                  </div>
                  <Etat moment="À l'entrée" etat={element.etat} commentaire={element.commentaire} />
                  <Etat moment="À la sortie" etat={aLaSortie?.etat} commentaire={aLaSortie?.commentaire} ecart={ecart} />
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <p className="rounded-card bg-surface p-5 text-body-m text-encre">
        Cette comparaison sert de base à la restitution de la caution. Les dégradations constatées peuvent faire l'objet de retenues, selon les conditions du bail.
      </p>
    </div>
  );
}
