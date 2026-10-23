import { Loader2 } from "lucide-react";
import DynamicField from "./DynamicField";
import type { TypeLogementChampConfig } from "@/api/typeLogementChamp";

interface Props {
  champs: TypeLogementChampConfig[];
  values: Record<string, string>;
  errors: Record<string, string>;
  onChange: (champId: string, value: string) => void;
  loading?: boolean;
}

export default function DynamicForm({ champs, values, errors, onChange, loading }: Props) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-body-l text-texte2">
        <Loader2 aria-hidden className="size-4 animate-spin" />
        <span>Chargement des champs…</span>
      </div>
    );
  }

  if (champs.length === 0) {
    return (
      <p className="py-4 text-body-l text-texte2">
        Aucun champ spécifique pour ce type de bien.
      </p>
    );
  }

  // Group by categorie
  const grouped = champs.reduce<Record<string, { nom: string; ordre: number; items: TypeLogementChampConfig[] }>>(
    (acc, cfg) => {
      const catId = cfg.champ.categorie.id;
      if (!acc[catId]) {
        acc[catId] = { nom: cfg.champ.categorie.nom, ordre: cfg.champ.categorie.ordre, items: [] };
      }
      acc[catId].items.push(cfg);
      return acc;
    },
    {}
  );

  const sortedGroups = Object.entries(grouped).sort((a, b) => a[1].ordre - b[1].ordre);

  return (
    <div className="space-y-6">
      {sortedGroups.map(([catId, group]) => (
        <div key={catId}>
          <h4 className="mb-3 text-overline font-semibold uppercase text-texte2">
            {group.nom}
          </h4>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {group.items
              .sort((a, b) => a.ordre - b.ordre)
              .map((cfg) => (
                <DynamicField
                  key={cfg.champId}
                  champId={cfg.champId}
                  nom={cfg.champ.nom}
                  type={cfg.champ.type}
                  unite={cfg.champ.unite}
                  options={cfg.champ.options ?? []}
                  obligatoire={cfg.obligatoire}
                  value={values[cfg.champId] ?? ""}
                  onChange={onChange}
                  error={errors[cfg.champId]}
                />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
