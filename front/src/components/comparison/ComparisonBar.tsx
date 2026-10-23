import { GitCompareArrows, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PropertyIllustration } from "@/components/brand/PropertyIllustration";
import { illustrationForType } from "@/components/brand/illustrationKind";
import { Button } from "@/components/ui/button";
import { useComparison } from "@/context/ComparisonContext";

const MAX_COMPARAISON = 3;
const MIN_COMPARAISON = 2;

// Barre de comparaison : aplat encre, au-dessus des onglets mobiles.
export default function ComparisonBar() {
  const { items, remove, clear } = useComparison();
  const navigate = useNavigate();

  if (items.length === 0) return null;

  const comparer = () => navigate(`/comparaison?ids=${items.map((b) => b.id).join(",")}`);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(72px+env(safe-area-inset-bottom))] z-40 flex justify-center px-4 lg:bottom-6">
      <div className="pointer-events-auto flex w-full max-w-2xl items-center gap-3 rounded-card bg-encre px-4 py-3 text-white shadow-float">
        <ul className="flex shrink-0 items-center gap-2">
          {items.map((bien) => (
            <li key={bien.id} className="relative">
              <div className="size-11 overflow-hidden rounded-control bg-surface">
                {bien.photos?.[0] ? (
                  <img src={bien.photos[0]} alt="" className="h-full w-full object-cover" />
                ) : (
                  <PropertyIllustration kind={illustrationForType(bien.typeLogement?.slug)} />
                )}
              </div>
              <button
                type="button"
                onClick={() => remove(bien.id)}
                aria-label={`Retirer ${bien.titre ?? "ce bien"} de la comparaison`}
                className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-white text-encre"
              >
                <X aria-hidden className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
        <p className="hidden min-w-0 flex-1 text-body-m sm:block">
          <span className="font-semibold">
            {items.length}/{MAX_COMPARAISON} biens
          </span>
          <span className="block text-caption text-white/75">
            {items.length < MIN_COMPARAISON ? "Ajoutez au moins 2 biens" : "Prêt à comparer"}
          </span>
        </p>
        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={clear} className="hidden text-white hover:bg-white/10 sm:inline-flex">
            Tout effacer
          </Button>
          <Button size="sm" variant="inverse" onClick={comparer} disabled={items.length < MIN_COMPARAISON}>
            <GitCompareArrows aria-hidden />
            Comparer ({items.length})
          </Button>
        </div>
      </div>
    </div>
  );
}
