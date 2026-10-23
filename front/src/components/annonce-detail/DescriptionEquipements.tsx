import { useState } from "react";
import { Car, Check, Droplet, ShieldCheck, Snowflake, Wifi, Zap, type LucideIcon } from "lucide-react";
import type { Bien } from "@/api/bien";
import { Button } from "@/components/ui/button";

// « Pour décider » (maquette « Fiche annonce ») : description repliable, équipements en deux
// colonnes, puis la liste complète des équipements et meubles à la demande.

const APERCU_EQUIPEMENTS = 6;

// Icône choisie d'après le nom saisi par l'admin ; coche par défaut.
const ICONES: [RegExp, LucideIcon][] = [
  [/clim/i, Snowflake],
  [/groupe|électrog|electrog|onduleur/i, Zap],
  [/gardien|sécurité|securite|vidéo|video/i, ShieldCheck],
  [/parking|garage/i, Car],
  [/eau|surpresseur|forage|citerne/i, Droplet],
  [/wifi|fibre|internet/i, Wifi],
];

const iconePour = (nom: string) => ICONES.find(([motif]) => motif.test(nom))?.[1] ?? Check;

export function DescriptionEquipements({ bien }: { bien: Bien }) {
  const [descriptionOuverte, setDescriptionOuverte] = useState(false);
  const [toutVoir, setToutVoir] = useState(false);

  const options = [
    bien.parking && "Parking",
    bien.ascenseur && "Ascenseur",
    bien.animaux && "Animaux acceptés",
    bien.fumeurs && "Fumeurs acceptés",
  ].filter((option): option is string => Boolean(option));
  const equipements = [...(bien.equipements ?? []).map((e) => e.equipement.nom), ...options];
  const meubles = (bien.meubles ?? []).map((m) => (m.quantite > 1 ? `${m.meuble.nom} × ${m.quantite}` : m.meuble.nom));
  const total = equipements.length + meubles.length;
  const visibles = toutVoir ? equipements : equipements.slice(0, APERCU_EQUIPEMENTS);
  const longue = (bien.description?.length ?? 0) > 280;

  return (
    <>
      {bien.description && (
        <section aria-labelledby="description-titre">
          <h2 id="description-titre" className="text-h2 font-bold text-encre">
            Description
          </h2>
          <p className={`mt-3 whitespace-pre-line text-body-l text-encre ${!descriptionOuverte && longue ? "line-clamp-5" : ""}`}>
            {bien.description}
          </p>
          {longue && (
            <Button variant="link" className="mt-2" onClick={() => setDescriptionOuverte((v) => !v)} aria-expanded={descriptionOuverte}>
              {descriptionOuverte ? "Réduire" : "Lire la suite"}
            </Button>
          )}
        </section>
      )}

      {total > 0 && (
        <section aria-labelledby="equipements-titre">
          <h2 id="equipements-titre" className="text-h2 font-bold text-encre">
            Équipements
          </h2>
          <ul className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            {visibles.map((nom) => {
              const Icon = iconePour(nom);
              return (
                <li key={nom} className="flex items-center gap-3 text-body-l text-encre">
                  <Icon aria-hidden className="size-6 shrink-0 text-encre" strokeWidth={1.5} />
                  {nom}
                </li>
              );
            })}
          </ul>
          {toutVoir && meubles.length > 0 && (
            <>
              <h3 className="mt-6 font-body text-h3 font-semibold text-encre">Meubles</h3>
              <ul className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                {meubles.map((nom) => (
                  <li key={nom} className="text-body-l text-encre">
                    {nom}
                  </li>
                ))}
              </ul>
            </>
          )}
          {(total > APERCU_EQUIPEMENTS || meubles.length > 0) && (
            <Button variant="outline" className="mt-6 w-full" onClick={() => setToutVoir((v) => !v)} aria-expanded={toutVoir}>
              {toutVoir ? "Afficher moins" : `Voir les ${total} équipements${meubles.length ? " et meubles" : ""}`}
            </Button>
          )}
        </section>
      )}
    </>
  );
}
