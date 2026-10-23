import { useState, type ReactNode } from "react";
import { CircleCheck, Hourglass, Loader2, Smartphone, Star, TriangleAlert } from "lucide-react";
import {
  usePromotionStatus,
  usePlacesDisponibles,
  useFormulesPremium,
  usePayerPremium,
  useArreterPremium,
  type FormulePremium,
} from "@/hooks/usePremium";
import type { ResultatPaiementPremium } from "@/api/premium";
import { useOwnerAuth } from "@/context/OwnerAuthContext";
import { Button } from "@/components/ui/button";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { SheetDialog } from "@/components/ui/SheetDialog";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDateLongue } from "@/lib/dates";
import { messageErreurApi } from "@/lib/erreurApi";
import { formatFcfa } from "@/lib/fcfa";
import { cn } from "@/lib/utils";

// Mise en avant payante d'une annonce publiée : carte d'état, puis choix de la formule,
// du moyen de paiement, et fenêtre de résultat (charte, planche « Alertes et fenêtres »).

interface PremiumPaymentProps {
  bienId: string;
  bienTitre: string;
  onSuccess?: () => void;
}

type ModalType = "select-formule" | "select-paiement" | "success" | "error" | "arreter" | null;

function TuileChoix({
  name,
  choisi,
  onChoisir,
  children,
}: {
  name: string;
  choisi: boolean;
  onChoisir: () => void;
  children: ReactNode;
}) {
  return (
    <label
      className={cn(
        "grid cursor-pointer grid-cols-[auto_1fr] items-start gap-3 rounded-card border px-4 py-3 transition-colors duration-hover",
        choisi ? "border-2 border-baobab bg-baobab-100 px-[15px] py-[11px]" : "border-filet bg-white hover:bg-surface",
      )}
    >
      <input type="radio" name={name} checked={choisi} onChange={onChoisir} className="mt-0.5 size-5 accent-baobab" />
      <span className="min-w-0">{children}</span>
    </label>
  );
}

export default function PremiumPayment({ bienId, bienTitre, onSuccess }: PremiumPaymentProps) {
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedFormule, setSelectedFormule] = useState<FormulePremium | null>(null);
  const [selectedPaiement, setSelectedPaiement] = useState<string | null>(null);
  const [paiementResult, setPaiementResult] = useState<ResultatPaiementPremium | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: formulesData, isLoading: loadingFormules } = useFormulesPremium();
  const { data: status, isLoading: loadingStatus } = usePromotionStatus(bienId);
  const { data: places } = usePlacesDisponibles();
  const payerMutation = usePayerPremium();
  const arreterMutation = useArreterPremium();
  const { owner } = useOwnerAuth();

  const formules = formulesData?.formules || [];
  const moyensPaiement = formulesData?.moyenPaiement || [];

  const isPromoted = status?.estMisEnAvant ?? false;
  const joursRestants = status?.joursRestants ?? 0;
  const isTerminee = !isPromoted && status?.dateFinPromotion && new Date(status.dateFinPromotion) < new Date();
  const peutRenouveler = !isPromoted && (!status?.dateFinPromotion || isTerminee);
  const pluriel = (jours: number) => `${jours} jour${jours > 1 ? "s" : ""}`;

  const ouvrirFormules = () => {
    setSelectedFormule(null);
    setSelectedPaiement(null);
    setErrorMessage(null);
    setModalType("select-formule");
  };

  const handleOpenPayment = () => {
    if (!selectedFormule) return;
    setModalType("select-paiement");
  };

  const handlePayer = () => {
    if (!selectedFormule || !selectedPaiement || !owner) return;

    payerMutation.mutate(
      { bienId, formuleId: selectedFormule.id, modePaiement: selectedPaiement },
      {
        onSuccess: (data) => {
          setPaiementResult(data);
          setModalType("success");
          onSuccess?.();
        },
        onError: (error) => {
          setErrorMessage(messageErreurApi(error, "Le paiement n'a pas abouti. Vérifiez votre solde Mobile Money puis réessayez."));
          setModalType("error");
        },
      },
    );
  };

  const handleCloseSuccess = () => {
    setModalType(null);
    setSelectedFormule(null);
    setSelectedPaiement(null);
    setPaiementResult(null);
  };

  const handleArreter = () => {
    if (!owner) return;
    arreterMutation.mutate({ bienId }, { onSuccess: () => { setModalType(null); onSuccess?.(); } });
  };

  const fermer = (open: boolean) => !open && !payerMutation.isPending && setModalType(null);

  return (
    <>
      <section aria-labelledby="titre-mise-en-avant" className="rounded-card bg-white p-5 lg:p-6">
        <div className="mb-4 grid grid-cols-[1fr_auto] items-center gap-3">
          <h2 id="titre-mise-en-avant" className="font-display text-h3 font-bold text-encre">
            Mise en avant
          </h2>
          {!loadingStatus && (isPromoted ? <StatusBadge tone="premium">Active</StatusBadge> : <StatusBadge tone="neutre">Inactive</StatusBadge>)}
        </div>

        {loadingFormules || loadingStatus ? (
          <div className="space-y-3">
            <div className="h-4 w-3/4 animate-pulse rounded bg-filet" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-filet" />
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-body-m text-texte2">Votre annonce apparaît en priorité dans les résultats de recherche.</p>

            {places && !isPromoted && (
              <p className="text-caption text-texte2">
                {places.placesDisponibles > 0
                  ? `${places.placesUtilisees} places sur ${places.placesMax} utilisées`
                  : `Toutes les places sont occupées (${places.placesMax} sur ${places.placesMax})${
                      places.prochaineLiberation ? `. Prochaine place libre le ${formatDateLongue(places.prochaineLiberation)}.` : ""
                    }`}
              </p>
            )}

            {isPromoted && status?.dateFinPromotion && (
              <p className="grid grid-cols-[auto_1fr] items-center gap-2 rounded-control bg-surface p-3 text-body-m text-encre">
                <Hourglass aria-hidden className="size-4 text-texte2" />
                <span>
                  Se termine le {formatDateLongue(status.dateFinPromotion)}
                  {joursRestants > 0 && <span className="font-semibold text-baobab"> · {pluriel(joursRestants)}</span>}
                </span>
              </p>
            )}

            {isPromoted ? (
              <Button variant="outline" className="w-full" onClick={() => setModalType("arreter")} disabled={arreterMutation.isPending}>
                Arrêter la mise en avant
              </Button>
            ) : (
              <Button variant="soleil" className="w-full" onClick={ouvrirFormules} disabled={payerMutation.isPending}>
                <Star aria-hidden />
                {peutRenouveler ? "Renouveler" : "Mettre en avant"}
              </Button>
            )}
          </div>
        )}
      </section>

      <SheetDialog open={modalType === "select-formule"} onOpenChange={fermer} title="Choisir une formule" description={`Durée de mise en avant pour « ${bienTitre} »`}>
        {loadingFormules ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-card bg-filet" />
            ))}
          </div>
        ) : (
          <fieldset className="space-y-3">
            <legend className="sr-only">Formule</legend>
            {formules.map((formule) => (
              <TuileChoix key={formule.id} name="formule" choisi={selectedFormule?.id === formule.id} onChoisir={() => setSelectedFormule(formule)}>
                <span className="grid grid-cols-[1fr_auto] items-start gap-3">
                  <span className="text-body-l font-semibold text-encre">{formule.nom}</span>
                  <span className="text-price font-bold text-encre">{formatFcfa(formule.prix)}</span>
                </span>
                <span className="mt-1 block text-caption text-texte2">{pluriel(formule.dureeJours)}</span>
                {formule.populer && (
                  <StatusBadge tone="premium" size="sm" className="mt-2">
                    Recommandée
                  </StatusBadge>
                )}
                <span className="mt-2 block text-body-m font-semibold text-encre">{formule.accroche}</span>
                <span className="mt-1 line-clamp-2 block text-body-m text-texte2">{formule.description}</span>
                {formule.idealPour && formule.idealPour.length > 0 && (
                  <span className="mt-2 block text-caption text-texte2">Idéal pour : {formule.idealPour.slice(0, 2).join(", ")}</span>
                )}
              </TuileChoix>
            ))}
          </fieldset>
        )}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Button variant="outline" onClick={() => setModalType(null)}>
            Annuler
          </Button>
          <Button onClick={handleOpenPayment} disabled={!selectedFormule}>
            Continuer
          </Button>
        </div>
      </SheetDialog>

      <SheetDialog open={modalType === "select-paiement"} onOpenChange={fermer} title="Moyen de paiement">
        <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 rounded-card bg-surface p-4 text-body-m">
          <dt className="text-texte2">Formule</dt>
          <dd className="text-right font-semibold text-encre">{selectedFormule?.nom}</dd>
          <dt className="text-texte2">Total</dt>
          <dd className="text-right text-price font-bold text-encre">{selectedFormule ? formatFcfa(selectedFormule.prix) : ""}</dd>
        </dl>
        <fieldset className="mt-5 space-y-3">
          <legend className="mb-3 text-body-m font-semibold text-encre">Choisissez un moyen de paiement</legend>
          {moyensPaiement.map((moyen) => (
            <TuileChoix key={moyen.id} name="moyen-paiement" choisi={selectedPaiement === moyen.id} onChoisir={() => setSelectedPaiement(moyen.id)}>
              <span className="grid grid-cols-[auto_1fr] items-center gap-3">
                <Smartphone aria-hidden className="size-6 text-encre" strokeWidth={1.75} />
                <span>
                  <span className="block text-body-l font-semibold text-encre">{moyen.nom}</span>
                  <span className="block text-body-m text-texte2">{moyen.description}</span>
                </span>
              </span>
            </TuileChoix>
          ))}
        </fieldset>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Button variant="outline" onClick={() => setModalType("select-formule")} disabled={payerMutation.isPending}>
            Retour
          </Button>
          <Button variant="soleil" onClick={handlePayer} disabled={!selectedPaiement || payerMutation.isPending}>
            {payerMutation.isPending && <Loader2 aria-hidden className="animate-spin" />}
            Payer maintenant
          </Button>
        </div>
      </SheetDialog>

      <SheetDialog open={modalType === "success"} onOpenChange={(open) => !open && handleCloseSuccess()} title="Paiement réussi">
        <div className="grid grid-cols-[auto_1fr] items-start gap-3">
          <CircleCheck aria-hidden className="mt-0.5 size-6 text-baobab" />
          <p className="text-body-l text-encre">Votre annonce « {bienTitre} » est maintenant mise en avant.</p>
        </div>
        {paiementResult && (
          <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-card bg-surface p-4 text-body-m">
            <dt className="text-texte2">Transaction</dt>
            <dd className="break-all text-right font-mono text-caption text-encre">{paiementResult.paiement.transactionId}</dd>
            <dt className="text-texte2">Montant</dt>
            <dd className="text-right font-semibold text-encre">{formatFcfa(paiementResult.paiement.montant)}</dd>
            {selectedFormule && (
              <>
                <dt className="text-texte2">Durée</dt>
                <dd className="text-right font-semibold text-encre">{pluriel(selectedFormule.dureeJours)}</dd>
              </>
            )}
            {paiementResult.promotion.dateFinPromotion && (
              <>
                <dt className="text-texte2">Se termine le</dt>
                <dd className="text-right font-semibold text-encre">{formatDateLongue(paiementResult.promotion.dateFinPromotion)}</dd>
              </>
            )}
          </dl>
        )}
        <Button className="mt-6 w-full" onClick={handleCloseSuccess}>
          Fermer
        </Button>
      </SheetDialog>

      <SheetDialog open={modalType === "error"} onOpenChange={fermer} title="Le paiement n'a pas abouti">
        <div className="grid grid-cols-[auto_1fr] items-start gap-3">
          <TriangleAlert aria-hidden className="mt-0.5 size-6 fill-soleil text-encre" />
          <p className="text-body-l text-encre">{errorMessage}</p>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Button variant="outline" onClick={() => setModalType(null)}>
            Annuler
          </Button>
          <Button onClick={ouvrirFormules}>Réessayer</Button>
        </div>
      </SheetDialog>

      <ConfirmModal
        open={modalType === "arreter"}
        title="Arrêter la mise en avant ?"
        message={
          <p>
            Vous perdrez {joursRestants > 0 ? <strong className="text-encre">les {pluriel(joursRestants)} restants</strong> : "le temps restant"} de mise en avant. Cette action est
            irréversible.
          </p>
        }
        confirmLabel="Arrêter la mise en avant"
        isPending={arreterMutation.isPending}
        onConfirm={handleArreter}
        onCancel={() => setModalType(null)}
      />
    </>
  );
}
