import { useState } from "react";
import { Link } from "react-router-dom";
import { Archive, Check, ChevronDown, Download, Eye, Loader2, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { useConfirmerPaiementEspeces } from "@/hooks/useBail";
import { useLocataireAuth } from "@/context/LocataireAuthContext";
import { useLocataireEcheancier } from "@/hooks/useLocataireEcheancier";
import type { Echeance, StatutPaiement } from "@/api/bail";
import LocatairePayModal from "@/components/locataire/LocatairePayModal";
import { useQuittancesTelechargement } from "@/components/locataire/useQuittancesTelechargement";
import { echeancesARegler, libelleMois, resteARegler, STATUT_PAIEMENT } from "@/components/locataire/paiementStatut";
import { SkDetailSections } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/Chip";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/brand/EmptyState";
import { formatFcfa } from "@/lib/fcfa";
import { formatDateLongue } from "@/lib/dates";

// Paiements du locataire : chaque loyer avec son statut, la déclaration d'un paiement
// et les quittances à télécharger (charte, planches 25 et 34).

type Filtre = "TOUT" | Exclude<StatutPaiement, "ANNULE">;

const FILTRES: { valeur: Filtre; label: string }[] = [
  { valeur: "TOUT", label: "Tout" },
  { valeur: "EN_RETARD", label: "En retard" },
  { valeur: "EN_ATTENTE", label: "En attente" },
  { valeur: "EN_ATTENTE_CONFIRMATION", label: "À confirmer" },
  { valeur: "A_VENIR", label: "À venir" },
  { valeur: "PAYE", label: "Payés" },
];

const ORDRE: Record<StatutPaiement, number> = {
  EN_ATTENTE_CONFIRMATION: 0,
  EN_RETARD: 1,
  EN_ATTENTE: 2,
  A_VENIR: 3,
  PAYE: 4,
  ANNULE: 5,
};

const OPERATEURS_MOBILE_MONEY = [
  { nom: "Orange Money", consigne: "Composez *144# puis suivez les instructions pour envoyer le montant." },
  { nom: "Wave", consigne: "Ouvrez l'application Wave et faites un envoi d'argent." },
];

function Resume({ label, valeur, detail }: { label: string; valeur: string; detail?: string }) {
  return (
    <div className="rounded-card bg-white p-5">
      <p className="text-overline font-semibold uppercase text-texte2">{label}</p>
      <p className="mt-2 font-display text-h3 font-bold text-encre">{valeur}</p>
      {detail && <p className="mt-1 text-body-m text-texte2">{detail}</p>}
    </div>
  );
}

function detailEcheance(echeance: Echeance) {
  if (echeance.statut === "EN_ATTENTE_CONFIRMATION") {
    return echeance.sourceEnregistrement === "PROPRIETAIRE"
      ? "Espèces enregistrées par votre propriétaire : confirmez la remise"
      : "Déclaré, en attente de confirmation par votre propriétaire";
  }
  if (echeance.datePaiement) {
    return [`Payé le ${formatDateLongue(echeance.datePaiement)}`, echeance.modePaiement].filter(Boolean).join(" · ");
  }
  return `Échéance le ${formatDateLongue(echeance.dateEcheance)}`;
}

export default function PaiementsLocatairePage() {
  const { locataire } = useLocataireAuth();
  const bail = locataire?.bails?.find((b) => b.statut === "ACTIF" || b.statut === "EN_PREAVIS");
  const { data: echeancierBrut = [], isLoading } = useLocataireEcheancier(Boolean(bail));
  const quittances = useQuittancesTelechargement();
  const confirmerEspeces = useConfirmerPaiementEspeces();

  const [filtre, setFiltre] = useState<Filtre>("TOUT");
  const [declarer, setDeclarer] = useState(false);

  if (isLoading) return <SkDetailSections sections={3} />;

  if (!bail) {
    return (
      <EmptyState
        titreNiveau="h1"
        titre="Aucun bail en cours"
        texte="Vos loyers et vos quittances apparaîtront ici dès que votre propriétaire aura associé un logement à votre compte."
        action={
          <Button asChild variant="outline">
            <Link to="/locataire/dashboard">Retour à l'accueil</Link>
          </Button>
        }
      />
    );
  }

  // Les échéances « à venir » des années suivantes sont pré-générées : seule l'année en cours est montrée.
  const anneeCourante = new Date().getFullYear();
  const echeancier = echeancierBrut.filter(
    (e) => e.statut !== "A_VENIR" || new Date(e.dateEcheance).getFullYear() === anneeCourante,
  );
  const compter = (statut: Filtre) =>
    statut === "TOUT" ? echeancier.length : echeancier.filter((e) => e.statut === statut).length;
  const solde = echeancier.filter(resteARegler).reduce((somme, e) => somme + e.montant, 0);
  const prochain = echeancesARegler(echeancier)[0];
  const nbPayes = compter("PAYE");
  const avecQuittance = echeancier.filter(quittances.disponible);
  const lignes = echeancier
    .filter((e) => filtre === "TOUT" || e.statut === filtre)
    .sort((a, b) => ORDRE[a.statut] - ORDRE[b.statut] || new Date(a.dateEcheance).getTime() - new Date(b.dateEcheance).getTime());
  const peutDeclarer = bail.statut === "ACTIF";

  const confirmer = (echeance: Echeance) =>
    confirmerEspeces.mutate(
      { echeanceId: echeance.id, bailId: bail.id },
      {
        onSuccess: () => toast.success("Remise en espèces confirmée"),
        onError: () => toast.error("La confirmation n'a pas pu être enregistrée. Réessayez."),
      },
    );

  return (
    <div className="space-y-6 lg:space-y-8">
      <header className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <h1 className="font-display text-h2 font-bold text-encre lg:text-h1">Paiements</h1>
          <p className="mt-1 text-body-l text-texte2">
            {bail.bien?.titre || "Mon logement"} · bail depuis le {formatDateLongue(bail.dateDebutBail)}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {avecQuittance.length > 0 && (
            <Button variant="outline" onClick={() => quittances.toutTelecharger(echeancier)} disabled={quittances.isZipping}>
              {quittances.isZipping ? <Loader2 aria-hidden className="animate-spin" /> : <Archive aria-hidden />}
              Toutes les quittances
            </Button>
          )}
          {prochain && peutDeclarer && (
            <Button onClick={() => setDeclarer(true)}>
              <Check aria-hidden />
              J'ai payé un loyer
            </Button>
          )}
        </div>
      </header>

      {echeancier.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Resume
            label="Prochain loyer"
            valeur={prochain ? formatFcfa(prochain.montant) : "À jour"}
            detail={prochain ? `Avant le ${formatDateLongue(prochain.dateEcheance)}` : "Aucun loyer à régler"}
          />
          <Resume label="Reste à régler" valeur={formatFcfa(solde)} detail={`${compter("EN_RETARD")} en retard`} />
          <Resume label="Loyers payés" valeur={`${nbPayes} sur ${echeancier.length}`} detail={`${avecQuittance.length} quittance${avecQuittance.length > 1 ? "s" : ""}`} />
        </div>
      )}

      <details className="group rounded-card bg-white">
        <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-5 text-body-l font-semibold text-encre">
          <Smartphone aria-hidden className="size-5 text-baobab" />
          <span className="flex-1">Payer par mobile money</span>
          <ChevronDown aria-hidden className="size-5 text-texte2 transition-transform group-open:rotate-180" />
        </summary>
        <ul className="grid gap-3 px-5 pb-5 sm:grid-cols-2">
          {OPERATEURS_MOBILE_MONEY.map(({ nom, consigne }) => (
            <li key={nom} className="rounded-control bg-surface p-4">
              <p className="text-body-m font-semibold text-encre">{nom}</p>
              <p className="mt-1 text-body-m text-texte2">{consigne}</p>
            </li>
          ))}
        </ul>
      </details>

      <section aria-labelledby="titre-loyers">
        <h2 id="titre-loyers" className="sr-only">
          Mes loyers
        </h2>
        <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0">
          {FILTRES.map(({ valeur, label }) => {
            const nombre = compter(valeur);
            return (
              <Chip key={valeur} selected={filtre === valeur} onClick={() => setFiltre(valeur)}>
                {nombre > 0 && valeur !== "TOUT" ? `${label} · ${nombre}` : label}
              </Chip>
            );
          })}
        </div>

        {lignes.length === 0 ? (
          <p className="rounded-card bg-white p-6 text-center text-body-m text-texte2">Aucun loyer pour ce filtre.</p>
        ) : (
          <ul className="divide-y divide-filet rounded-card bg-white px-4 lg:px-6">
            {lignes.map((echeance) => {
              const statut = STATUT_PAIEMENT[echeance.statut];
              const mois = libelleMois(echeance.dateEcheance);
              const aConfirmer =
                echeance.statut === "EN_ATTENTE_CONFIRMATION" &&
                echeance.sourceEnregistrement === "PROPRIETAIRE" &&
                !echeance.confirmeParLocataire;
              const confirmationEnCours = confirmerEspeces.isPending && confirmerEspeces.variables?.echeanceId === echeance.id;
              return (
                <li
                  key={echeance.id}
                  className="grid gap-3 py-4 md:grid-cols-[minmax(0,1fr)_150px_150px_120px] md:items-center md:gap-6"
                >
                  <div className="grid min-w-0 grid-cols-[1fr_auto] items-start gap-3 md:grid-cols-1">
                    <div className="min-w-0">
                      <p className="text-title font-semibold text-encre">{mois}</p>
                      <p className="text-body-m text-texte2">{detailEcheance(echeance)}</p>
                      {echeance.reference && <p className="mt-1 font-mono text-ref text-texte2">{echeance.reference}</p>}
                    </div>
                    <StatusBadge tone={statut.tone} className="md:hidden">
                      {statut.label}
                    </StatusBadge>
                  </div>
                  <p className="text-price font-bold tabular-nums text-encre md:text-right">{formatFcfa(echeance.montant)}</p>
                  <div className="hidden md:block">
                    <StatusBadge tone={statut.tone}>{statut.label}</StatusBadge>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 md:justify-end">
                    {aConfirmer && (
                      <Button size="sm" onClick={() => confirmer(echeance)} disabled={confirmationEnCours}>
                        {confirmationEnCours ? <Loader2 aria-hidden className="animate-spin" /> : <Check aria-hidden />}
                        Confirmer
                      </Button>
                    )}
                    {quittances.disponible(echeance) && (
                      <>
                        <Button
                          size="icon-sm"
                          variant="secondary"
                          onClick={() => quittances.ouvrir(echeance)}
                          aria-label={`Voir la quittance de ${mois}`}
                          title="Voir la quittance"
                        >
                          <Eye aria-hidden />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="secondary"
                          onClick={() => quittances.telecharger(echeance)}
                          aria-label={`Télécharger la quittance de ${mois}`}
                          title="Télécharger la quittance"
                        >
                          <Download aria-hidden />
                        </Button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {declarer && <LocatairePayModal echeancier={echeancier} onClose={() => setDeclarer(false)} />}
    </div>
  );
}
