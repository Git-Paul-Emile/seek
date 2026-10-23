import { useState, useEffect, type ReactNode } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle, Clock, ClipboardCheck, FileText, Link2, Loader2, Mail, Phone, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";
import {
  useLocataireById,
  useDeleteLocataire,
  useGetLienActivation,
  useApproveLocataireVerification,
  useRejectLocataireVerification,
} from "@/hooks/useLocataire";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { EmptyState } from "@/components/brand/EmptyState";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/FieldError";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/input";
import { SheetDialog } from "@/components/ui/SheetDialog";
import { StatusBadge, type StatusTone } from "@/components/ui/StatusBadge";
import type { StatutLocataire, StatutVerificationLocataire } from "@/api/locataire";
import ContratModal from "../biens/ContratModal";
import type { Bail } from "@/api/bail";
import { formatDateLongue } from "@/lib/dates";
import { messageErreurApi } from "@/lib/erreurApi";
import { formatFcfa } from "@/lib/fcfa";
import { cn } from "@/lib/utils";

// Fiche d'un locataire côté propriétaire : coordonnées, identité, vérification des documents
// (le propriétaire valide lui-même), baux et contrats.

// helper for displaying sexe values (owner detail view)
const displaySexe = (s?: string | null) => {
  if (!s) return "";
  const up = s.trim().toUpperCase();
  if (up === "M" || up.startsWith("MASC")) return "Masculin";
  if (up === "F" || up.startsWith("FEM")) return "Féminin";
  return s;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUT_CONFIG: Record<StatutLocataire, { label: string; color: string; icon: ReactNode }> = {
  INVITE: {
    label: "En attente d'activation",
    color: "bg-soleil-100 text-encre",
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  ACTIF: {
    label: "Actif",
    color: "bg-baobab-100 text-baobab",
    icon: <CheckCircle className="w-3.5 h-3.5" />,
  },
  INACTIF: {
    label: "Inactif",
    color: "bg-surface text-texte2",
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
};

const VERIFICATION: Record<StatutVerificationLocataire, { label: string; tone: StatusTone }> = {
  NOT_VERIFIED: { label: "Non envoyée", tone: "neutre" },
  PENDING: { label: "À examiner", tone: "attente" },
  VERIFIED: { label: "Vérifiée", tone: "positif" },
  REJECTED: { label: "Refusée", tone: "alerte" },
};

const BAIL_STATUT: Record<string, { label: string; tone: StatusTone }> = {
  ACTIF: { label: "Actif", tone: "positif" },
  EN_PREAVIS: { label: "En préavis", tone: "alerte" },
  EN_RENOUVELLEMENT: { label: "En renouvellement", tone: "attente" },
  EN_ATTENTE: { label: "En attente", tone: "attente" },
  TERMINE: { label: "Terminé", tone: "arret" },
  RESILIE: { label: "Résilié", tone: "arret" },
  ARCHIVE: { label: "Archivé", tone: "neutre" },
};

const fmt = (date?: string | null) => (date ? formatDateLongue(date) : "");

// Motifs de rejet pour les propriétaires
const REJECTION_MOTIFS = [
  "Document illisible",
  "Document expiré",
  "Informations non conformes au compte",
  "Photo non correspondante",
  "Document incomplet",
  "Suspicion de fraude",
];

// Checklist pour la validation
interface ValidationChecklist {
  documentLisible: boolean;
  documentComplet: boolean;
  documentNonExpire: boolean;
  nomCorrespond: boolean;
  selfieCorrespond: boolean;
}

const CHECKLIST_VIDE: ValidationChecklist = {
  documentLisible: false,
  documentComplet: false,
  documentNonExpire: false,
  nomCorrespond: false,
  selfieCorrespond: false,
};

const POINTS_CHECKLIST: { cle: keyof ValidationChecklist; libelle: string }[] = [
  { cle: "documentLisible", libelle: "Le document est lisible" },
  { cle: "documentComplet", libelle: "Le document est complet" },
  { cle: "documentNonExpire", libelle: "Le document n'est pas expiré" },
  { cle: "nomCorrespond", libelle: "Le nom correspond au compte" },
  { cle: "selfieCorrespond", libelle: "Le selfie correspond à la photo du document" },
];

function Carte({ titre, actions, children }: { titre: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <section aria-label={titre} className="rounded-card bg-white p-5 lg:p-6">
      <div className="mb-4 grid grid-cols-[1fr_auto] items-center gap-3">
        <h2 className="font-display text-h3 font-bold text-encre">{titre}</h2>
        {actions}
      </div>
      {children}
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LocataireDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { data: locataire, isLoading } = useLocataireById(id!);
  const deleteLocataire = useDeleteLocataire();
  const getLien = useGetLienActivation();
  const approveVerification = useApproveLocataireVerification();
  const rejectVerification = useRejectLocataireVerification();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [selectedBail, setSelectedBail] = useState<Bail | null>(null);

  // States pour la vérification
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [checklist, setChecklist] = useState<ValidationChecklist>(CHECKLIST_VIDE);
  const [selectedMotif, setSelectedMotif] = useState("");
  const [customMotif, setCustomMotif] = useState("");
  const [erreurMotif, setErreurMotif] = useState<string>();
  const [lightboxImage, setLightboxImage] = useState<{ src: string; alt: string } | null>(null);

  // Forcer refresh si paramètre refreshed=true
  useEffect(() => {
    if (searchParams.get("refreshed") === "true") {
      queryClient.invalidateQueries({ queryKey: ["locataires", id] });
    }
  }, [searchParams, queryClient, id]);

  // Afficher le lien d'activation si le locataire est en attente d'activation
  // ET qu'il a au moins un bail avec un contrat actif
  const peutAfficherLien = Boolean(
    locataire &&
      locataire.statut === "INVITE" &&
      Array.isArray(locataire.bails) &&
      locataire.bails.some((bail) => bail.contrat && bail.contrat.statut === "ACTIF"),
  );

  const handleSendActivation = async () => {
    try {
      await getLien.mutateAsync(id!);
    } catch {
      toast.error("Le lien d'activation n'a pas pu être généré. Réessayez dans un instant.");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteLocataire.mutateAsync(id!);
      toast.success("Locataire supprimé");
      navigate("/owner/locataires");
    } catch (err: unknown) {
      toast.error(messageErreurApi(err, "La fiche n'a pas pu être supprimée. Réessayez."));
    } finally {
      setConfirmDelete(false);
    }
  };

  const handleApprove = async () => {
    try {
      await approveVerification.mutateAsync(id!);
      toast.success("Identité vérifiée");
      setShowVerifyModal(false);
      setChecklist(CHECKLIST_VIDE);
    } catch (err: unknown) {
      toast.error(messageErreurApi(err, "La vérification n'a pas pu être validée. Réessayez."));
    }
  };

  const fermerRejet = () => {
    setShowRejectModal(false);
    setSelectedMotif("");
    setCustomMotif("");
    setErreurMotif(undefined);
  };

  const handleReject = async () => {
    const motif = selectedMotif === "autre" ? customMotif.trim() : selectedMotif;
    if (!motif) {
      setErreurMotif(selectedMotif === "autre" ? "Écrivez le motif du refus." : "Choisissez le motif du refus.");
      return;
    }
    setErreurMotif(undefined);
    try {
      await rejectVerification.mutateAsync({ locataireId: id!, motif });
      toast.success("Demande refusée, le locataire est prévenu");
      fermerRejet();
    } catch (err: unknown) {
      toast.error(messageErreurApi(err, "Le refus n'a pas pu être enregistré. Réessayez."));
    }
  };

  const allChecksPassed = Object.values(checklist).every(Boolean);
  const nbPointsCoches = Object.values(checklist).filter(Boolean).length;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-card bg-white" />
        ))}
      </div>
    );
  }

  if (!locataire) {
    return (
      <EmptyState
        titreNiveau="h1"
        titre="Locataire introuvable"
        texte="Cette fiche n'existe plus ou ne fait pas partie de vos locataires."
        action={
          <Button asChild>
            <Link to="/owner/locataires">Retour aux locataires</Link>
          </Button>
        }
      />
    );
  }

  const cfg = STATUT_CONFIG[locataire.statut] ?? { label: locataire.statut, color: "bg-surface text-texte2", icon: null };
  const verification = locataire.verification;
  const statutVerification = verification ? (VERIFICATION[verification.statut] ?? VERIFICATION.NOT_VERIFIED) : null;
  const documents = verification
    ? [
        { src: verification.pieceIdentiteRecto, alt: verification.typePiece === "CNI" ? "Carte d'identité, recto" : "Page d'identité" },
        { src: verification.pieceIdentiteVerso, alt: "Carte d'identité, verso" },
        { src: verification.selfie, alt: "Selfie" },
      ].filter((doc): doc is { src: string; alt: string } => Boolean(doc.src))
    : [];

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <header className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
        <span className="flex size-14 items-center justify-center rounded-full bg-baobab-100 text-h3 font-bold text-baobab" aria-hidden>
          {locataire.prenom[0]}{locataire.nom[0]}
        </span>
        <div className="min-w-0">
          <button type="button" onClick={() => navigate("/owner/locataires")} className="text-body-m font-semibold text-baobab hover:underline">
            Locataires
          </button>
          <h1 className="truncate font-display text-h2 font-bold text-encre">{locataire.prenom} {locataire.nom}</h1>
          <span className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-caption font-semibold ${cfg.color}`}>
            {cfg.icon}
            {cfg.label}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          aria-label="Supprimer la fiche du locataire"
          title="Supprimer"
          className="flex size-11 items-center justify-center rounded-control border border-bord-champ text-encre hover:bg-surface"
        >
          <Trash2 aria-hidden className="size-4" />
        </button>
      </header>

      {/* Lien d'activation - uniquement si contrat validé ET locataire pas encore actif */}
      {peutAfficherLien && (
        <div className="grid grid-cols-[auto_1fr] items-start gap-3 rounded-card bg-baobab-100 p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center">
          <Link2 aria-hidden className="mt-0.5 size-5 text-baobab sm:mt-0" />
          <div className="min-w-0">
            <p className="text-body-l font-semibold text-encre">Un lien d'activation a été envoyé au locataire par SMS</p>
            <p className="text-body-m text-texte2">S'il ne l'a pas reçu ou l'a perdu, envoyez-lui un nouveau lien.</p>
          </div>
          <Button className="col-span-2 sm:col-span-1" variant="outline" onClick={handleSendActivation} disabled={getLien.isPending}>
            {getLien.isPending && <Loader2 aria-hidden className="animate-spin" />}
            {getLien.isPending ? "Envoi en cours" : "Renvoyer le lien"}
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Carte titre="Coordonnées">
          <ul className="space-y-1 text-body-l">
            <li>
              <a href={`tel:${locataire.telephone}`} className="flex min-h-12 items-center gap-3 text-encre hover:text-baobab">
                <Phone aria-hidden className="size-5 text-texte2" />
                {locataire.telephone}
              </a>
            </li>
            {locataire.email && (
              <li>
                <a href={`mailto:${locataire.email}`} className="flex min-h-12 items-center gap-3 break-all text-encre hover:text-baobab">
                  <Mail aria-hidden className="size-5 shrink-0 text-texte2" />
                  {locataire.email}
                </a>
              </li>
            )}
          </ul>
          <dl className="mt-3 divide-y divide-filet border-t border-filet text-body-m">
            <Row label="Occupants" value={`${locataire.nbOccupants} occupant${locataire.nbOccupants > 1 ? "s" : ""}`} />
            <Row label="Enfants" value={locataire.presenceEnfants ? "Oui" : "Non"} />
          </dl>
        </Carte>

        <Carte titre="Identité" actions={locataire.statut === "INVITE" ? <StatusBadge tone="attente" size="sm">À compléter</StatusBadge> : undefined}>
          {locataire.statut === "INVITE" ? (
            <p className="text-body-m text-texte2">Le locataire renseignera ces informations en activant son compte.</p>
          ) : (
            <dl className="divide-y divide-filet text-body-m">
              <Row label="Date de naissance" value={fmt(locataire.dateNaissance)} />
              <Row label="Lieu de naissance" value={locataire.lieuNaissance} />
              <Row label="Nationalité" value={locataire.nationalite} />
              <Row label="Sexe" value={displaySexe(locataire.sexe)} />
              <Row label="Pièce d'identité" value={locataire.typePiece ? `${locataire.typePiece} · ${locataire.numPieceIdentite ?? ""}` : undefined} />
              <Row label="Délivrée le" value={fmt(locataire.dateDelivrance)} />
              <Row label="Expire le" value={fmt(locataire.dateExpirationPiece)} />
              <Row label="Autorité de délivrance" value={locataire.autoriteDelivrance} />
              <Row label="Situation professionnelle" value={locataire.situationProfessionnelle} />
            </dl>
          )}
        </Carte>
      </div>

      {verification && statutVerification && (
        <Carte titre="Vérification d'identité" actions={<StatusBadge tone={statutVerification.tone}>{statutVerification.label}</StatusBadge>}>
          {verification.statut === "REJECTED" && verification.motifRejet && (
            <p className="mb-4 rounded-control bg-soleil-100 p-4 text-body-m text-encre">
              <span className="font-semibold">Motif du refus : </span>
              {verification.motifRejet}
            </p>
          )}

          {documents.length > 0 && (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {documents.map((doc) => (
                <li key={doc.alt}>
                  <button
                    type="button"
                    onClick={() => setLightboxImage(doc)}
                    aria-label={`Agrandir : ${doc.alt}`}
                    className="block aspect-[4/3] w-full overflow-hidden rounded-control border border-filet bg-surface"
                  >
                    <img src={doc.src} alt="" className="size-full object-contain" />
                  </button>
                  <p className="mt-1 text-caption text-texte2">{doc.alt}</p>
                </li>
              ))}
            </ul>
          )}

          {verification.statut === "PENDING" && (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Button variant="outline" onClick={() => setShowRejectModal(true)}>
                Refuser
              </Button>
              <Button onClick={() => setShowVerifyModal(true)}>
                <ClipboardCheck aria-hidden />
                Examiner et valider
              </Button>
            </div>
          )}
        </Carte>
      )}

      {locataire.bails && locataire.bails.length > 0 && (
        <Carte titre={`Baux · ${locataire.bails.length}`}>
          <ul className="divide-y divide-filet">
            {locataire.bails.map((bail) => {
              const statut = BAIL_STATUT[bail.statut] ?? { label: bail.statut, tone: "neutre" as const };
              return (
                <li key={bail.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="grid grid-cols-[1fr_auto] items-start gap-3">
                    <Link to={`/owner/biens/${bail.bien?.id}`} className="min-w-0 text-body-l font-semibold text-encre hover:text-baobab hover:underline">
                      {bail.bien?.titre || bail.bien?.ville || "Bien"}
                    </Link>
                    <StatusBadge tone={statut.tone} size="sm">
                      {statut.label}
                    </StatusBadge>
                  </div>
                  <p className="mt-1 text-body-m text-texte2">
                    {bail.dateFinBail ? `Du ${fmt(bail.dateDebutBail)} au ${fmt(bail.dateFinBail)}` : `Depuis le ${fmt(bail.dateDebutBail)}, durée indéterminée`}
                    {" · "}
                    {formatFcfa(bail.montantLoyer)} / mois
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {bail.contrat && (
                      <Button size="sm" variant="outline" onClick={() => setSelectedBail(bail as unknown as Bail)}>
                        <FileText aria-hidden />
                        Voir le contrat
                      </Button>
                    )}
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/owner/bails/${bail.id}/etats-des-lieux`}>
                        <ClipboardCheck aria-hidden />
                        États des lieux
                      </Link>
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </Carte>
      )}

      <ConfirmModal
        open={confirmDelete}
        title="Supprimer ce locataire ?"
        message="La fiche sera définitivement supprimée. Cette action est irréversible."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="danger"
        isPending={deleteLocataire.isPending}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />

      {selectedBail && <ContratModal bail={selectedBail} onClose={() => setSelectedBail(null)} isCreationFlow={false} />}

      <SheetDialog
        open={showVerifyModal}
        onOpenChange={(open) => !open && !approveVerification.isPending && setShowVerifyModal(false)}
        title={`Vérifier l'identité de ${locataire.prenom} ${locataire.nom}`}
        description="Comparez les documents aux informations du compte, puis cochez chaque point."
      >
        <fieldset className="space-y-1">
          <legend className="mb-2 text-body-m font-semibold text-encre">Points à contrôler</legend>
          {POINTS_CHECKLIST.map(({ cle, libelle }) => (
            <label key={cle} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-control px-2 text-body-l text-encre hover:bg-surface">
              <input
                type="checkbox"
                checked={checklist[cle]}
                onChange={(e) => setChecklist((prev) => ({ ...prev, [cle]: e.target.checked }))}
                className="size-5 shrink-0 accent-baobab"
              />
              {libelle}
            </label>
          ))}
        </fieldset>
        {!allChecksPassed && (
          <p className="mt-3 text-body-m text-texte2">
            {nbPointsCoches} point{nbPointsCoches > 1 ? "s" : ""} sur {POINTS_CHECKLIST.length} : cochez-les tous pour valider.
          </p>
        )}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Button variant="outline" onClick={() => setShowVerifyModal(false)} disabled={approveVerification.isPending}>
            Annuler
          </Button>
          <Button onClick={handleApprove} disabled={!allChecksPassed || approveVerification.isPending}>
            {approveVerification.isPending ? <Loader2 aria-hidden className="animate-spin" /> : <CheckCircle aria-hidden />}
            Valider l'identité
          </Button>
        </div>
      </SheetDialog>

      <SheetDialog
        open={showRejectModal}
        onOpenChange={(open) => !open && !rejectVerification.isPending && fermerRejet()}
        title="Refuser la demande"
        description="Le locataire verra ce motif et pourra envoyer de nouveaux documents."
      >
        <fieldset>
          <legend className="mb-2 text-body-m font-semibold text-encre">Motif du refus</legend>
          <div className="space-y-1">
            {[...REJECTION_MOTIFS, "autre"].map((motif) => (
              <label
                key={motif}
                className={cn(
                  "flex min-h-12 cursor-pointer items-center gap-3 rounded-control px-2 text-body-l text-encre hover:bg-surface",
                  selectedMotif === motif && "bg-baobab-100 hover:bg-baobab-100",
                )}
              >
                <input
                  type="radio"
                  name="motif"
                  value={motif}
                  checked={selectedMotif === motif}
                  onChange={(e) => {
                    setSelectedMotif(e.target.value);
                    setErreurMotif(undefined);
                  }}
                  className="size-5 shrink-0 accent-baobab"
                />
                {motif === "autre" ? "Autre motif" : motif}
              </label>
            ))}
          </div>
          {selectedMotif !== "autre" && erreurMotif && <FieldError id="erreur-motif-refus">{erreurMotif}</FieldError>}
        </fieldset>
        {selectedMotif === "autre" && (
          <div className="mt-4">
            <FormField label="Précisez le motif" error={erreurMotif}>
              <Input value={customMotif} onChange={(e) => setCustomMotif(e.target.value)} placeholder="Exemple : la photo est floue" autoFocus />
            </FormField>
          </div>
        )}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Button variant="outline" onClick={fermerRejet} disabled={rejectVerification.isPending}>
            Annuler
          </Button>
          <Button variant="encre" onClick={handleReject} disabled={rejectVerification.isPending}>
            {rejectVerification.isPending && <Loader2 aria-hidden className="animate-spin" />}
            Refuser la demande
          </Button>
        </div>
      </SheetDialog>

      <SheetDialog
        open={Boolean(lightboxImage)}
        onOpenChange={(open) => !open && setLightboxImage(null)}
        title={lightboxImage?.alt ?? "Document"}
        className="sm:max-w-3xl"
      >
        {lightboxImage && <img src={lightboxImage.src} alt={lightboxImage.alt} className="max-h-[70vh] w-full rounded-control object-contain" />}
      </SheetDialog>
    </div>
  );
}

// ─── Row helper ───────────────────────────────────────────────────────────────

const Row = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="grid grid-cols-[1fr_auto] gap-4 py-2.5">
    <dt className="text-texte2">{label}</dt>
    <dd className="text-right font-semibold text-encre">{value || "Non renseigné"}</dd>
  </div>
);
