import { useMemo } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useBiens } from "@/hooks/useBien";
import { useBiensAvecBailActif, useBiensEnRetard, useBiensSansEdl, useTableauDeBord } from "@/hooks/useBail";
import { useVerificationStatus } from "@/hooks/useVerification";
import { formatFcfa } from "@/lib/fcfa";
import { referenceBien } from "@/lib/referenceBien";
import { badgeLoyerDuMois, libelleOccupation } from "@/components/owner/bienStatut";
import type { LigneSuivi } from "./SuiviLoyers";

// Assemble les données réelles du tableau de bord (charte, planches 24, 33 et 40).
// Aucun chiffre n'est estimé : une donnée absente masque l'indicateur correspondant.

const NB_BIENS_APERCU = 5;
const POURCENT = 100;

export interface LigneBienApercu {
  id: string;
  titre: string;
  reference: string;
  photo: string | null;
  typeLogement: string | null;
  locataire: string | null;
  loyer: number | null;
  badge: ReturnType<typeof badgeLoyerDuMois>;
  occupation: string;
}

export interface TacheAFaire {
  cle: string;
  titre: string;
  detail: string;
  to: string;
  type: "etat-des-lieux" | "identite";
}

const majuscule = (texte: string) => texte.charAt(0).toUpperCase() + texte.slice(1);

const variationEnPourcent = (actuel: number, precedent: number | undefined): number | null =>
  precedent ? Math.round(((actuel - precedent) / precedent) * POURCENT) : null;

export function useTableauDeBordProprietaire() {
  const tableau = useTableauDeBord();
  const retards = useBiensEnRetard();
  const biens = useBiens();
  const bails = useBiensAvecBailActif();
  const sansEdl = useBiensSansEdl();
  const verification = useVerificationStatus();

  return useMemo(() => {
    const now = new Date();
    const data = tableau.data;
    const mensuels = data?.encaissementsMensuels ?? [];
    const moisPrecedent = mensuels[mensuels.length - 2];
    const retardParBien = new Map((retards.data ?? []).map((r) => [r.bien.id, r]));
    const bailParBien = new Map((bails.data ?? []).map((b) => [b.bienId, b]));

    const lignesSuivi: LigneSuivi[] = [
      ...(retards.data ?? []).map((r) => ({
        cle: `retard-${r.bailId}`,
        nom: `${r.locataire.prenom} ${r.locataire.nom}`,
        detail: `${r.bien.titre ?? r.bien.ville ?? "Bien loué"} · ${formatFcfa(r.totalRetard)}`,
        bienId: r.bien.id,
        bailId: r.bailId,
        echeanceId: r.echeancesEnRetard[0]?.id ?? "",
        joursRetard: r.joursRetardMax,
      })),
      ...(data?.confirmationsEnAttente ?? []).map((c) => ({
        cle: `confirmation-${c.echeanceId}`,
        nom: `${c.locataire.prenom} ${c.locataire.nom}`,
        detail: `${c.bienTitre ?? c.bienQuartier ?? "Bien loué"} · ${formatFcfa(c.montant)}`,
        bienId: c.bienId,
        bailId: c.bailId,
        echeanceId: c.echeanceId,
      })),
    ].filter((ligne) => ligne.echeanceId);

    const lignesBiens: LigneBienApercu[] = (biens.data ?? []).slice(0, NB_BIENS_APERCU).map((bien) => {
      const bail = bailParBien.get(bien.id);
      return {
        id: bien.id,
        titre: bien.titre || "Bien sans titre",
        reference: referenceBien(bien.id),
        photo: bien.photos?.[0] ?? null,
        typeLogement: bien.typeLogement?.slug ?? null,
        locataire: bail?.locataireNom ?? null,
        loyer: bail?.montantLoyer ?? bien.prix,
        badge: badgeLoyerDuMois(data?.statutsMoisCourant[bien.id], retardParBien.get(bien.id)?.joursRetardMax),
        occupation: libelleOccupation(bien),
      };
    });

    const taches: TacheAFaire[] = (sansEdl.data?.items ?? []).map((item) => ({
      cle: `edl-${item.id}`,
      titre: "État des lieux d'entrée",
      detail: `${item.bien.titre || item.bien.ville || "Bien loué"} · ${item.locataire.prenom} ${item.locataire.nom}`,
      to: `/owner/bails/${item.id}/etats-des-lieux/creer?type=ENTREE`,
      type: "etat-des-lieux",
    }));
    const statutVerification = verification.data?.statut;
    if (statutVerification && statutVerification !== "VERIFIED" && statutVerification !== "PENDING") {
      taches.push({
        cle: "identite",
        titre: "Vérifier votre identité",
        detail: "Pièce d'identité recto, verso et selfie",
        to: "/owner/verification",
        type: "identite",
      });
    }

    const attendu = data?.moisCourant.attendu ?? 0;
    return {
      isLoading: tableau.isLoading || biens.isLoading,
      isError: tableau.isError,
      dateDuJour: majuscule(format(now, "EEEE d MMMM yyyy", { locale: fr })),
      moisCourant: format(now, "MMMM", { locale: fr }),
      moisPrecedentLibelle: moisPrecedent ? format(new Date(`${moisPrecedent.mois}-01T00:00:00`), "MMMM", { locale: fr }) : null,
      encaisse: data?.moisCourant.encaisse ?? 0,
      attendu,
      payeSurAttendu: data?.moisCourant.payeSurAttendu ?? 0,
      tauxRecouvrement: attendu > 0 ? Math.round(((data?.moisCourant.payeSurAttendu ?? 0) / attendu) * POURCENT) : null,
      variation: variationEnPourcent(data?.moisCourant.encaisse ?? 0, moisPrecedent?.montant),
      encaissementsMensuels: mensuels,
      repartitionBiens: data?.biens ?? { total: biens.data?.length ?? 0, occupes: 0, libres: 0, travaux: 0 },
      retards: {
        nombre: retards.data?.length ?? 0,
        total: (retards.data ?? []).reduce((somme, r) => somme + r.totalRetard, 0),
      },
      lignesSuivi,
      lignesBiens,
      taches,
    };
  }, [tableau.data, tableau.isLoading, tableau.isError, retards.data, biens.data, biens.isLoading, bails.data, sansEdl.data, verification.data]);
}
