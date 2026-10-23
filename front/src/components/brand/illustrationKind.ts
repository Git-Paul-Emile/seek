// Choix de l'illustration selon le type de logement (voir PropertyIllustration).

export type IllustrationKind = "appartement" | "villa" | "studio" | "bureau" | "terrain";

/** Fond de la vignette : vert clair ou jaune clair, comme sur les maquettes. */
export const ILLUSTRATION_TINT: Record<IllustrationKind, "vert" | "soleil"> = {
  appartement: "vert",
  villa: "soleil",
  studio: "vert",
  bureau: "soleil",
  terrain: "vert",
};

const SLUG_TO_KIND: [RegExp, IllustrationKind][] = [
  [/villa|maison|duplex/, "villa"],
  [/studio|chambre/, "studio"],
  [/bureau|commerce|local|immeuble|entrepot/, "bureau"],
  [/terrain|parcelle/, "terrain"],
];

/** Associe un type de logement (slug ou nom) à l'illustration la plus proche. */
export const illustrationForType = (typeLogement: string | null | undefined): IllustrationKind => {
  const key = (typeLogement ?? "").toLowerCase();
  return SLUG_TO_KIND.find(([pattern]) => pattern.test(key))?.[1] ?? "appartement";
};
