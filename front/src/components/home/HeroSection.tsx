import { Check } from "lucide-react";
import { DakarSkyline } from "@/components/brand/DakarSkyline";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { HomeSearchForm } from "@/components/home/HomeSearchForm";
import { useHomeSearch, type TransactionChoice } from "@/hooks/useHomeSearch";

// Hero de la charte : l'arche (Dakar vue à travers la porte), Louer ou Acheter,
// trois champs, et les engagements vérifiables de Seek.

const TRANSACTIONS: { value: TransactionChoice; label: string }[] = [
  { value: "location", label: "Louer" },
  { value: "vente", label: "Acheter" },
];

// Engagements tenus par le produit : modération des annonces, prix obligatoire, contact direct.
const ENGAGEMENTS = ["Annonces vérifiées par l'équipe", "Prix toujours affichés", "Contact direct avec le propriétaire"];

const VILLES_AFFICHEES = 4;

const listeVilles = (villes: string[]) => {
  const liste = villes.slice(0, VILLES_AFFICHEES);
  if (liste.length <= 1) return liste.join("");
  return `${liste.slice(0, -1).join(", ")} et ${liste[liste.length - 1]}`;
};

const HeroSection = () => {
  const search = useHomeSearch();
  const villes = listeVilles(search.villesCouvertes);

  return (
    <section className="bg-baobab pb-10 text-white lg:pb-16" aria-labelledby="hero-titre">
      <div className="container lg:grid lg:grid-cols-[1.7fr_1fr] lg:items-center lg:gap-12 lg:pt-10">
        <div className="lg:hidden">
          <DakarSkyline variant="panorama" className="rounded-b-card" />
        </div>

        <div className="pt-6 lg:pt-0">
          <SegmentedControl
            label="Type de recherche"
            tone="sur-baobab"
            options={TRANSACTIONS}
            value={search.transaction}
            onChange={search.changeTransaction}
          />
          <h1
            id="hero-titre"
            className="mt-6 text-display-m font-bold text-white lg:text-display-xl"
          >
            Trouvez votre chez‑vous au Sénégal.
          </h1>
          <p className="mt-4 max-w-xl text-body-l text-white/90 lg:text-[20px] lg:leading-[30px]">
            {villes ? `Location et vente à ${villes}.` : "Location et vente au Sénégal."} Des annonces vérifiées,
            des prix affichés, des propriétaires joignables.
          </p>

          <div className="mt-6 lg:mt-8">
            <HomeSearchForm search={search} />
          </div>

          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-3">
            {ENGAGEMENTS.map((engagement) => (
              <li key={engagement} className="inline-flex items-center gap-2 text-body-l text-white">
                <Check aria-hidden className="size-5" />
                {engagement}
              </li>
            ))}
          </ul>
        </div>

        <div className="hidden lg:block">
          <DakarSkyline variant="portrait" className="ml-auto max-w-[420px]" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
