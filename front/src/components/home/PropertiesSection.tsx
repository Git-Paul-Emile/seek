import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { ListingCard, ListingCardSkeleton } from "@/components/annonces/ListingCard";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/Chip";
import { useRecherchePublique } from "@/hooks/useRecherche";

// « Annonces à la une » : les annonces Premium d'abord, puis les plus récentes.
// Quatre cartes par rangée sur desktop, défilement horizontal sur mobile.

type Filtre = "toutes" | "location" | "vente";

const FILTRES: { value: Filtre; label: string }[] = [
  { value: "toutes", label: "Toutes" },
  { value: "location", label: "Location" },
  { value: "vente", label: "Vente" },
];

const NOMBRE_ANNONCES = 4;

const PropertiesSection = () => {
  const [filtre, setFiltre] = useState<Filtre>("toutes");
  const { data, isLoading, isError } = useRecherchePublique({
    featuredFirst: "1",
    limit: NOMBRE_ANNONCES,
    page: 1,
    ...(filtre !== "toutes" ? { typeTransaction: filtre } : {}),
  });
  const annonces = data?.items ?? [];
  const voirToutHref = filtre === "toutes" ? "/annonces" : `/annonces?typeTransaction=${filtre}`;

  return (
    <section className="pb-12 lg:pb-20" aria-labelledby="une-titre">
      <div className="container">
        <div className="grid grid-cols-[1fr_auto] items-center gap-4 lg:flex lg:justify-between">
          <h2 id="une-titre" className="text-h2 font-bold text-encre lg:text-[40px] lg:leading-[44px]">
            <span className="lg:hidden">À la une</span>
            <span className="hidden lg:inline">Annonces à la une</span>
          </h2>
          <Link to={voirToutHref} className="text-body-l font-semibold text-baobab hover:underline lg:hidden">
            Voir tout
          </Link>
          <div className="col-span-2 flex gap-2 lg:col-span-1" role="group" aria-label="Filtrer les annonces à la une">
            {FILTRES.map((option) => (
              <Chip key={option.value} selected={filtre === option.value} onClick={() => setFiltre(option.value)}>
                {option.label}
              </Chip>
            ))}
          </div>
        </div>

        {isError ? (
          <p className="mt-6 rounded-card bg-surface p-6 text-body-l text-texte2">
            Les annonces n'ont pas pu être chargées. Vérifiez votre connexion, puis rechargez la page.
          </p>
        ) : !isLoading && annonces.length === 0 ? (
          <p className="mt-6 rounded-card bg-surface p-6 text-body-l text-texte2">
            Aucune annonce pour l'instant dans cette catégorie. Revenez bientôt ou créez une alerte SMS.
          </p>
        ) : (
          <ul className="hide-scrollbar -mx-4 mt-6 flex snap-x gap-4 overflow-x-auto px-4 pb-2 lg:mx-0 lg:mt-8 lg:grid lg:grid-cols-4 lg:gap-6 lg:overflow-visible lg:px-0">
            {isLoading
              ? Array.from({ length: NOMBRE_ANNONCES }, (_, index) => (
                  <li key={index} className="w-[280px] shrink-0 lg:w-auto">
                    <ListingCardSkeleton />
                  </li>
                ))
              : annonces.map((annonce, index) => (
                  <li key={annonce.id} className="w-[280px] shrink-0 snap-start lg:w-auto">
                    <ListingCard annonce={annonce} comparable={annonce} priority={index === 0} />
                  </li>
                ))}
          </ul>
        )}

        <div className="mt-8 hidden justify-center lg:flex">
          <Button asChild variant="outline">
            <Link to={voirToutHref}>
              Voir toutes les annonces
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default PropertiesSection;
