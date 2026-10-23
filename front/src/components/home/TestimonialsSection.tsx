import { useTemoignages } from "@/hooks/useTemoignages";
import { TemoignageDialog } from "@/components/home/TemoignageDialog";
import { cn } from "@/lib/utils";

// « Ils ont trouvé leur chez-eux » : uniquement des témoignages réels, validés par l'équipe.
// Aucune note ni étoile : la base ne stocke pas d'évaluation chiffrée.

const NOMBRE_AFFICHE = 3;
const CARTE_MISE_EN_AVANT = 1;

const initiales = (nom: string) =>
  nom
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

const TestimonialsSection = () => {
  const { data: temoignages = [], isLoading } = useTemoignages();
  const visibles = temoignages.slice(0, NOMBRE_AFFICHE);

  if (isLoading) return null;

  return (
    <section className="pb-12 lg:pb-20" aria-labelledby="temoignages-titre">
      <div className="container">
        <h2 id="temoignages-titre" className="text-h2 font-bold text-encre lg:text-[40px] lg:leading-[44px]">
          Ils ont trouvé leur chez-eux
        </h2>
        {visibles.length > 0 ? (
          <ul className="hide-scrollbar -mx-4 mt-6 flex snap-x gap-4 overflow-x-auto px-4 pb-2 lg:mx-0 lg:mt-8 lg:grid lg:grid-cols-3 lg:gap-8 lg:overflow-visible lg:px-0">
            {visibles.map((temoignage, index) => {
              const accent = index === CARTE_MISE_EN_AVANT;
              return (
                <li
                  key={temoignage.id}
                  className={cn(
                    "flex w-[85%] shrink-0 snap-center flex-col justify-between gap-6 rounded-card border p-6 lg:w-auto",
                    accent ? "border-baobab bg-baobab text-white" : "border-filet bg-white text-encre",
                  )}
                >
                  <blockquote className="text-body-l">« {temoignage.temoignage} »</blockquote>
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden
                      className={cn(
                        "flex size-12 shrink-0 items-center justify-center rounded-full text-body-m font-bold",
                        accent ? "bg-soleil text-encre" : "bg-baobab-100 text-baobab",
                      )}
                    >
                      {initiales(temoignage.nom)}
                    </span>
                    <div>
                      <p className="text-body-l font-semibold">{temoignage.nom}</p>
                      {temoignage.profession && (
                        <p className={cn("text-body-m", accent ? "text-white/85" : "text-texte2")}>
                          {temoignage.profession}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-4 text-body-l text-texte2">
            Vous avez trouvé un logement ou loué un bien avec Seek ? Soyez le premier à témoigner.
          </p>
        )}
        <div className="mt-4">
          <TemoignageDialog />
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
