import { Link } from "react-router-dom";
import { Eye, Pencil, RotateCcw, Send, Trash2, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import type { Bien } from "@/api/bien";
import { Button } from "@/components/ui/button";
import { useSoumettreBien } from "@/hooks/useBien";

// Actions d'une ligne de « Mes biens », selon le statut de l'annonce.
// Une seule action principale visible en toutes lettres, les autres en boutons icône.

interface BienActionsProps {
  bien: Bien;
  onSupprimer: (id: string) => void;
  onRetirer: (id: string) => void;
  /** Tableau desktop : l'action principale devient un bouton icône plein pour tenir sur une ligne. */
  compact?: boolean;
}

const boutonIcone =
  "flex size-10 shrink-0 items-center justify-center rounded-control border border-bord-champ bg-white text-encre transition-colors duration-hover hover:bg-surface";

function LienIcone({ to, label, icon: Icon }: { to: string; label: string; icon: LucideIcon }) {
  return (
    <Link to={to} aria-label={label} title={label} className={boutonIcone}>
      <Icon aria-hidden className="size-4" />
    </Link>
  );
}

function BoutonIcone({ label, icon: Icon, onClick }: { label: string; icon: LucideIcon; onClick: () => void }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className={boutonIcone}>
      <Icon aria-hidden className="size-4" />
    </button>
  );
}

export function BienActions({ bien, onSupprimer, onRetirer, compact = false }: BienActionsProps) {
  const soumettre = useSoumettreBien();
  const lienEdition = `/owner/biens/ajouter?edit=${bien.id}`;
  const statut = bien.statutAnnonce;
  const supprimable = statut === "BROUILLON" || statut === "REJETE";
  const retirable = statut === "EN_ATTENTE" || statut === "PUBLIE";
  const modifiable = statut === "BROUILLON" || statut === "PUBLIE";

  return (
    <div className="flex items-center justify-end gap-2">
      {statut === "BROUILLON" && (
        <Button
          size={compact ? "icon-sm" : "sm"}
          aria-label={compact ? "Soumettre l'annonce" : undefined}
          title={compact ? "Soumettre l'annonce" : undefined}
          disabled={soumettre.isPending}
          onClick={() =>
            soumettre.mutate(bien.id, {
              onSuccess: () => toast.success("Annonce envoyée à la modération"),
              onError: () => toast.error("L'annonce n'a pas pu être envoyée. Vérifiez qu'elle est complète."),
            })
          }
        >
          <Send aria-hidden />
          {!compact && (soumettre.isPending ? "Envoi…" : "Soumettre")}
        </Button>
      )}
      {statut === "REJETE" && (
        <Button asChild size={compact ? "icon-sm" : "sm"} variant="soleil">
          <Link to={lienEdition} aria-label={compact ? "Corriger l'annonce" : undefined} title="Corriger l'annonce">
            <Pencil aria-hidden />
            {!compact && "Corriger"}
          </Link>
        </Button>
      )}
      <LienIcone to={`/owner/biens/${bien.id}`} label="Voir le bien" icon={Eye} />
      {modifiable && <LienIcone to={lienEdition} label="Modifier l'annonce" icon={Pencil} />}
      {retirable && (
        <BoutonIcone
          label={statut === "EN_ATTENTE" ? "Annuler la soumission" : "Dépublier"}
          icon={RotateCcw}
          onClick={() => onRetirer(bien.id)}
        />
      )}
      {supprimable && <BoutonIcone label="Supprimer l'annonce" icon={Trash2} onClick={() => onSupprimer(bien.id)} />}
    </div>
  );
}
