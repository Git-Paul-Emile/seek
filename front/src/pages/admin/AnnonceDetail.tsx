import { useId, useState, type FormEvent, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { Loader2, Mail, MapPin, Phone } from "lucide-react";
import { useBienById } from "@/hooks/useBien";
import { useValiderAnnonce, useDeleteAnnonceAdmin, useModifierAnnonceAdmin, useRepublierAnnonce, useRetirerAnnonce } from "@/hooks/useAnnonces";
import type { Bien, ModificationAnnonceAdmin } from "@/api/bien";
import { PropertyIllustration } from "@/components/brand/PropertyIllustration";
import { illustrationForType } from "@/components/brand/illustrationKind";
import { EmptyState } from "@/components/brand/EmptyState";
import { Button } from "@/components/ui/button";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { FieldError } from "@/components/ui/FieldError";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/input";
import { SheetDialog } from "@/components/ui/SheetDialog";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Textarea } from "@/components/ui/textarea";
import { STATUT_ANNONCE } from "@/components/admin/annonces/useModerationAnnonces";
import { BlocChargement, CarteAdmin, EnTeteAdmin, Initiales, SectionAdmin } from "@/components/admin/table/Tableau";
import { formatFcfa, libelleFrequence } from "@/lib/fcfa";
import { referenceBien } from "@/lib/referenceBien";
import { messageErreurApi } from "@/lib/erreurApi";
import { cn } from "@/lib/utils";
import { iconeEquipement } from "@/lib/iconesEquipements";
import { CaracteristiquesGrid } from "@/components/annonce-detail/CaracteristiquesGrid";

// Fiche complète d'une annonce pour la modération : photos et contenu à gauche, informations
// et décision à droite (même règle que la planche 41 : note obligatoire en cas de rejet).

const RETOUR = { to: "/admin/annonces", label: "Annonces" };
const NOTE_MIN = 10;
const TITRE_MIN = 3;
const DESCRIPTION_MIN_ADMIN = 10;

const dateLongue = (valeur: string) => format(new Date(valeur), "d MMMM yyyy", { locale: fr });

function Galerie({ bien }: { bien: Bien }) {
  const [index, setIndex] = useState(0);
  const photos = bien.photos ?? [];
  if (photos.length === 0) {
    return (
      <div className="aspect-video overflow-hidden rounded-card bg-surface">
        <PropertyIllustration kind={illustrationForType(bien.typeLogement?.slug ?? bien.typeLogement?.nom)} />
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <div className="relative aspect-video overflow-hidden rounded-card bg-surface">
        <img src={photos[index]} alt={`Photo ${index + 1} sur ${photos.length}`} className="size-full object-cover" />
        <span className="absolute bottom-3 right-3 rounded-full bg-encre/70 px-3 py-1 text-caption font-semibold text-white">
          {index + 1} / {photos.length}
        </span>
      </div>
      {photos.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {photos.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Voir la photo ${i + 1}`}
              aria-current={i === index}
              className={i === index ? "h-14 w-20 overflow-hidden rounded-control ring-2 ring-baobab" : "h-14 w-20 overflow-hidden rounded-control opacity-70 hover:opacity-100"}
            >
              <img src={url} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Ligne({ libelle, children }: { libelle: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(110px,45%)_1fr] gap-3 py-2.5">
      <dt className="text-texte2">{libelle}</dt>
      <dd className="text-right font-semibold text-encre">{children}</dd>
    </div>
  );
}

/** Correction du titre, de la description ou du prix ; seuls les champs changés sont envoyés. */
function ModificationAnnonce({ bien, open, onOpenChange }: { bien: Bien; open: boolean; onOpenChange: (open: boolean) => void }) {
  const modification = useModifierAnnonceAdmin();
  const [titre, setTitre] = useState(bien.titre ?? "");
  const [description, setDescription] = useState(bien.description ?? "");
  const [prix, setPrix] = useState(bien.prix ? String(bien.prix) : "");
  const [erreurs, setErreurs] = useState<Partial<Record<"titre" | "description" | "prix" | "global", string>>>({});

  const enregistrer = (event: FormEvent) => {
    event.preventDefault();
    const payload: ModificationAnnonceAdmin = {};
    const nouvelles: typeof erreurs = {};
    if (titre.trim() !== (bien.titre ?? "")) {
      if (titre.trim().length < TITRE_MIN) nouvelles.titre = `Le titre doit contenir au moins ${TITRE_MIN} caractères.`;
      payload.titre = titre.trim();
    }
    if (description.trim() !== (bien.description ?? "")) {
      if (description.trim().length < DESCRIPTION_MIN_ADMIN) {
        nouvelles.description = `La description doit contenir au moins ${DESCRIPTION_MIN_ADMIN} caractères.`;
      }
      payload.description = description.trim();
    }
    const prixSaisi = Number(prix.replace(/\s/g, ""));
    if (prix.trim() && prixSaisi !== bien.prix) {
      if (!Number.isFinite(prixSaisi) || prixSaisi <= 0) nouvelles.prix = "Saisissez un prix supérieur à zéro, en FCFA.";
      payload.prix = prixSaisi;
    }
    if (Object.keys(payload).length === 0) nouvelles.global = "Aucun changement à enregistrer.";
    setErreurs(nouvelles);
    if (Object.keys(nouvelles).length > 0) return;
    modification.mutate(
      { id: bien.id, payload },
      {
        onSuccess: () => {
          toast.success("Annonce modifiée, le propriétaire est prévenu");
          onOpenChange(false);
        },
        onError: (err) => setErreurs({ global: messageErreurApi(err, "La modification n'a pas pu être enregistrée. Réessayez.") }),
      },
    );
  };

  return (
    <SheetDialog open={open} onOpenChange={onOpenChange} title="Modifier l'annonce">
      <form onSubmit={enregistrer} noValidate className="space-y-5">
        <FormField label="Titre" error={erreurs.titre}>
          <Input value={titre} onChange={(e) => setTitre(e.target.value)} />
        </FormField>
        <FormField label="Description" error={erreurs.description}>
          <Textarea rows={6} value={description} onChange={(e) => setDescription(e.target.value)} />
        </FormField>
        <FormField label="Prix" hint="(FCFA)" error={erreurs.prix}>
          <Input inputMode="numeric" value={prix} onChange={(e) => setPrix(e.target.value)} />
        </FormField>
        {erreurs.global && <FieldError id="modification-erreur">{erreurs.global}</FieldError>}
        <p className="text-caption text-texte2">Le propriétaire reçoit une notification qui liste les champs corrigés.</p>
        <div className="grid grid-cols-2 gap-3">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button type="submit" disabled={modification.isPending}>
            {modification.isPending && <Loader2 aria-hidden className="animate-spin" />}
            Enregistrer
          </Button>
        </div>
      </form>
    </SheetDialog>
  );
}

/** Retirer une annonce publiée (motif obligatoire) ou republier une annonce retirée ou rejetée. */
function Publication({ bien }: { bien: Bien }) {
  const retrait = useRetirerAnnonce();
  const republication = useRepublierAnnonce();
  const [note, setNote] = useState("");
  const [erreur, setErreur] = useState<string>();
  const idNote = useId();

  if (bien.statutAnnonce === "REJETE") {
    return (
      <Button
        className="w-full"
        disabled={republication.isPending}
        onClick={() =>
          republication.mutate(bien.id, {
            onSuccess: () => toast.success("Annonce republiée, le propriétaire est prévenu"),
            onError: (err) => toast.error(messageErreurApi(err, "L'annonce n'a pas pu être republiée. Réessayez.")),
          })
        }
      >
        {republication.isPending && <Loader2 aria-hidden className="animate-spin" />}
        Republier l'annonce
      </Button>
    );
  }

  if (bien.statutAnnonce !== "PUBLIE") return null;

  const retirer = () => {
    if (note.trim().length < NOTE_MIN) {
      setErreur(`Expliquez au propriétaire pourquoi l'annonce est retirée, en ${NOTE_MIN} caractères au moins.`);
      return;
    }
    setErreur(undefined);
    retrait.mutate(
      { id: bien.id, note: note.trim() },
      {
        onSuccess: () => {
          toast.success("Annonce retirée de la publication, le propriétaire est prévenu");
          setNote("");
        },
        onError: (err) => toast.error(messageErreurApi(err, "L'annonce n'a pas pu être retirée. Réessayez.")),
      },
    );
  };

  return (
    <div>
      <label htmlFor={idNote} className="mb-2 block text-body-m font-semibold text-encre">
        Motif du retrait
      </label>
      <Textarea
        id={idNote}
        rows={3}
        value={note}
        aria-invalid={Boolean(erreur)}
        aria-describedby={`${idNote}-aide`}
        onChange={(event) => {
          setNote(event.target.value);
          setErreur(undefined);
        }}
        placeholder="Bien déjà loué, photos trompeuses, prix incorrect…"
      />
      {erreur ? (
        <FieldError id={`${idNote}-aide`}>{erreur}</FieldError>
      ) : (
        <p id={`${idNote}-aide`} className="mt-2 text-caption text-texte2">
          L'annonce n'est plus visible. Le propriétaire reçoit ce motif et peut la soumettre de nouveau.
        </p>
      )}
      <Button variant="outline" className="mt-3 w-full" onClick={retirer} disabled={retrait.isPending}>
        {retrait.isPending && <Loader2 aria-hidden className="animate-spin" />}
        Retirer de la publication
      </Button>
    </div>
  );
}

function Decision({ bien, onSupprimer, onModifier }: { bien: Bien; onSupprimer: () => void; onModifier: () => void }) {
  const navigate = useNavigate();
  const valider = useValiderAnnonce();
  const [note, setNote] = useState("");
  const [erreur, setErreur] = useState<string>();
  const idNote = useId();

  const decider = (action: "APPROUVER" | "REJETER") => {
    if (action === "REJETER" && note.trim().length < NOTE_MIN) {
      setErreur(`Expliquez au propriétaire ce qu'il doit corriger, en ${NOTE_MIN} caractères au moins.`);
      return;
    }
    setErreur(undefined);
    valider.mutate(
      { id: bien.id, action, note: note.trim() || undefined },
      {
        onSuccess: () => {
          toast.success(action === "APPROUVER" ? "Annonce validée et publiée" : "Annonce rejetée, le propriétaire est prévenu");
          navigate("/admin/annonces");
        },
        onError: () => toast.error("La décision n'a pas pu être enregistrée. Réessayez."),
      },
    );
  };

  if (bien.statutAnnonce !== "EN_ATTENTE") {
    return (
      <SectionAdmin titre="Décision">
        {bien.statutAnnonce === "REJETE" && bien.noteAdmin && (
          <div className="mb-4 rounded-control bg-surface p-4 text-body-m">
            <p className="font-semibold text-encre">Note envoyée au propriétaire</p>
            <p className="mt-1 text-texte2">{bien.noteAdmin}</p>
          </div>
        )}
        <div className="space-y-3">
          <Publication bien={bien} />
          {bien.statutAnnonce !== "BROUILLON" && (
            <Button variant="outline" className="w-full" onClick={onModifier}>
              Modifier le titre, la description ou le prix
            </Button>
          )}
          <Button variant="outline" className="w-full" onClick={onSupprimer}>
            Supprimer l'annonce
          </Button>
        </div>
      </SectionAdmin>
    );
  }

  return (
    <SectionAdmin titre="Décision">
      <label htmlFor={idNote} className="mb-2 block text-body-m font-semibold text-encre">
        Note au propriétaire
      </label>
      <Textarea
        id={idNote}
        rows={4}
        value={note}
        aria-invalid={Boolean(erreur)}
        aria-describedby={`${idNote}-aide`}
        onChange={(event) => {
          setNote(event.target.value);
          setErreur(undefined);
        }}
        placeholder="Photos insuffisantes, informations manquantes, prix incorrect…"
      />
      {erreur ? (
        <FieldError id={`${idNote}-aide`}>{erreur}</FieldError>
      ) : (
        <p id={`${idNote}-aide`} className="mt-2 text-caption text-texte2">
          Obligatoire en cas de rejet. Le propriétaire la reçoit avec la décision.
        </p>
      )}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Button variant="outline" onClick={() => decider("REJETER")} disabled={valider.isPending}>
          Rejeter
        </Button>
        <Button onClick={() => decider("APPROUVER")} disabled={valider.isPending}>
          {valider.isPending && <Loader2 aria-hidden className="animate-spin" />}
          Valider
        </Button>
      </div>
      <Button variant="link" className="mt-3" onClick={onModifier}>
        Corriger une erreur avant de valider
      </Button>
    </SectionAdmin>
  );
}

/** Équipements, meubles ou options, chacun avec son icône (coche si aucune ne correspond). */
function ListeIcones({ libelles, className }: { libelles: string[]; className?: string }) {
  return (
    <ul className={cn("grid gap-x-6 gap-y-3 sm:grid-cols-2", className)}>
      {libelles.map((libelle) => {
        const Icon = iconeEquipement(libelle);
        return (
          <li key={libelle} className="flex items-center gap-3 text-body-m text-encre">
            <Icon aria-hidden className="size-5 shrink-0 text-baobab" strokeWidth={1.75} />
            {libelle}
          </li>
        );
      })}
    </ul>
  );
}

export default function AnnonceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: bien, isLoading, isError } = useBienById(id ?? "");
  const suppression = useDeleteAnnonceAdmin();
  const [aSupprimer, setASupprimer] = useState(false);
  const [enModification, setEnModification] = useState(false);

  if (isLoading) {
    return (
      <div>
        <EnTeteAdmin retour={RETOUR} titre="Annonce" />
        <BlocChargement label="Chargement de l'annonce" />
      </div>
    );
  }

  if (isError || !bien) {
    return (
      <div>
        <EnTeteAdmin retour={RETOUR} titre="Annonce" />
        <CarteAdmin>
          <EmptyState titre="Annonce introuvable" texte="Elle a peut-être été supprimée. Revenez à la file de modération." />
        </CarteAdmin>
      </div>
    );
  }

  const statut = STATUT_ANNONCE[bien.statutAnnonce];
  const frequence = libelleFrequence(bien.frequencePaiement);
  const lieu = [bien.adresse, bien.quartier, bien.ville, bien.region, bien.pays].filter(Boolean).join(", ");

  const options = [
    { libelle: "Meublé", actif: bien.meuble },
    { libelle: "Fumeurs acceptés", actif: bien.fumeurs },
    { libelle: "Animaux acceptés", actif: bien.animaux },
    { libelle: "Parking", actif: bien.parking },
    { libelle: "Ascenseur", actif: bien.ascenseur },
  ].filter(({ actif }) => actif);

  const supprimer = () =>
    suppression.mutate(bien.id, {
      onSuccess: () => {
        toast.success("Annonce supprimée");
        navigate("/admin/annonces");
      },
      onError: () => {
        toast.error("L'annonce n'a pas pu être supprimée. Réessayez.");
        setASupprimer(false);
      },
    });

  return (
    <div className="space-y-6">
      <EnTeteAdmin
        retour={RETOUR}
        titre={bien.titre || "Annonce sans titre"}
        description={
          <span className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-ref">SK-{referenceBien(bien.id)}</span>
            <StatusBadge tone={statut.tone}>{statut.label}</StatusBadge>
          </span>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-6">
          <Galerie bien={bien} />

          {bien.description && (
            <SectionAdmin titre="Description">
              <p className="whitespace-pre-wrap text-body-l text-encre">{bien.description}</p>
            </SectionAdmin>
          )}

          <SectionAdmin titre="Caractéristiques">
            {/* Même rangée que la fiche publique : icônes, une seule ligne qui défile. */}
            <CaracteristiquesGrid bien={bien} titre={false} />
            {options.length > 0 && <ListeIcones libelles={options.map(({ libelle }) => libelle)} className="mt-4" />}
          </SectionAdmin>

          {bien.equipements && bien.equipements.length > 0 && (
            <SectionAdmin titre="Équipements">
              <ListeIcones libelles={bien.equipements.map(({ equipement }) => equipement.nom)} />
            </SectionAdmin>
          )}

          {bien.meubles && bien.meubles.length > 0 && (
            <SectionAdmin titre="Mobilier">
              <ListeIcones libelles={bien.meubles.map(({ meuble, quantite }) => (quantite > 1 ? `${meuble.nom} × ${quantite}` : meuble.nom))} />
            </SectionAdmin>
          )}
        </div>

        <aside aria-label="Informations et décision" className="space-y-6">
          <Decision bien={bien} onSupprimer={() => setASupprimer(true)} onModifier={() => setEnModification(true)} />

          {bien.proprietaire && (
            <SectionAdmin titre="Propriétaire">
              <div className="grid grid-cols-[auto_1fr] items-start gap-3">
                <Initiales prenom={bien.proprietaire.prenom} nom={bien.proprietaire.nom} />
                <div className="min-w-0 space-y-1 text-body-m">
                  <p className="text-title font-semibold text-encre">
                    {bien.proprietaire.prenom} {bien.proprietaire.nom}
                  </p>
                  <a href={`tel:${bien.proprietaire.telephone}`} className="flex items-center gap-2 tabular-nums text-texte2 hover:text-encre">
                    <Phone aria-hidden className="size-4" />
                    {bien.proprietaire.telephone}
                  </a>
                  {bien.proprietaire.email && (
                    <a href={`mailto:${bien.proprietaire.email}`} className="flex items-center gap-2 break-all text-texte2 hover:text-encre">
                      <Mail aria-hidden className="size-4 shrink-0" />
                      {bien.proprietaire.email}
                    </a>
                  )}
                </div>
              </div>
            </SectionAdmin>
          )}

          <SectionAdmin titre="Prix et conditions">
            {bien.prix ? (
              <p className="font-display text-price-l font-bold text-encre">
                {formatFcfa(bien.prix)}
                {frequence && <span className="font-body text-body-l font-normal text-texte2"> / {frequence}</span>}
              </p>
            ) : (
              <p className="text-body-m text-texte2">Prix non renseigné.</p>
            )}
            <dl className="mt-3 divide-y divide-filet border-t border-filet text-body-m">
              {bien.caution ? <Ligne libelle="Caution">{formatFcfa(bien.caution)}</Ligne> : null}
              <Ligne libelle="Charges incluses">{bien.chargesIncluses ? "Oui" : "Non"}</Ligne>
              {bien.disponibleLe && <Ligne libelle="Disponible le">{dateLongue(bien.disponibleLe)}</Ligne>}
            </dl>
          </SectionAdmin>

          <SectionAdmin titre="Bien">
            <p className="flex items-start gap-2 text-body-m text-encre">
              <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-baobab" />
              {lieu || "Adresse non renseignée"}
            </p>
            <dl className="mt-3 divide-y divide-filet border-t border-filet text-body-m">
              {bien.typeLogement && <Ligne libelle="Type de logement">{bien.typeLogement.nom}</Ligne>}
              {bien.typeTransaction && <Ligne libelle="Transaction">{bien.typeTransaction.nom}</Ligne>}
              {bien.statutBien && <Ligne libelle="Statut du bien">{bien.statutBien.nom}</Ligne>}
              <Ligne libelle="Créée le">{dateLongue(bien.createdAt)}</Ligne>
              <Ligne libelle="Modifiée le">{dateLongue(bien.updatedAt)}</Ligne>
            </dl>
          </SectionAdmin>
        </aside>
      </div>

      {enModification && <ModificationAnnonce bien={bien} open={enModification} onOpenChange={setEnModification} />}

      <ConfirmModal
        open={aSupprimer}
        title="Supprimer cette annonce ?"
        message={`« ${bien.titre || "Sans titre"} » sera supprimée définitivement. Cette action ne peut pas être annulée.`}
        confirmLabel="Supprimer définitivement"
        isPending={suppression.isPending}
        onConfirm={supprimer}
        onCancel={() => setASupprimer(false)}
      />
    </div>
  );
}
