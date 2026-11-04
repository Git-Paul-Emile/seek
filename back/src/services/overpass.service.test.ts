import { afterEach, describe, expect, it, vi } from "vitest";
import { EtablissementsIndisponiblesError, rechercherEtablissementsProches } from "./overpass.service.js";

// Point de recherche : Dakar Plateau. Un millième de degré de latitude vaut environ 111 m.
const LAT = 14.6928;
const LON = -17.4467;

const reponse = (elements: unknown[]) => new Response(JSON.stringify({ elements }), { status: 200 });
const saturee = () => new Response("server is currently at capacity", { status: 502 });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("rechercherEtablissementsProches", () => {
  it("garde le plus proche de chaque catégorie, y compris les bâtiments (chemins)", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      reponse([
        { lat: LAT + 0.01, lon: LON, tags: { amenity: "pharmacy", name: "Pharmacie lointaine" } },
        { lat: LAT + 0.001, lon: LON, tags: { amenity: "pharmacy", name: "Pharmacie du Plateau" } },
        { center: { lat: LAT + 0.005, lon: LON }, tags: { amenity: "hospital", name: "Hôpital Principal" } },
      ]),
    );
    vi.stubGlobal("fetch", fetchMock);

    const etablissements = await rechercherEtablissementsProches(LAT, LON);

    expect(etablissements.map((e) => [e.type, e.nom])).toEqual([
      ["pharmacie", "Pharmacie du Plateau"],
      ["hopital", "Hôpital Principal"],
    ]);
    expect(etablissements[0]?.distance).toBeGreaterThan(100);
    expect(etablissements[0]?.distance).toBeLessThan(120);
  });

  it("passe au miroir suivant quand un miroir est saturé", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(saturee())
      .mockResolvedValue(reponse([{ lat: LAT, lon: LON + 0.002, tags: { amenity: "fire_station" } }]));
    vi.stubGlobal("fetch", fetchMock);

    const etablissements = await rechercherEtablissementsProches(LAT, LON);

    expect(etablissements).toHaveLength(1);
    expect(etablissements[0]).toMatchObject({ type: "pompiers", nom: "Caserne des pompiers" });
    expect(fetchMock.mock.calls[0]?.[0]).not.toBe(fetchMock.mock.calls[1]?.[0]);
  });

  it("cherche plus loin uniquement les catégories manquantes", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(reponse([{ lat: LAT, lon: LON, tags: { amenity: "pharmacy" } }]))
      .mockResolvedValueOnce(reponse([{ lat: LAT + 0.1, lon: LON, tags: { amenity: "university", name: "UCAD" } }]));
    vi.stubGlobal("fetch", fetchMock);

    const etablissements = await rechercherEtablissementsProches(LAT, LON);

    const requeteElargie = decodeURIComponent(String(fetchMock.mock.calls[1]?.[1]?.body));
    expect(requeteElargie).toContain("around:15000");
    expect(requeteElargie).not.toContain('"pharmacy"');
    expect(etablissements.map((e) => e.type)).toEqual(["pharmacie", "universite"]);
  });

  it("signale l'indisponibilité quand aucun miroir ne répond", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(saturee()));

    await expect(rechercherEtablissementsProches(LAT, LON)).rejects.toBeInstanceOf(EtablissementsIndisponiblesError);
  });

  it("garde la première passe si la passe élargie échoue", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(reponse([{ lat: LAT, lon: LON, tags: { shop: "supermarket", name: "Auchan" } }]))
      .mockResolvedValue(saturee());
    vi.stubGlobal("fetch", fetchMock);

    const etablissements = await rechercherEtablissementsProches(LAT, LON);

    expect(etablissements.map((e) => e.nom)).toEqual(["Auchan"]);
  });
});
