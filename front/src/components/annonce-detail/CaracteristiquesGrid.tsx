import { ArrowUpDown, Bath, BedDouble, CookingPot, Maximize, Sofa, Toilet, type LucideIcon } from "lucide-react";
import type { Bien } from "@/api/bien";
import { NO_BREAK_SPACE } from "@/lib/fcfa";

// Caractéristiques en tuiles (maquette « Fiche annonce ») : la valeur en gras, le libellé dessous.

interface Tuile {
  icon: LucideIcon;
  valeur: string;
  libelle: string;
}

const pluriel = (n: number, singulier: string, plurielForme: string) => (n > 1 ? plurielForme : singulier);

const etageTuile = (bien: Bien): Tuile | null => {
  if (bien.etage === null) return null;
  const etage = bien.etage === 0 ? "RDC" : `${bien.etage}e`;
  return {
    icon: ArrowUpDown,
    valeur: bien.nbEtages ? `${etage} sur ${bien.nbEtages}` : etage,
    libelle: bien.ascenseur ? "Étage, ascenseur" : "Étage",
  };
};

const tuiles = (bien: Bien): Tuile[] =>
  [
    bien.nbChambres ? { icon: BedDouble, valeur: String(bien.nbChambres), libelle: pluriel(bien.nbChambres, "Chambre", "Chambres") } : null,
    bien.nbSdb ? { icon: Bath, valeur: String(bien.nbSdb), libelle: pluriel(bien.nbSdb, "Salle de bain", "Salles de bain") } : null,
    bien.surface ? { icon: Maximize, valeur: `${bien.surface}${NO_BREAK_SPACE}m²`, libelle: "Surface habitable" } : null,
    etageTuile(bien),
    bien.nbSalons ? { icon: Sofa, valeur: String(bien.nbSalons), libelle: pluriel(bien.nbSalons, "Salon", "Salons") } : null,
    bien.nbCuisines ? { icon: CookingPot, valeur: String(bien.nbCuisines), libelle: pluriel(bien.nbCuisines, "Cuisine", "Cuisines") } : null,
    bien.nbWc ? { icon: Toilet, valeur: String(bien.nbWc), libelle: "Toilettes" } : null,
  ].filter((tuile): tuile is Tuile => tuile !== null);

export function CaracteristiquesGrid({ bien }: { bien: Bien }) {
  const liste = tuiles(bien);
  if (liste.length === 0) return null;
  return (
    <section aria-labelledby="caracteristiques-titre">
      <h2 id="caracteristiques-titre" className="sr-only">
        Caractéristiques
      </h2>
      <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {liste.map(({ icon: Icon, valeur, libelle }) => (
          <li key={libelle} className="flex items-center gap-4 rounded-card bg-surface p-4">
            <Icon aria-hidden className="size-7 shrink-0 text-baobab" strokeWidth={1.75} />
            <div className="min-w-0">
              <p className="text-h3 font-bold text-encre">{valeur}</p>
              <p className="text-body-m text-texte2">{libelle}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
