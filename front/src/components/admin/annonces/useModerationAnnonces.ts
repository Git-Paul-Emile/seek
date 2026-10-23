import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { AnnoncesAdminParams, Bien, StatutAnnonce } from "@/api/bien";
import type { StatusTone } from "@/components/ui/StatusBadge";
import { useAnnoncesAdmin, useAnnoncesStatusCounts, useValiderAnnonce } from "@/hooks/useAnnonces";
import { paginationServeur } from "@/hooks/usePagination";
import { useLieux } from "@/hooks/useRecherche";
import { useTypeLogements } from "@/hooks/useTypeLogements";

// File de modération des annonces : filtre par statut, recherche, ville et type,
// sélection multiple, décision guidée.

export type FiltreAnnonces = StatutAnnonce | "SIGNALEES" | "TOUS";

export const STATUT_ANNONCE: Record<StatutAnnonce, { label: string; tone: StatusTone }> = {
  EN_ATTENTE: { label: "En attente", tone: "attente" },
  PUBLIE: { label: "Publiée", tone: "positif" },
  REJETE: { label: "Rejetée", tone: "arret" },
  BROUILLON: { label: "Brouillon", tone: "neutre" },
  ANNULE: { label: "Annulée", tone: "neutre" },
};

export const TAILLE_PAGE = 15;
const DELAI_RECHERCHE_MS = 300;

const paramsStatut = (filtre: FiltreAnnonces): Pick<AnnoncesAdminParams, "statut" | "signalees"> => {
  if (filtre === "TOUS") return {};
  if (filtre === "SIGNALEES") return { signalees: true };
  return { statut: filtre };
};

export function useModerationAnnonces() {
  const [filtre, setFiltreBrut] = useState<FiltreAnnonces>("EN_ATTENTE");
  const [page, setPage] = useState(1);
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [ouverte, setOuverte] = useState<Bien | null>(null);
  const [validationGroupee, setValidationGroupee] = useState(false);
  const [recherche, setRechercheBrute] = useState("");
  const [rechercheEnvoyee, setRechercheEnvoyee] = useState("");
  const [ville, setVilleBrute] = useState("");
  const [typeLogementId, setTypeLogementIdBrut] = useState("");

  const revenirAuDebut = () => {
    setPage(1);
    setSelection(new Set());
  };

  // La requête part 300 ms après la dernière frappe, et la file repart de la page 1.
  useEffect(() => {
    const valeur = recherche.trim();
    if (valeur === rechercheEnvoyee) return;
    const minuteur = setTimeout(() => {
      setRechercheEnvoyee(valeur);
      setPage(1);
      setSelection(new Set());
    }, DELAI_RECHERCHE_MS);
    return () => clearTimeout(minuteur);
  }, [recherche, rechercheEnvoyee]);

  const params: AnnoncesAdminParams = {
    ...paramsStatut(filtre),
    page,
    limit: TAILLE_PAGE,
    search: rechercheEnvoyee || undefined,
    ville: ville || undefined,
    typeLogementId: typeLogementId || undefined,
  };
  const { data, isLoading } = useAnnoncesAdmin(params);
  const { data: compteurs } = useAnnoncesStatusCounts();
  const { data: lieux } = useLieux();
  const { data: typesLogement = [] } = useTypeLogements();
  const valider = useValiderAnnonce();

  const annonces = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const selectionnables = annonces.filter((annonce) => annonce.statutAnnonce === "EN_ATTENTE");

  const setFiltre = (valeur: FiltreAnnonces) => {
    setFiltreBrut(valeur);
    revenirAuDebut();
  };

  const setVille = (valeur: string) => {
    setVilleBrute(valeur);
    revenirAuDebut();
  };

  const setTypeLogementId = (valeur: string) => {
    setTypeLogementIdBrut(valeur);
    revenirAuDebut();
  };

  const filtresActifs = Boolean(rechercheEnvoyee || ville || typeLogementId);

  const basculer = (id: string, coche: boolean) =>
    setSelection((actuelle) => {
      const suivante = new Set(actuelle);
      if (coche) suivante.add(id);
      else suivante.delete(id);
      return suivante;
    });

  const toutBasculer = (coche: boolean) => setSelection(coche ? new Set(selectionnables.map(({ id }) => id)) : new Set());

  const decider = (annonce: Bien, action: "APPROUVER" | "REJETER", note: string) =>
    valider.mutate(
      { id: annonce.id, action, note: note.trim() || undefined },
      {
        onSuccess: () => {
          toast.success(action === "APPROUVER" ? "Annonce validée et publiée" : "Annonce rejetée, le propriétaire est prévenu");
          basculer(annonce.id, false);
          setOuverte(null);
        },
        onError: () => toast.error("La décision n'a pas pu être enregistrée. Réessayez."),
      },
    );

  // Le back valide une annonce par requête : la validation groupée envoie une requête par annonce.
  const validerSelection = async () => {
    const ids = [...selection];
    setValidationGroupee(true);
    const resultats = await Promise.allSettled(ids.map((id) => valider.mutateAsync({ id, action: "APPROUVER" })));
    setValidationGroupee(false);
    const echecs = resultats.filter(({ status }) => status === "rejected").length;
    setSelection(new Set());
    if (echecs === 0) toast.success(`${ids.length} annonce${ids.length > 1 ? "s" : ""} validée${ids.length > 1 ? "s" : ""}`);
    else toast.error(`${echecs} annonce${echecs > 1 ? "s" : ""} sur ${ids.length} n'ont pas pu être validées. Réessayez.`);
  };

  return {
    filtre,
    setFiltre,
    recherche,
    setRecherche: setRechercheBrute,
    ville,
    setVille,
    typeLogementId,
    setTypeLogementId,
    filtresActifs,
    villes: lieux?.villes ?? [],
    typesLogement,
    compteurs,
    annonces,
    total,
    isLoading,
    pagination: paginationServeur(page, totalPages, setPage),
    selection,
    selectionnables,
    basculer,
    toutBasculer,
    ouverte,
    setOuverte,
    decider,
    decisionEnCours: valider.isPending,
    validerSelection,
    validationGroupee,
  };
}
