import { describe, expect, it } from "vitest";
import { formatFcfa, formatFcfaCourt, formatSaisieMontant, libelleFrequence, parseMontant } from "@/lib/fcfa";

// Les espaces de groupement sont insécables : on les normalise pour lire les attentes.
const ESPACES_INSECABLES = new RegExp(`[${String.fromCharCode(0xa0)}${String.fromCharCode(0x202f)}]`, "g");
const lisible = (texte: string) => texte.replace(ESPACES_INSECABLES, " ");

describe("formats FCFA de la charte", () => {
  it("groupe les chiffres par trois et ajoute FCFA", () => {
    expect(lisible(formatFcfa(1_500_000))).toBe("1 500 000 FCFA");
  });

  it("n'utilise jamais d'espace sécable, pour que le prix ne se coupe pas en fin de ligne", () => {
    expect(formatFcfa(250_000)).not.toContain(" ");
  });

  it("arrondit les montants non entiers", () => {
    expect(lisible(formatFcfa(999.6))).toBe("1 000 FCFA");
  });

  it("abrège les millions sur les marqueurs de carte", () => {
    expect(lisible(formatFcfaCourt(1_200_000))).toBe("1,2 M F");
    expect(lisible(formatFcfaCourt(850_000))).toBe("850 000 F");
  });

  it("lit une saisie de montant avec espaces et lettres", () => {
    expect(parseMontant("400 000 FCFA")).toBe(400_000);
    expect(parseMontant("")).toBeNull();
    expect(lisible(formatSaisieMontant("1500000"))).toBe("1 500 000");
  });

  it("affiche la fréquence d'un loyer et rien pour une vente", () => {
    expect(libelleFrequence("mensuel")).toBe("mois");
    expect(libelleFrequence("MENSUEL")).toBe("mois");
    expect(libelleFrequence("unique")).toBeNull();
    expect(libelleFrequence(null)).toBeNull();
  });
});
