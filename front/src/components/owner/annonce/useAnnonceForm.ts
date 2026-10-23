import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";
import type { Bien, SaveDraftPayload } from "@/api/bien";
import type { TypeLogement } from "@/api/typeLogement";
import type { TypeTransaction } from "@/api/typeTransaction";
import type { StatutBien } from "@/api/statutBien";
import type { Pays, Ville, Quartier } from "@/api/geo";
import { fetchChampsForTypeLogement } from "@/api/typeLogementChamp";
import { fetchEquipementsForTypeLogement } from "@/api/typeLogementEquipement";
import { fetchMeublesForTypeLogement } from "@/api/typeLogementMeuble";
import { useTypeLogements } from "@/hooks/useTypeLogements";
import { useTypeTransactions } from "@/hooks/useTypeTransactions";
import { useStatutsBien } from "@/hooks/useStatutsBien";
import { useBienById, useBrouillonBien, useCreateBien, useEnregistrerBrouillon } from "@/hooks/useBien";
import { useBailActif } from "@/hooks/useBail";
import { usePays, useVilles, useQuartiers } from "@/hooks/useGeo";
import { useChampsForTypeLogement } from "@/hooks/useTypeLogementChamp";
import { validateDynamicValues } from "@/components/form/validateDynamicValues";
import { DESCRIPTION_MAX, DESCRIPTION_MIN, ETAPES, ETAPES_VALIDEES, FREQUENCES, PHOTOS_MIN, type EtapeId } from "./etapes";

// État, validation, brouillon automatique et envoi du formulaire d'annonce.
// La logique métier est celle de l'ancien formulaire à onglets, réorganisée en 8 étapes.

export interface PhotoLocale {
  file: File;
  preview: string;
}

export interface AnnonceValeurs {
  typeLogement: TypeLogement | null;
  typeTransaction: TypeTransaction | null;
  statutBien: StatutBien | null;
  titre: string;
  description: string;
  pays: Pays | null;
  ville: Ville | null;
  quartier: Quartier | null;
  latitude: number | null;
  longitude: number | null;
  adresse: string;
  pointRepere: string;
  surface: string;
  etage: string;
  nbChambres: number;
  nbCuisines: number;
  nbSalons: number;
  nbSdb: number;
  nbWc: number;
  prix: string;
  caution: string;
  frequence: string;
  chargesIncluses: boolean;
  disponibleLe: string;
  meuble: boolean;
  fumeurs: boolean;
  animaux: boolean;
  parking: boolean;
  ascenseur: boolean;
  equipementIds: string[];
  meubleIds: string[];
  champsValeurs: Record<string, string>;
  photosExistantes: string[];
  nouvellesPhotos: PhotoLocale[];
  /** Index de la photo de couverture parmi les nouvelles photos (sans photo existante). */
  couverture: number;
  videoExistante: string | null;
  video: PhotoLocale | null;
}

const VALEURS_INITIALES: AnnonceValeurs = {
  typeLogement: null, typeTransaction: null, statutBien: null, titre: "", description: "",
  pays: null, ville: null, quartier: null, latitude: null, longitude: null, adresse: "", pointRepere: "",
  surface: "", etage: "", nbChambres: 0, nbCuisines: 0, nbSalons: 0, nbSdb: 0, nbWc: 0,
  prix: "", caution: "", frequence: "mensuel", chargesIncluses: false, disponibleLe: "",
  meuble: false, fumeurs: false, animaux: false, parking: false, ascenseur: false,
  equipementIds: [], meubleIds: [], champsValeurs: {},
  photosExistantes: [], nouvellesPhotos: [], couverture: 0, videoExistante: null, video: null,
};

// Champs « système » qu'un type de logement peut ne pas autoriser (voir Champ.cleSysteme).
const CLES_NUMERIQUES = ["nbChambres", "nbCuisines", "nbSalons", "nbSdb", "nbWc"] as const;
const CLES_BOOLEENNES = ["meuble", "parking", "ascenseur", "fumeurs", "animaux"] as const;

const nombreOuNull = (valeur: string): number | null => {
  const texte = valeur.replace(/\s/g, "");
  if (!texte) return null;
  const nombre = Number(texte);
  return Number.isFinite(nombre) ? nombre : null;
};

/** Fréquence connue du schéma serveur, quelle que soit la casse enregistrée. */
const frequenceValide = (frequence: string | null): string => {
  const valeur = frequence?.toLowerCase() ?? "";
  return FREQUENCES.some((f) => f.value === valeur) ? valeur : VALEURS_INITIALES.frequence;
};

/** Valeurs du formulaire tirées d'un bien enregistré (hors listes de référence). */
const valeursDepuisBien = (bien: Bien): Partial<AnnonceValeurs> => ({
  titre: bien.titre ?? "",
  description: bien.description ?? "",
  latitude: bien.latitude,
  longitude: bien.longitude,
  adresse: bien.adresse ?? "",
  pointRepere: bien.pointRepere ?? "",
  surface: bien.surface ? String(bien.surface) : "",
  etage: bien.etage != null ? String(bien.etage) : "",
  nbChambres: bien.nbChambres ?? 0,
  nbCuisines: bien.nbCuisines ?? 0,
  nbSalons: bien.nbSalons ?? 0,
  nbSdb: bien.nbSdb ?? 0,
  nbWc: bien.nbWc ?? 0,
  prix: bien.prix ? String(bien.prix) : "",
  caution: bien.caution ? String(bien.caution) : "",
  frequence: frequenceValide(bien.frequencePaiement),
  disponibleLe: bien.disponibleLe?.split("T")[0] ?? "",
  chargesIncluses: bien.chargesIncluses,
  meuble: bien.meuble,
  fumeurs: bien.fumeurs,
  animaux: bien.animaux,
  parking: bien.parking,
  ascenseur: bien.ascenseur,
  equipementIds: bien.equipements?.map((e) => e.equipementId) ?? [],
  meubleIds: bien.meubles?.map((m) => m.meubleId) ?? [],
  champsValeurs: Object.fromEntries((bien.champsValeurs ?? []).map((cv) => [cv.champId, cv.valeur])),
  photosExistantes: bien.photos ?? [],
  videoExistante: bien.videoUrl,
});

export function useAnnonceForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");

  const { data: bienAModifier } = useBienById(editId ?? "");
  const { data: brouillon, isFetched: brouillonCharge } = useBrouillonBien(!editId);
  const source = editId ? bienAModifier : brouillon ?? undefined;

  const types = useTypeLogements();
  const transactions = useTypeTransactions();
  const statuts = useStatutsBien();
  const paysListe = usePays();
  const { mutateAsync: creerBien, isPending: envoiEnCours } = useCreateBien();
  const enregistrement = useEnregistrerBrouillon();
  const { data: bailActif } = useBailActif(editId ?? "");

  const [v, setV] = useState<AnnonceValeurs>(VALEURS_INITIALES);
  const maj = useCallback((partiel: Partial<AnnonceValeurs>) => setV((prec) => ({ ...prec, ...partiel })), []);
  const majChamp = <K extends keyof AnnonceValeurs>(cle: K, valeur: AnnonceValeurs[K]) =>
    setV((prec) => ({ ...prec, [cle]: valeur }));

  const villes = useVilles(v.pays?.id ?? null);
  const quartiers = useQuartiers(v.ville?.id ?? null);
  const champsType = useChampsForTypeLogement(v.typeLogement?.id ?? "");

  const [etape, setEtape] = useState<EtapeId>("type");
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [erreursChamps, setErreursChamps] = useState<Record<string, string>>({});
  const [brouillonId, setBrouillonId] = useState<string | null>(editId);
  const [brouillonEnregistreA, setBrouillonEnregistreA] = useState<Date | null>(null);
  const [brouillonEchec, setBrouillonEchec] = useState(false);
  const [actionEnCours, setActionEnCours] = useState<"brouillon" | "publication" | null>(null);

  // ── Champs autorisés par le type de logement ──
  const champsSysteme = useMemo(() => {
    const cles = new Set<string>();
    for (const cfg of champsType.data ?? []) if (cfg.champ.cleSysteme) cles.add(cfg.champ.cleSysteme);
    return cles;
  }, [champsType.data]);
  const surfaceObligatoire = (champsType.data ?? []).some((c) => c.champ.cleSysteme === "surface" && c.obligatoire);
  const champsPersonnalises = useMemo(() => (champsType.data ?? []).filter((c) => !c.champ.cleSysteme), [champsType.data]);

  // ── Reprise d'un bien existant ou du brouillon en cours ──
  const initialiseRef = useRef<string | null>(null);
  const villeInitialiseeRef = useRef(false);
  useEffect(() => {
    if (!source || initialiseRef.current === source.id) return;
    if (types.isLoading || transactions.isLoading || statuts.isLoading || paysListe.isLoading) return;
    initialiseRef.current = source.id;
    villeInitialiseeRef.current = false;
    setBrouillonId(source.id);
    maj({
      ...valeursDepuisBien(source),
      typeLogement: types.data?.find((t) => t.id === source.typeLogementId) ?? null,
      typeTransaction: transactions.data?.find((t) => t.id === source.typeTransactionId) ?? null,
      statutBien: statuts.data?.find((s) => s.id === source.statutBienId) ?? null,
      pays: paysListe.data?.find((p) => p.nom === source.pays) ?? null,
    });
  }, [source, maj, types.isLoading, transactions.isLoading, statuts.isLoading, paysListe.isLoading, types.data, transactions.data, statuts.data, paysListe.data]);

  useEffect(() => {
    if (!source?.region || villeInitialiseeRef.current || villes.isLoading || !villes.data?.length) return;
    const ville = villes.data.find((x) => x.nom === source.region);
    if (ville) {
      maj({ ville });
      villeInitialiseeRef.current = true;
    }
  }, [source, maj, villes.data, villes.isLoading]);

  useEffect(() => {
    if (!source?.quartier || quartiers.isLoading || !quartiers.data?.length || v.quartier) return;
    const quartier = quartiers.data.find((q) => q.nom === source.quartier);
    if (quartier) maj({ quartier, latitude: quartier.latitude, longitude: quartier.longitude });
  }, [source, maj, quartiers.data, quartiers.isLoading, v.quartier]);

  // ── Modification détectée (une annonce brouillon ou rejetée doit changer avant d'être renvoyée) ──
  const comparable = JSON.stringify({ ...v, nouvellesPhotos: v.nouvellesPhotos.map((p) => p.preview), video: v.video?.preview });
  const comparableInitialRef = useRef<string | null>(null);
  useEffect(() => {
    if (initialiseRef.current && comparableInitialRef.current === null && v.typeLogement) comparableInitialRef.current = comparable;
  }, [comparable, v.typeLogement]);
  const modifie = comparableInitialRef.current !== null && comparable !== comparableInitialRef.current;

  // ── Statut de l'annonce modifiée ──
  const statutAnnonce = editId ? bienAModifier?.statutAnnonce : undefined;
  const modificationPubliee = statutAnnonce === "PUBLIE";
  const verrouilleParBail = !!editId && bailActif?.statut === "ACTIF";
  // Le brouillon automatique ne touche jamais une annonce publiée, en attente ou rejetée.
  const brouillonAutorise = !verrouilleParBail && (!editId || statutAnnonce === "BROUILLON");
  const renvoiSansModification = !!editId && (statutAnnonce === "BROUILLON" || statutAnnonce === "REJETE") && !modifie;

  // ── Changement de type : confirmation si des données deviennent incompatibles ──
  const [typeEnAttente, setTypeEnAttente] = useState<{
    type: TypeLogement;
    systeme: Set<string>;
    personnalises: Set<string>;
    equipements: Set<string>;
    meubles: Set<string>;
  } | null>(null);
  const [verificationType, setVerificationType] = useState(false);

  const choisirType = async (type: TypeLogement) => {
    if (v.typeLogement?.id === type.id) return;
    if (!v.typeLogement) return maj({ typeLogement: type });
    setVerificationType(true);
    try {
      const [champs, equipements, meubles] = await Promise.all([
        fetchChampsForTypeLogement(type.id),
        fetchEquipementsForTypeLogement(type.id),
        fetchMeublesForTypeLogement(type.id),
      ]);
      const config = {
        type,
        systeme: new Set(champs.filter((c) => c.champ.cleSysteme).map((c) => c.champ.cleSysteme as string)),
        personnalises: new Set(champs.filter((c) => !c.champ.cleSysteme).map((c) => c.champId)),
        equipements: new Set(equipements.map((e) => e.equipementId)),
        meubles: new Set(meubles.map((m) => m.meubleId)),
      };
      const incompatible =
        (!!v.surface.trim() && !config.systeme.has("surface")) ||
        (!!v.etage.trim() && !config.systeme.has("etage")) ||
        CLES_NUMERIQUES.some((cle) => v[cle] > 0 && !config.systeme.has(cle)) ||
        CLES_BOOLEENNES.some((cle) => v[cle] && !config.systeme.has(cle)) ||
        Object.entries(v.champsValeurs).some(([id, val]) => val.trim() !== "" && !config.personnalises.has(id)) ||
        v.equipementIds.some((id) => !config.equipements.has(id)) ||
        v.meubleIds.some((id) => !config.meubles.has(id));
      if (incompatible) setTypeEnAttente(config);
      else maj({ typeLogement: type });
    } catch {
      toast.error("La compatibilité du nouveau type n'a pas pu être vérifiée. Réessayez.");
    } finally {
      setVerificationType(false);
    }
  };

  const confirmerChangementType = () => {
    if (!typeEnAttente) return;
    const { type, systeme, personnalises, equipements, meubles } = typeEnAttente;
    const remises: Partial<AnnonceValeurs> = {};
    if (!systeme.has("surface")) remises.surface = "";
    if (!systeme.has("etage")) remises.etage = "";
    for (const cle of CLES_NUMERIQUES) if (!systeme.has(cle)) remises[cle] = 0;
    for (const cle of CLES_BOOLEENNES) if (!systeme.has(cle)) remises[cle] = false;
    maj({
      ...remises,
      typeLogement: type,
      champsValeurs: Object.fromEntries(Object.entries(v.champsValeurs).filter(([id]) => personnalises.has(id))),
      equipementIds: v.equipementIds.filter((id) => equipements.has(id)),
      meubleIds: v.meubleIds.filter((id) => meubles.has(id)),
    });
    setTypeEnAttente(null);
  };

  // ── Validation ──
  const erreursEtape = (id: EtapeId): Record<string, string> => {
    const e: Record<string, string> = {};
    if (id === "type") {
      if (!v.typeLogement) e.type = "Choisissez le type de bien.";
      if (!v.typeTransaction) e.transaction = "Indiquez si le bien est à louer ou à vendre.";
    }
    if (id === "localisation") {
      if (!v.pays) e.pays = "Choisissez le pays.";
      if (!v.ville) e.region = "Choisissez la région.";
      if (!v.quartier) e.quartier = "Choisissez le quartier.";
    }
    if (id === "caracteristiques" && surfaceObligatoire && !nombreOuNull(v.surface)) {
      e.surface = "Indiquez la surface en m².";
    }
    if (id === "photos" && v.photosExistantes.length + v.nouvellesPhotos.length < PHOTOS_MIN) {
      e.photos = `Ajoutez au moins ${PHOTOS_MIN} photos pour publier l'annonce.`;
    }
    if (id === "prix") {
      if (!v.statutBien) e.statut = "Indiquez si le bien est libre, loué ou en travaux.";
      if (!nombreOuNull(v.prix)) e.prix = "Indiquez le prix en FCFA.";
    }
    if (id === "recapitulatif") {
      const description = v.description.trim();
      if (!v.titre.trim()) e.titre = "Donnez un titre à l'annonce.";
      if (description.length < DESCRIPTION_MIN) {
        e.description = `Ajoutez encore ${DESCRIPTION_MIN - description.length} caractères à la description (${DESCRIPTION_MIN} minimum).`;
      } else if (description.length > DESCRIPTION_MAX) {
        e.description = `Raccourcissez la description de ${description.length - DESCRIPTION_MAX} caractères (${DESCRIPTION_MAX} maximum).`;
      }
    }
    return e;
  };

  const validerEtape = (id: EtapeId): boolean => {
    const e = erreursEtape(id);
    if (id === "caracteristiques") {
      const dynamiques = validateDynamicValues(champsPersonnalises, v.champsValeurs);
      setErreursChamps(dynamiques);
      if (Object.keys(dynamiques).length > 0) {
        setErreurs(e);
        return false;
      }
    }
    setErreurs(e);
    return Object.keys(e).length === 0;
  };

  // ── Charge utile commune au brouillon et à l'envoi ──
  const chargeUtile = (): SaveDraftPayload => ({
    id: brouillonId ?? undefined,
    titre: v.titre.trim() || undefined,
    description: v.description.trim() || undefined,
    typeLogementId: v.typeLogement?.id,
    typeTransactionId: v.typeTransaction?.id,
    statutBienId: v.statutBien?.id,
    pays: v.pays?.nom,
    region: v.ville?.nom,
    quartier: v.quartier?.nom,
    adresse: v.adresse.trim() || undefined,
    pointRepere: v.pointRepere.trim() || undefined,
    latitude: v.quartier?.latitude ?? v.latitude,
    longitude: v.quartier?.longitude ?? v.longitude,
    surface: nombreOuNull(v.surface) ?? undefined,
    etage: nombreOuNull(v.etage) ?? undefined,
    nbChambres: v.nbChambres || undefined,
    nbSdb: v.nbSdb || undefined,
    nbSalons: v.nbSalons || undefined,
    nbCuisines: v.nbCuisines || undefined,
    nbWc: v.nbWc || undefined,
    meuble: v.meuble,
    fumeurs: v.fumeurs,
    animaux: v.animaux,
    parking: v.parking,
    ascenseur: v.ascenseur,
    prix: nombreOuNull(v.prix) ?? undefined,
    frequencePaiement: v.frequence,
    chargesIncluses: v.chargesIncluses,
    caution: nombreOuNull(v.caution) ?? undefined,
    disponibleLe: v.disponibleLe || undefined,
    equipementIds: v.equipementIds,
    meubles: v.meubleIds.map((meubleId) => ({ meubleId, quantite: 1 })),
    champsValeurs: Object.entries(v.champsValeurs)
      .filter(([, valeur]) => valeur.trim() !== "")
      .map(([champId, valeur]) => ({ champId, valeur })),
    existingPhotos: v.photosExistantes,
    existingVideoUrl: v.videoExistante,
  });

  // ── Brouillon automatique à chaque changement d'étape ──
  const enregistrerBrouillon = () => {
    if (!brouillonAutorise || enregistrement.isPending || !v.typeLogement) return;
    enregistrement.mutate(chargeUtile(), {
      onSuccess: (bien) => {
        setBrouillonId(bien.id);
        setBrouillonEnregistreA(new Date());
        setBrouillonEchec(false);
      },
      onError: () => setBrouillonEchec(true),
    });
  };

  const allerA = (cible: EtapeId) => {
    const indexCible = ETAPES.findIndex((e) => e.id === cible);
    const indexActuel = ETAPES.findIndex((e) => e.id === etape);
    if (indexCible > indexActuel && !validerEtape(etape)) return;
    enregistrerBrouillon();
    setErreurs({});
    setEtape(cible);
    window.scrollTo({ top: 0 });
  };

  const indexEtape = ETAPES.findIndex((e) => e.id === etape);
  const suivante = () => indexEtape < ETAPES.length - 1 && allerA(ETAPES[indexEtape + 1].id);
  const precedente = () => indexEtape > 0 && allerA(ETAPES[indexEtape - 1].id);

  // ── Envoi ──
  const coordonneesGeocodees = async (): Promise<[number, number] | null> => {
    const jeton = import.meta.env.VITE_MAPBOX_TOKEN;
    if (!v.adresse.trim() || !jeton) return null;
    const requete = [v.adresse.trim(), v.quartier?.nom, v.ville?.nom, v.pays?.nom].filter(Boolean).join(", ");
    try {
      const reponse = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(requete)}.json?access_token=${jeton}&limit=1`,
      );
      const data = await reponse.json();
      const centre = data.features?.[0]?.center;
      return centre ? [centre[1], centre[0]] : null;
    } catch {
      // Sans géocodage, on garde les coordonnées du quartier.
      return null;
    }
  };

  const envoyer = async (commeBrouillon: boolean) => {
    if (!commeBrouillon) {
      const invalide = ETAPES_VALIDEES.find((id) => !validerEtape(id));
      if (invalide) {
        setEtape(invalide);
        toast.error("Une information manque. Complétez l'étape affichée.");
        return;
      }
    }
    setActionEnCours(commeBrouillon ? "brouillon" : "publication");
    try {
      const payload = chargeUtile();
      const coordonnees = await coordonneesGeocodees();
      if (coordonnees) [payload.latitude, payload.longitude] = coordonnees;
      const photos = v.nouvellesPhotos.length
        ? [v.nouvellesPhotos[v.couverture], ...v.nouvellesPhotos.filter((_, i) => i !== v.couverture)].map((p) => p.file)
        : [];
      await creerBien({ payload: { ...payload, brouillon: commeBrouillon }, photos, video: v.video?.file ?? null });
      toast.success(commeBrouillon ? "Brouillon enregistré" : "Annonce envoyée à la modération");
      navigate("/owner/biens");
    } catch {
      toast.error("L'annonce n'a pas pu être enregistrée. Vérifiez votre connexion puis réessayez.");
    } finally {
      setActionEnCours(null);
    }
  };

  const libelleBrouillon = [v.typeLogement?.nom, v.quartier ? `à ${v.quartier.nom}` : null].filter(Boolean).join(" ");

  return {
    v,
    maj,
    majChamp,
    etape,
    indexEtape,
    allerA,
    suivante,
    precedente,
    erreurs,
    erreursChamps,
    setErreursChamps,
    listes: {
      types: types.data ?? [],
      transactions: transactions.data ?? [],
      statuts: statuts.data ?? [],
      pays: paysListe.data ?? [],
      villes: villes.data ?? [],
      quartiers: quartiers.data ?? [],
      chargement: types.isLoading || transactions.isLoading || statuts.isLoading,
      villesChargement: villes.isLoading,
      quartiersChargement: quartiers.isLoading,
    },
    champsSysteme,
    surfaceObligatoire,
    champsPersonnalises,
    champsChargement: champsType.isLoading,
    choisirType,
    verificationType,
    typeEnAttente,
    confirmerChangementType,
    annulerChangementType: () => setTypeEnAttente(null),
    envoyer,
    envoiEnCours: envoiEnCours || actionEnCours !== null,
    actionEnCours,
    editId,
    statutAnnonce,
    modificationPubliee,
    verrouilleParBail,
    renvoiSansModification,
    brouillonAutorise,
    brouillonRepris: !editId && brouillonCharge && !!brouillon,
    brouillonEnregistrement: enregistrement.isPending,
    brouillonEchec,
    brouillonHeure: brouillonEnregistreA ? format(brouillonEnregistreA, "HH:mm") : null,
    libelleBrouillon,
  };
}

export type AnnonceForm = ReturnType<typeof useAnnonceForm>;
