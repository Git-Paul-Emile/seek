import type { TypeLogementChampConfig } from "@/api/typeLogementChamp";

// Champs obligatoires non renseignés, par identifiant de champ (formulaire d'annonce).
export function validateDynamicValues(
  champs: TypeLogementChampConfig[],
  values: Record<string, string>
): Record<string, string> {
  const errs: Record<string, string> = {};
  for (const cfg of champs) {
    if (!cfg.obligatoire) continue;
    const v = values[cfg.champId]?.trim() ?? "";
    if (!v || v === "false") {
      errs[cfg.champId] = `Renseignez le champ ${cfg.champ.nom}.`;
    }
  }
  return errs;
}
