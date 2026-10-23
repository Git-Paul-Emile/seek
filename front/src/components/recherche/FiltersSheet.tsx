import { useMemo, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Loader2, X } from "lucide-react";
import { BudgetSlider } from "@/components/recherche/BudgetSlider";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/Chip";
import { useEquipements } from "@/hooks/useEquipements";
import { useFiltersDraft } from "@/hooks/useFiltersDraft";
import type { FlagKey } from "@/hooks/useRechercheFilters";
import { useTypeLogements } from "@/hooks/useTypeLogements";
import { formatMontant } from "@/lib/fcfa";
import { cn } from "@/lib/utils";

// Tiroir « Tous les filtres » (planche « Alertes et fenêtres ») : tiroir du bas sur mobile,
// panneau latéral sur desktop, rayon 28 px, bouton « Voir N annonces ».

const CHAMBRES = ["1", "2", "3", "4", "5"];
const OPTIONS: { key: FlagKey; label: string }[] = [
  { key: "meuble", label: "Meublé" },
  { key: "parking", label: "Parking" },
  { key: "ascenseur", label: "Ascenseur" },
  { key: "animaux", label: "Animaux acceptés" },
  { key: "fumeurs", label: "Fumeurs acceptés" },
  { key: "misEnAvant", label: "Premium uniquement" },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="border-b border-filet pb-5 last:border-none">
      {/* Légende flottante : sans cela, le navigateur la pose sur la bordure et creuse un vide. */}
      <legend className="float-left mb-3 w-full pt-5 text-body-m font-semibold text-encre">{title}</legend>
      <div className="clear-left">{children}</div>
    </fieldset>
  );
}

interface FiltersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  current: URLSearchParams;
  onApply: (filters: URLSearchParams) => void;
}

export function FiltersSheet({ open, onOpenChange, current, onApply }: FiltersSheetProps) {
  const draft = useFiltersDraft(current, open);
  const { data: types = [] } = useTypeLogements();
  const { data: equipements = [] } = useEquipements();
  const transaction = draft.get("typeTransaction") === "vente" ? "vente" : "location";

  const equipementsParCategorie = useMemo(() => {
    const groupes = new Map<string, typeof equipements>();
    equipements
      .filter((e) => e.actif)
      .forEach((e) => groupes.set(e.categorie.nom, [...(groupes.get(e.categorie.nom) ?? []), e]));
    return [...groupes.entries()];
  }, [equipements]);

  const libelleVoir =
    draft.total === undefined ? "Voir les annonces" : `Voir ${formatMontant(draft.total)} annonce${draft.total > 1 ? "s" : ""}`;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-encre/50 data-[state=open]:animate-overlay-in" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-[61] flex max-h-[92dvh] flex-col rounded-t-sheet bg-white shadow-float focus:outline-none lg:inset-y-0 lg:left-auto lg:right-0 lg:max-h-none lg:w-[440px] lg:rounded-l-sheet lg:rounded-tr-none">
          <div aria-hidden className="mx-auto mt-3 h-1 w-10 rounded-full bg-filet lg:hidden" />
          <div className="grid grid-cols-[1fr_auto] items-center gap-2 px-6 pb-2 pt-4">
            <Dialog.Title className="text-h3 font-bold text-encre">Filtres</Dialog.Title>
            <div className="flex items-center gap-2">
              <Button variant="link" onClick={draft.reset}>
                Effacer
              </Button>
              <Dialog.Close asChild>
                <button type="button" aria-label="Fermer les filtres" className="flex size-12 items-center justify-center rounded-control hover:bg-surface">
                  <X aria-hidden className="size-5" />
                </button>
              </Dialog.Close>
            </div>
          </div>
          <Dialog.Description className="sr-only">Affinez les annonces affichées</Dialog.Description>

          <div className="flex-1 overflow-y-auto px-6">
            <Section title="Je veux">
              <div className="flex gap-2">
                {[
                  { value: "location", label: "Louer" },
                  { value: "vente", label: "Acheter" },
                ].map((option) => (
                  <Chip
                    key={option.value}
                    selected={draft.get("typeTransaction") === option.value}
                    onClick={() => draft.edit({ typeTransaction: draft.get("typeTransaction") === option.value ? null : option.value, prixMin: null, prixMax: null })}
                  >
                    {option.label}
                  </Chip>
                ))}
              </div>
            </Section>
            <Section title="Type de logement">
              <div className="flex flex-wrap gap-2">
                {types.map((type) => (
                  <Chip key={type.id} selected={draft.get("typeLogement") === type.slug} onClick={() => draft.toggleValue("typeLogement", type.slug)}>
                    {type.nom}
                  </Chip>
                ))}
              </div>
            </Section>
            <div className="border-b border-filet py-5">
              <BudgetSlider
                transaction={transaction}
                min={draft.get("prixMin")}
                max={draft.get("prixMax")}
                onChange={(min, max) => draft.edit({ prixMin: min, prixMax: max })}
              />
            </div>
            <Section title="Chambres minimum">
              <div className="flex rounded-full bg-surface p-1">
                {CHAMBRES.map((nombre, index) => {
                  const actif = draft.get("chambres") === nombre;
                  return (
                    <button
                      key={nombre}
                      type="button"
                      aria-pressed={actif}
                      onClick={() => draft.toggleValue("chambres", nombre)}
                      className={cn(
                        "h-10 flex-1 rounded-full text-body-m font-semibold transition-colors duration-tab",
                        actif ? "bg-white text-encre shadow-sm" : "text-texte2",
                      )}
                    >
                      {index === CHAMBRES.length - 1 ? `${nombre} +` : nombre}
                    </button>
                  );
                })}
              </div>
            </Section>
            <Section title="Options">
              <div className="flex flex-wrap gap-2">
                {OPTIONS.map((option) => (
                  <Chip key={option.key} selected={draft.isOn(option.key)} onClick={() => draft.toggleFlag(option.key)}>
                    {option.label}
                  </Chip>
                ))}
              </div>
            </Section>
            {equipementsParCategorie.map(([categorie, items]) => (
              <Section key={categorie} title={categorie}>
                <div className="flex flex-wrap gap-2">
                  {items.map((equipement) => (
                    <Chip
                      key={equipement.id}
                      selected={draft.equipementIds.includes(equipement.id)}
                      onClick={() => draft.toggleEquipement(equipement.id)}
                    >
                      {equipement.nom}
                    </Chip>
                  ))}
                </div>
              </Section>
            ))}
          </div>

          <div className="border-t border-filet p-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
            <Button
              size="lg"
              className="w-full"
              onClick={() => {
                onApply(draft.draft);
                onOpenChange(false);
              }}
            >
              {draft.isCounting && <Loader2 aria-hidden className="animate-spin" />}
              {libelleVoir}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
