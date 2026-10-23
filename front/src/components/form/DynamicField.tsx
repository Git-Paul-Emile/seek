import type { TypeChamp } from "@/api/champ";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/NativeSelect";
import { FormField } from "@/components/ui/FormField";
import { Chip } from "@/components/ui/Chip";

// Champ configuré par l'admin pour un type de logement, au gabarit des champs de la charte.

interface Props {
  champId: string;
  nom: string;
  type: TypeChamp;
  unite?: string | null;
  options?: string[];
  obligatoire: boolean;
  value: string;
  onChange: (champId: string, value: string) => void;
  error?: string;
}

const OUI_NON = [
  { libelle: "Oui", valeur: "true" },
  { libelle: "Non", valeur: "false" },
];

export default function DynamicField({ champId, nom, type, unite, options = [], obligatoire, value, onChange, error }: Props) {
  const label = unite ? `${nom} (${unite})` : nom;
  const hint = obligatoire ? undefined : "(facultatif)";
  const changer = (valeur: string) => onChange(champId, valeur);

  if (type === "BOOLEEN") {
    return (
      <fieldset>
        <legend className="mb-2 text-body-m font-semibold text-encre">
          {label}
          {hint && <span className="font-normal text-texte2"> {hint}</span>}
        </legend>
        <div className="flex gap-2">
          {OUI_NON.map((option) => (
            <Chip key={option.valeur} selected={value === option.valeur} onClick={() => changer(option.valeur)}>
              {option.libelle}
            </Chip>
          ))}
        </div>
        {error && <p role="alert" className="mt-2 text-body-m font-semibold text-encre">{error}</p>}
      </fieldset>
    );
  }

  return (
    <FormField label={label} hint={hint} error={error}>
      {type === "SELECT" ? (
        <NativeSelect value={value} onChange={(e) => changer(e.target.value)}>
          <option value="">Choisir</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </NativeSelect>
      ) : type === "DATE" ? (
        <Input type="date" value={value} onChange={(e) => changer(e.target.value)} />
      ) : type === "TEXTE" ? (
        <Input value={value} onChange={(e) => changer(e.target.value)} />
      ) : (
        <Input inputMode="decimal" value={value} onChange={(e) => changer(e.target.value.replace(/[^\d.,]/g, ""))} />
      )}
    </FormField>
  );
}
