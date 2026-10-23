import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/Switch";
import { useEquipements } from "@/hooks/useEquipements";
import { useMeubles } from "@/hooks/useMeubles";
import { useEquipementsForTypeLogement } from "@/hooks/useTypeLogementEquipement";
import { useMeublesForTypeLogement } from "@/hooks/useTypeLogementMeuble";
import { IntituleGroupe, PuceCase } from "./ChampsAnnonce";
import type { AnnonceForm } from "./useAnnonceForm";

// Étapes 4 et 5 : équipements et meubles autorisés pour le type de bien, groupés par catégorie.

interface Element {
  id: string;
  nom: string;
  categorie?: { nom: string } | null;
}

interface ListeACocherProps {
  elements: Element[];
  autorises: Set<string>;
  coches: string[];
  onChange: (ids: string[]) => void;
  chargement: boolean;
  nomElement: string;
}

function ListeACocher({ elements, autorises, coches, onChange, chargement, nomElement }: ListeACocherProps) {
  const [recherche, setRecherche] = useState("");
  const groupes = useMemo(() => {
    const terme = recherche.trim().toLowerCase();
    const visibles = elements.filter(
      (e) => autorises.has(e.id) && (!terme || `${e.nom} ${e.categorie?.nom ?? ""}`.toLowerCase().includes(terme)),
    );
    const parCategorie = new Map<string, Element[]>();
    for (const e of visibles) {
      const categorie = e.categorie?.nom ?? "Autres";
      parCategorie.set(categorie, [...(parCategorie.get(categorie) ?? []), e]);
    }
    return [...parCategorie];
  }, [elements, autorises, recherche]);

  if (chargement) return <p className="text-body-l text-texte2">Chargement de la liste…</p>;
  if (!elements.some((e) => autorises.has(e.id))) {
    return <p className="text-body-l text-texte2">Aucun {nomElement} proposé pour ce type de bien.</p>;
  }

  const basculer = (id: string) => onChange(coches.includes(id) ? coches.filter((x) => x !== id) : [...coches, id]);

  return (
    <div className="space-y-6">
      <div className="relative">
        <label htmlFor={`recherche-${nomElement}`} className="sr-only">Rechercher un {nomElement}</label>
        <Search aria-hidden className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-texte2" />
        <Input
          id={`recherche-${nomElement}`}
          type="search"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder={`Rechercher un ${nomElement}`}
          className="pl-12 focus-visible:pl-12"
        />
      </div>
      <p className="text-body-m text-texte2" aria-live="polite">
        {coches.length} sélectionné{coches.length > 1 ? "s" : ""}
      </p>
      {groupes.length === 0 ? (
        <p className="text-body-l text-texte2">Aucun résultat pour « {recherche.trim()} ».</p>
      ) : (
        groupes.map(([categorie, items]) => (
          <section key={categorie}>
            <IntituleGroupe>{categorie}</IntituleGroupe>
            <div className="flex flex-wrap gap-2">
              {items.map((e) => (
                <PuceCase key={e.id} coche={coches.includes(e.id)} onClick={() => basculer(e.id)}>
                  {e.nom}
                </PuceCase>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

const typeRequis = <p className="text-body-l text-texte2">Choisissez d'abord le type de bien à l'étape 1.</p>;

export function EtapeEquipements({ form }: { form: AnnonceForm }) {
  const { v, maj } = form;
  const equipements = useEquipements();
  const autorises = useEquipementsForTypeLogement(v.typeLogement?.id ?? "");
  const ids = useMemo(() => new Set((autorises.data ?? []).map((c) => c.equipementId)), [autorises.data]);
  if (!v.typeLogement) return typeRequis;
  return (
    <ListeACocher
      elements={equipements.data ?? []}
      autorises={ids}
      coches={v.equipementIds}
      onChange={(equipementIds) => maj({ equipementIds })}
      chargement={equipements.isLoading || autorises.isLoading}
      nomElement="équipement"
    />
  );
}

export function EtapeMeubles({ form }: { form: AnnonceForm }) {
  const { v, maj, champsSysteme } = form;
  const meubles = useMeubles();
  const autorises = useMeublesForTypeLogement(v.typeLogement?.id ?? "");
  const ids = useMemo(() => new Set((autorises.data ?? []).map((c) => c.meubleId)), [autorises.data]);
  if (!v.typeLogement) return typeRequis;
  if (!champsSysteme.has("meuble")) {
    return <p className="text-body-l text-texte2">Ce type de bien ne se loue pas meublé. Passez à l'étape suivante.</p>;
  }
  return (
    <div className="space-y-6">
      <Switch
        label="Le logement est meublé"
        checked={v.meuble}
        onChange={(meuble) => maj({ meuble })}
        className="flex w-full justify-between border-b border-filet"
      />
      {v.meuble ? (
        <ListeACocher
          elements={meubles.data ?? []}
          autorises={ids}
          coches={v.meubleIds}
          onChange={(meubleIds) => maj({ meubleIds })}
          chargement={meubles.isLoading || autorises.isLoading}
          nomElement="meuble"
        />
      ) : (
        <p className="text-body-l text-texte2">Logement non meublé : aucun meuble à lister.</p>
      )}
    </div>
  );
}
