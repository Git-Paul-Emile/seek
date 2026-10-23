import { describe, expect, it } from "vitest";
import { toApiParams } from "@/hooks/useRechercheFilters";

const url = (query: string) => new URLSearchParams(query);

describe("traduction de l'URL de recherche en paramètres d'API", () => {
  it("transmet les filtres de l'URL et met les annonces Premium en tête", () => {
    const params = toApiParams(url("typeTransaction=location&ville=Dakar&prixMax=400000&meuble=1"));
    expect(params).toMatchObject({
      typeTransaction: "location",
      ville: "Dakar",
      prixMax: 400_000,
      meuble: "1",
      featuredFirst: "1",
      page: 1,
    });
  });

  it("trie par défaut des plus récentes aux plus anciennes", () => {
    expect(toApiParams(url(""))).toMatchObject({ sortBy: "createdAt", sortOrder: "desc" });
  });

  it("applique le tri par prix demandé", () => {
    expect(toApiParams(url("sort=prix_asc"))).toMatchObject({ sortBy: "prix", sortOrder: "asc" });
  });

  it("en recherche par zone, laisse l'API trier par distance avec un rayon de 5 km par défaut", () => {
    const params = toApiParams(url("lat=14.7&lng=-17.45&sort=prix_asc"));
    expect(params.sortBy).toBeUndefined();
    expect(params.radius).toBe(5);
  });

  it("ignore un drapeau qui ne vaut pas 1", () => {
    expect(toApiParams(url("parking=0")).parking).toBeUndefined();
  });

  it("revient à la première page quand la page est invalide", () => {
    expect(toApiParams(url("page=abc")).page).toBe(1);
  });
});
