import { useState } from "react";
import { useLocataireAuth } from "@/context/LocataireAuthContext";
import { useQuittancesLocataire } from "@/hooks/useQuittance";
import { useProprietaireLocataire } from "@/hooks/useProprietaireLocataire";
import { downloadAllQuittancesZip, generateQuittancePDF, openQuittancePDF, type QuittanceData } from "@/lib/generateQuittance";
import type { Echeance } from "@/api/bail";

// Quittances du locataire : une quittance existe pour chaque loyer payé et confirmé.
// Partagé par l'accueil (derniers paiements) et la page Paiements.

const STATUTS_BAIL_EN_COURS = ["ACTIF", "EN_PREAVIS"];

export function useQuittancesTelechargement() {
  const { locataire } = useLocataireAuth();
  const bailEnCours = locataire?.bails?.find((bail) => STATUTS_BAIL_EN_COURS.includes(bail.statut));
  const actif = Boolean(bailEnCours);
  const { data: quittances = [], isLoading } = useQuittancesLocataire(actif);
  const { data: proprietaireData } = useProprietaireLocataire(actif);
  const [isZipping, setIsZipping] = useState(false);

  const proprietaireNom = proprietaireData?.proprietaire
    ? `${proprietaireData.proprietaire.prenom} ${proprietaireData.proprietaire.nom}`
    : "Votre propriétaire";

  const construire = (echeance: Echeance): QuittanceData | null => {
    const quittance = quittances.find((q) => q.echeanceId === echeance.id);
    if (!quittance || !echeance.datePaiement) return null;
    return {
      numero: quittance.numero,
      dateGeneration: new Date(quittance.dateGeneration).toLocaleDateString("fr-FR"),
      dateEcheance: echeance.dateEcheance,
      datePaiement: echeance.datePaiement,
      modePaiement: echeance.modePaiement ?? undefined,
      reference: echeance.reference ?? undefined,
      note: echeance.note ?? undefined,
      montantLoyer: echeance.montant,
      statut: echeance.statut,
      bienTitre: proprietaireData?.bien?.titre ?? bailEnCours?.bien?.titre ?? undefined,
      bienAdresse: proprietaireData?.bien?.adresse ?? undefined,
      bienVille: proprietaireData?.bien?.ville ?? bailEnCours?.bien?.ville ?? undefined,
      bienPays: proprietaireData?.bien?.pays ?? undefined,
      proprietaireNom,
      proprietaireTelephone: proprietaireData?.proprietaire?.telephone,
      locataireNom: `${locataire?.prenom ?? ""} ${locataire?.nom ?? ""}`.trim(),
      locataireTelephone: locataire?.telephone ?? undefined,
    };
  };

  const disponible = (echeance: Echeance) => echeance.statut === "PAYE" && construire(echeance) !== null;

  const telecharger = (echeance: Echeance) => {
    const data = construire(echeance);
    if (data) generateQuittancePDF(data);
  };

  const ouvrir = (echeance: Echeance) => {
    const data = construire(echeance);
    if (data) openQuittancePDF(data);
  };

  const toutTelecharger = async (echeances: Echeance[]) => {
    const datas = echeances.filter(disponible).map(construire).filter((data): data is QuittanceData => data !== null);
    if (datas.length === 0) return;
    setIsZipping(true);
    try {
      await downloadAllQuittancesZip(datas, "mes-quittances.zip");
    } finally {
      setIsZipping(false);
    }
  };

  return {
    isLoading,
    isZipping,
    proprietaire: proprietaireData?.proprietaire ?? null,
    bien: proprietaireData?.bien ?? null,
    disponible,
    telecharger,
    ouvrir,
    toutTelecharger,
  };
}
