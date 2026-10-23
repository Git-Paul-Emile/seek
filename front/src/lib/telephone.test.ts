import { describe, expect, it } from "vitest";
import { formatNumeroSenegal, numeroInternational } from "@/lib/telephone";

describe("numéros sénégalais", () => {
  it("groupe la saisie comme la charte : 77 123 45 67", () => {
    expect(formatNumeroSenegal("771234567")).toBe("77 123 45 67");
  });

  it("retire l'indicatif quand il est collé ou saisi avec +", () => {
    expect(formatNumeroSenegal("+221771234567")).toBe("77 123 45 67");
    expect(formatNumeroSenegal("221 77 123 45 67")).toBe("77 123 45 67");
  });

  it("ignore les chiffres au-delà des neuf attendus", () => {
    expect(formatNumeroSenegal("7712345678999")).toBe("77 123 45 67");
  });

  it("produit le format international attendu par l'API", () => {
    expect(numeroInternational("77 123 45 67")).toBe("+221771234567");
  });

  it("refuse un numéro incomplet", () => {
    expect(numeroInternational("77 12")).toBeNull();
  });
});
