import { describe, expect, it } from "vitest";
import { DESCRIPTION_MIN } from "@/components/owner/annonce/etapes";
import { contientCoordonnees, controlerAnnonce } from "./controlesAnnonce";

const descriptionComplete = "Appartement lumineux. ".repeat(Math.ceil(DESCRIPTION_MIN / 20));

describe("contrôles automatiques d'une annonce", () => {
  it("repère un numéro sénégalais écrit de plusieurs façons", () => {
    expect(contientCoordonnees("Appelez le 77 123 45 67")).toBe(true);
    expect(contientCoordonnees("contact +221771234567")).toBe(true);
    expect(contientCoordonnees("fixe 33.820.12.34")).toBe(true);
  });

  it("repère une adresse e-mail", () => {
    expect(contientCoordonnees("écrivez à moussa@exemple.sn")).toBe(true);
  });

  it("ne confond pas une surface ou un prix avec un numéro", () => {
    expect(contientCoordonnees("80 m², loyer 300 000 FCFA, 2 chambres")).toBe(false);
  });

  it("valide une annonce complète", () => {
    const controles = controlerAnnonce({
      photos: ["a", "b", "c"],
      description: descriptionComplete,
      prix: 300000,
      quartier: "Ouakam",
      ville: "Dakar",
    });
    expect(controles.every(({ ok }) => ok)).toBe(true);
  });

  it("signale les manques d'une annonce incomplète", () => {
    const controles = controlerAnnonce({ photos: ["a"], description: "Court. 77 123 45 67", prix: null, quartier: null, ville: "Dakar" });
    expect(controles.filter(({ ok }) => !ok)).toHaveLength(5);
  });
});
