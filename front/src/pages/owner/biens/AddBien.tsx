import { useState, type ReactElement } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Lock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { VerificationBanner } from "@/components/owner/VerificationAlert";
import { useAnnonceForm, type AnnonceForm } from "@/components/owner/annonce/useAnnonceForm";
import { ETAPES, type EtapeId } from "@/components/owner/annonce/etapes";
import { EtapesDesktop, EtatBrouillon, SegmentsMobile } from "@/components/owner/annonce/IndicateurEtapes";
import { EtapeCaracteristiques, EtapeLocalisation, EtapeType } from "@/components/owner/annonce/EtapesInformations";
import { EtapeEquipements, EtapeMeubles } from "@/components/owner/annonce/EtapesEquipements";
import { EtapePhotos } from "@/components/owner/annonce/EtapePhotos";
import { EtapePrix, EtapeRecapitulatif } from "@/components/owner/annonce/EtapesFinales";

// Publier ou modifier une annonce en 8 étapes (charte, planches 26 et 33),
// avec un brouillon enregistré à chaque changement d'étape.

const CONTENU_ETAPE: Record<EtapeId, (props: { form: AnnonceForm }) => ReactElement> = {
  type: EtapeType,
  localisation: EtapeLocalisation,
  caracteristiques: EtapeCaracteristiques,
  equipements: EtapeEquipements,
  meubles: EtapeMeubles,
  photos: EtapePhotos,
  prix: EtapePrix,
  recapitulatif: EtapeRecapitulatif,
};

function titrePage(form: AnnonceForm) {
  if (form.modificationPubliee) return "Modifier l'annonce publiée";
  if (form.editId) return "Modifier l'annonce";
  return "Nouvelle annonce";
}

function libelleEnvoi(form: AnnonceForm) {
  if (form.actionEnCours === "publication") return "Envoi…";
  if (form.statutAnnonce === "REJETE") return "Renvoyer l'annonce";
  if (form.modificationPubliee) return "Envoyer les modifications";
  return "Envoyer l'annonce";
}

function BarreActions({ form, retour }: { form: AnnonceForm; retour: string }) {
  const derniere = form.indexEtape === ETAPES.length - 1;
  if (form.verrouilleParBail) {
    return (
      <Button asChild className="w-full lg:w-auto">
        <Link to={retour}>Retour au bien</Link>
      </Button>
    );
  }
  return (
    <div className="flex gap-3">
      {form.indexEtape > 0 ? (
        <Button variant="outline" onClick={form.precedente} className="w-[38%] lg:w-auto">
          <ArrowLeft aria-hidden className="hidden lg:block" />
          Retour
        </Button>
      ) : (
        <Button asChild variant="outline" className="w-[38%] lg:w-auto">
          <Link to={retour}>Annuler</Link>
        </Button>
      )}
      {derniere ? (
        <Button
          className="flex-1 lg:flex-none"
          onClick={() => form.envoyer(false)}
          disabled={form.envoiEnCours || form.renvoiSansModification}
          title={form.renvoiSansModification ? "Modifiez au moins une information avant de renvoyer l'annonce" : undefined}
        >
          {libelleEnvoi(form)}
        </Button>
      ) : (
        <Button className="flex-1 lg:flex-none" onClick={form.suivante}>
          Continuer
          <ArrowRight aria-hidden />
        </Button>
      )}
    </div>
  );
}

function BandeauBail({ bienId }: { bienId: string }) {
  return (
    <div className="flex items-start gap-3 rounded-card bg-soleil-100 p-4 text-encre">
      <Lock aria-hidden className="mt-0.5 size-5 shrink-0" />
      <div className="text-body-m">
        <p className="font-semibold">Un bail est en cours : l'annonce est en lecture seule.</p>
        <p className="mt-1">
          Le loyer, la surface, l'adresse et le type de bien ne changent pas pendant un bail.{" "}
          <Link to={`/owner/biens/${bienId}`} className="font-semibold underline underline-offset-4">
            Gérer le bail
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function AddBien() {
  const form = useAnnonceForm();
  const [banniereVerification, setBanniereVerification] = useState(true);
  const etape = ETAPES[form.indexEtape];
  const Contenu = CONTENU_ETAPE[etape.id];
  const retour = form.editId ? `/owner/biens/${form.editId}` : "/owner/biens";
  const brouillon = (
    <EtatBrouillon
      enregistrement={form.brouillonEnregistrement}
      echec={form.brouillonEchec}
      heure={form.brouillonHeure}
      libelle={form.libelleBrouillon}
      repris={form.brouillonRepris}
    />
  );

  return (
    <div className="min-h-screen bg-white lg:min-h-0 lg:bg-transparent">
      {/* Mobile : barre propre au formulaire, plein écran (planche 33). */}
      <header className="sticky top-0 z-30 border-b border-filet bg-white px-4 pb-4 pt-3 lg:hidden">
        <div className="grid grid-cols-[48px_1fr_auto] items-center">
          <Link to={retour} aria-label="Quitter le formulaire" className="-ml-3 flex size-12 items-center justify-center rounded-full text-encre">
            <X aria-hidden className="size-6" />
          </Link>
          <p className="text-center text-title font-semibold text-encre">{titrePage(form)}</p>
          <button type="button" onClick={() => form.allerA("recapitulatif")} className="min-h-12 text-body-l font-semibold text-baobab">
            Aperçu
          </button>
        </div>
        <div className="mt-3 grid grid-cols-[1fr_auto] items-baseline gap-3">
          <h1 className="font-display text-h2 font-bold text-encre">{etape.titre}</h1>
          <span className="text-body-m text-texte2">Étape {form.indexEtape + 1} sur {ETAPES.length}</span>
        </div>
        <div className="mt-3">
          <SegmentsMobile indexEtape={form.indexEtape} />
        </div>
        <div className="mt-3 empty:hidden">{brouillon}</div>
      </header>

      {/* Desktop : titre de page et étapes reliées (planche 26). */}
      <div className="hidden space-y-8 lg:block">
        <div className="grid grid-cols-[1fr_auto] items-end gap-6">
          <div>
            <Link to={retour} className="text-body-m font-semibold text-baobab hover:underline">
              {form.editId ? "Retour au bien" : "Mes biens"}
            </Link>
            <h1 className="mt-1 font-display text-h1 font-bold text-encre">{titrePage(form)}</h1>
          </div>
          <div className="empty:hidden">{brouillon}</div>
        </div>
        <EtapesDesktop indexEtape={form.indexEtape} onSelect={form.allerA} />
      </div>

      <div className="mx-auto max-w-3xl space-y-4 px-4 py-6 lg:mt-8 lg:px-0 lg:py-0">
        {banniereVerification && <VerificationBanner onDismiss={() => setBanniereVerification(false)} />}
        {form.verrouilleParBail && form.editId && <BandeauBail bienId={form.editId} />}
        {form.modificationPubliee && (
          <p className="rounded-card bg-surface p-4 text-body-m text-encre">
            Les modifications passent en modération. L'annonce actuelle reste visible jusqu'à leur validation.
          </p>
        )}

        <section className="lg:rounded-card lg:border lg:border-filet lg:bg-white lg:p-8">
          <div className="mb-6 hidden grid-cols-[1fr_auto] items-baseline gap-4 lg:grid">
            <h2 className="font-display text-h2 font-bold text-encre">{etape.titre}</h2>
            <span className="text-body-m text-texte2">Étape {form.indexEtape + 1} sur {ETAPES.length}</span>
          </div>
          <fieldset disabled={form.verrouilleParBail} className="min-w-0 disabled:opacity-70">
            <legend className="sr-only">{etape.titre}</legend>
            <Contenu form={form} />
          </fieldset>
          <div className="mt-10 hidden border-t border-filet pt-6 lg:block">
            <div className="grid grid-cols-[1fr_auto] items-center gap-4">
              {form.brouillonAutorise && form.indexEtape === ETAPES.length - 1 ? (
                <Button variant="link" onClick={() => form.envoyer(true)} disabled={form.envoiEnCours} className="justify-self-start">
                  {form.actionEnCours === "brouillon" ? "Enregistrement…" : "Enregistrer le brouillon et quitter"}
                </Button>
              ) : (
                <span />
              )}
              <BarreActions form={form} retour={retour} />
            </div>
          </div>
        </section>
      </div>

      {/* Mobile : actions fixées en bas de l'écran. */}
      <div className="sticky bottom-0 z-30 border-t border-filet bg-white px-4 pb-[calc(16px+env(safe-area-inset-bottom))] pt-4 lg:hidden">
        <BarreActions form={form} retour={retour} />
      </div>

      <ConfirmModal
        open={form.typeEnAttente !== null}
        title="Changer de type de bien ?"
        message="Certaines informations déjà saisies ne s'appliquent pas au nouveau type. Elles seront retirées du formulaire."
        confirmLabel="Changer de type"
        cancelLabel="Garder le type actuel"
        variant="warning"
        onConfirm={form.confirmerChangementType}
        onCancel={form.annulerChangementType}
      />
    </div>
  );
}
