import { useEffect, useMemo, useState } from "react";
import { useRecherchePublique } from "@/hooks/useRecherche";
import { toApiParams, type FlagKey } from "@/hooks/useRechercheFilters";

// Brouillon du tiroir « Tous les filtres » : on modifie librement, la liste ne change
// qu'au clic sur « Voir N annonces ». Le compteur interroge l'API sur le brouillon.

const COUNT_ONLY = 1;
const DEBOUNCE_MS = 300;

export function useFiltersDraft(current: URLSearchParams, open: boolean) {
  const [draft, setDraft] = useState(() => new URLSearchParams(current));
  const [debounced, setDebounced] = useState(draft);

  // À chaque ouverture, le brouillon repart des filtres réellement appliqués.
  useEffect(() => {
    if (open) setDraft(new URLSearchParams(current));
  }, [open, current]);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(draft), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [draft]);

  const countParams = useMemo(() => ({ ...toApiParams(debounced, COUNT_ONLY), page: 1 }), [debounced]);
  const { data, isFetching } = useRecherchePublique(countParams, { enabled: open });

  const edit = (changes: Record<string, string | null>) =>
    setDraft((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(changes).forEach(([key, value]) => {
        if (value === null || value === "") next.delete(key);
        else next.set(key, value);
      });
      return next;
    });

  const get = (key: string) => draft.get(key) ?? "";
  const isOn = (key: FlagKey) => draft.get(key) === "1";
  const equipementIds = get("equipementIds").split(",").filter(Boolean);

  return {
    draft,
    get,
    edit,
    isOn,
    toggleFlag: (key: FlagKey) => edit({ [key]: isOn(key) ? null : "1" }),
    toggleValue: (key: string, value: string) => edit({ [key]: get(key) === value ? null : value }),
    equipementIds,
    toggleEquipement: (id: string) => {
      const next = equipementIds.includes(id) ? equipementIds.filter((e) => e !== id) : [...equipementIds, id];
      edit({ equipementIds: next.join(",") || null });
    },
    reset: () => setDraft(new URLSearchParams()),
    total: data?.total,
    isCounting: isFetching,
  };
}
