import { Link } from "react-router-dom";
import { PropertyIllustration } from "@/components/brand/PropertyIllustration";
import { ILLUSTRATION_TINT, illustrationForType } from "@/components/brand/illustrationKind";
import { useTypeLogements } from "@/hooks/useTypeLogements";
import { formatMontant } from "@/lib/fcfa";
import { cn } from "@/lib/utils";

// « Que cherchez-vous ? » : catégories illustrées avec le nombre réel d'annonces publiées.

const SKELETON_COUNT = 5;

const libelleAnnonces = (count: number) => `${formatMontant(count)} annonce${count > 1 ? "s" : ""}`;

const CategoriesSection = () => {
  const { data: types = [], isLoading, isError } = useTypeLogements();

  if (isError || (!isLoading && types.length === 0)) return null;

  return (
    <section className="py-12 lg:py-20" aria-labelledby="categories-titre">
      <div className="container">
        <h2 id="categories-titre" className="text-h2 font-bold text-encre lg:text-[40px] lg:leading-[44px]">
          Que cherchez-vous ?
        </h2>
        <ul className="hide-scrollbar -mx-4 mt-6 flex snap-x gap-4 overflow-x-auto px-4 pb-1 lg:mx-0 lg:mt-8 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0">
          {isLoading
            ? Array.from({ length: SKELETON_COUNT }, (_, index) => (
                <li key={index} aria-hidden className="w-[160px] shrink-0 animate-pulse lg:w-auto">
                  <div className="aspect-[4/3] rounded-card bg-surface" />
                </li>
              ))
            : types.map((type) => {
                const kind = illustrationForType(type.slug);
                return (
                  <li key={type.id} className="w-[160px] shrink-0 snap-start lg:w-auto">
                    <Link
                      to={`/annonces?typeLogement=${encodeURIComponent(type.slug)}`}
                      className="group block overflow-hidden rounded-card border border-filet bg-white transition-shadow duration-hover hover:shadow-card"
                    >
                      <div
                        className={cn(
                          "aspect-[4/3]",
                          ILLUSTRATION_TINT[kind] === "soleil" ? "bg-soleil-100" : "bg-surface",
                        )}
                      >
                        <PropertyIllustration kind={kind} />
                      </div>
                      <div className="px-4 py-3 lg:flex lg:items-baseline lg:justify-between lg:gap-2">
                        <p className="truncate text-title font-bold text-encre lg:text-h3">{type.nom}</p>
                        {typeof type.count === "number" && (
                          <p className="text-body-m text-texte2 lg:text-body-m">
                            <span className="lg:hidden">{libelleAnnonces(type.count)}</span>
                            <span className="hidden lg:inline">
                              {formatMontant(type.count)}
                              <span className="sr-only"> annonces</span>
                            </span>
                          </p>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
        </ul>
      </div>
    </section>
  );
};

export default CategoriesSection;
