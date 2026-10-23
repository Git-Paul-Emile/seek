import { referenceBien } from "@/lib/referenceBien";
import React, { useState, type ReactNode } from "react";
import { SkDetailSections } from "@/components/ui/Skeleton";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  ArrowLeft,
  ArrowUpDown,
  BadgeCheck,
  Bell,
  CalendarPlus,
  ChevronDown,
  ClipboardCheck,
  Cigarette,
  Download,
  Edit,
  ExternalLink,
  Eye,
  FileText,
  Heart,
  History,
  Image,
  Info,
  Loader2,
  MapPin,
  ParkingSquare,
  PawPrint,
  Phone,
  RefreshCcw,
  RotateCcw,
  Send,
  Sofa,
  Trash2,
  UploadCloud,
  UserPlus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useBienById } from "@/hooks/useBien";
import { useLocataires } from "@/hooks/useLocataire";
import { useDeleteBien, useRetourBrouillon, useAnnulerAnnonce, useSoumettreBien } from "@/hooks/useBien";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { EmptyState } from "@/components/brand/EmptyState";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/NativeSelect";
import { SheetDialog } from "@/components/ui/SheetDialog";
import { StatusBadge, type StatusTone } from "@/components/ui/StatusBadge";
import type { StatutAnnonce } from "@/api/bien";
import {
  useBailActif, useTerminerBail, useResilierBail, useProlongerBail,
  useEcheancier, useCaution, useRestituerCaution,
  useBailAArchiver, useMettreEnPreavis, useMettreEnRenouvellement, useArchiverBail,
  useHistoriqueBails, useMessagesBailOwner, useMarquerMessagesBailOwnerLus,
} from "@/hooks/useBail";
import BailForm from "./BailForm";
import ContratModal from "./ContratModal";
import PremiumPayment from "@/components/owner/PremiumPayment";
import { generateQuittancePDF } from "@/lib/generateQuittance";
import { useEnvoyerRappel } from "@/hooks/useQuittance";
import { useOwnerAuth } from "@/context/OwnerAuthContext";
import { useDocumentsBien, useUploadDocumentBien, useDeleteDocumentBien } from "@/hooks/useDocumentBien";
import { useStatsFavorisBien } from "@/hooks/useBien";
import { formatDateLongue } from "@/lib/dates";
import { messageErreurApi } from "@/lib/erreurApi";
import { formatFcfa, libelleFrequence } from "@/lib/fcfa";
import { cn } from "@/lib/utils";

// Fiche d'un bien côté propriétaire : annonce (photos, caractéristiques, équipements), puis
// dans la colonne latérale le bail en cours, le suivi des loyers, la mise en avant et les documents.

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUT_ANNONCE: Record<StatutAnnonce, { label: string; tone: StatusTone }> = {
  BROUILLON: { label: "Brouillon", tone: "neutre" },
  EN_ATTENTE: { label: "En attente", tone: "attente" },
  PUBLIE: { label: "Publiée", tone: "positif" },
  REJETE: { label: "Refusée", tone: "alerte" },
  ANNULE: { label: "Annulée", tone: "arret" },
};

const BAIL_STATUT: Record<string, { label: string; tone: StatusTone }> = {
  ACTIF: { label: "Actif", tone: "positif" },
  EN_PREAVIS: { label: "En préavis", tone: "alerte" },
  EN_RENOUVELLEMENT: { label: "En renouvellement", tone: "attente" },
  TERMINE: { label: "Terminé", tone: "arret" },
  RESILIE: { label: "Résilié", tone: "arret" },
  ARCHIVE: { label: "Archivé", tone: "neutre" },
};

const CAUTION_STATUT: Record<string, { label: string; tone: StatusTone }> = {
  RECU: { label: "Reçue", tone: "positif" },
  RESTITUE: { label: "Restituée", tone: "neutre" },
  PARTIELLEMENT_RESTITUE: { label: "Restituée en partie", tone: "attente" },
  RETENU: { label: "Retenue", tone: "alerte" },
};

const STATUT_ECHEANCE: Record<string, { label: string; tone: StatusTone }> = {
  A_VENIR: { label: "À venir", tone: "neutre" },
  EN_ATTENTE: { label: "En attente", tone: "attente" },
  EN_RETARD: { label: "En retard", tone: "alerte" },
  EN_ATTENTE_CONFIRMATION: { label: "À confirmer", tone: "attente" },
  PAYE: { label: "Payé", tone: "positif" },
  ANNULE: { label: "Annulé", tone: "arret" },
};

const MOTIFS_RESILIATION = [
  "Impayés de loyer",
  "Violation des conditions du contrat",
  "Usage illégal du logement",
  "Dégradations importantes",
  "Vente du bien",
  "Reprise pour usage personnel",
  "Travaux importants",
  "Autre",
];

function Section({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <section aria-label={title} className="rounded-card bg-white p-5 lg:p-6">
      <div className="mb-4 grid grid-cols-[1fr_auto] items-center gap-3">
        <h2 className="font-display text-h3 font-bold text-encre">{title}</h2>
        {actions}
      </div>
      {children}
    </section>
  );
}

const joursRetard = (dateEcheance: string) =>
  Math.max(0, Math.floor((Date.now() - new Date(dateEcheance).getTime()) / 86400000));

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null;
  return (
    <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-filet py-2.5 text-body-m last:border-0">
      <dt className="text-texte2">{label}</dt>
      <dd className="text-right font-semibold text-encre">{value}</dd>
    </div>
  );
}

function CarteLocataire({ to, prenom, nom, telephone, badge }: { to: string; prenom: string; nom: string; telephone: string; badge?: ReactNode }) {
  return (
    <Link to={to} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-control bg-surface p-3 transition-colors duration-hover hover:bg-baobab-100">
      <span aria-hidden className="flex size-11 items-center justify-center rounded-full bg-baobab-100 text-body-m font-bold text-baobab">
        {prenom[0]}
        {nom[0]}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-body-l font-semibold text-encre">
          {prenom} {nom}
        </span>
        <span className="flex items-center gap-1 text-body-m text-texte2">
          <Phone aria-hidden className="size-3.5" />
          {telephone}
        </span>
      </span>
      {badge}
    </Link>
  );
}

function Avis({ tone = "soleil", icone, children }: { tone?: "soleil" | "baobab"; icone: ReactNode; children: ReactNode }) {
  return (
    <div className={cn("grid grid-cols-[auto_1fr] items-start gap-3 rounded-control p-3 text-body-m text-encre", tone === "soleil" ? "bg-soleil-100" : "bg-baobab-100")}>
      {icone}
      <p>{children}</p>
    </div>
  );
}

function TuileChoix({ name, choisi, onChoisir, children }: { name: string; choisi: boolean; onChoisir: () => void; children: ReactNode }) {
  return (
    <label
      className={cn(
        "flex min-h-12 cursor-pointer items-center gap-3 rounded-control border bg-white px-3 py-2",
        choisi ? "border-2 border-baobab px-[11px] py-[7px] text-baobab" : "border-filet text-encre",
      )}
    >
      <input type="radio" name={name} checked={choisi} onChange={onChoisir} className="size-5 accent-baobab" />
      <span className="font-semibold">{children}</span>
    </label>
  );
}

// ─── Documents Bien ───────────────────────────────────────────────────────────

const DOC_TYPES = [
  { value: "ACTE_PROPRIETE", label: "Acte de propriété" },
  { value: "PLAN_CADASTRAL", label: "Plan cadastral" },
  { value: "PERMIS_CONSTRUIRE", label: "Permis de construire" },
  { value: "AUTRE", label: "Autre" },
];

function DocumentsBienSection({ bienId }: { bienId: string }) {
  const { data: documents = [], isLoading } = useDocumentsBien(bienId);
  const upload = useUploadDocumentBien(bienId);
  const remove = useDeleteDocumentBien(bienId);
  const [docType, setDocType] = useState("ACTE_PROPRIETE");
  const [aSupprimer, setASupprimer] = useState<{ id: string; nom: string } | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Choisissez un fichier PDF : les autres formats ne sont pas acceptés.");
      e.target.value = "";
      return;
    }
    upload.mutate(
      { file, type: docType },
      {
        onSuccess: () => toast.success("Document ajouté"),
        onError: (error) => toast.error(messageErreurApi(error, "Le document n'a pas pu être ajouté. Réessayez.")),
      },
    );
    e.target.value = "";
  };

  const supprimer = () => {
    if (!aSupprimer) return;
    remove.mutate(aSupprimer.id, {
      onSuccess: () => setASupprimer(null),
      onError: (error) => {
        toast.error(messageErreurApi(error, "Le document n'a pas pu être supprimé. Réessayez."));
        setASupprimer(null);
      },
    });
  };

  return (
    <Section title="Documents">
      {isLoading ? (
        <Loader2 aria-label="Chargement" className="mx-auto size-5 animate-spin text-baobab" />
      ) : documents.length === 0 ? (
        <p className="text-body-m text-texte2">Aucun document pour l'instant. Ajoutez l'acte de propriété ou le plan au format PDF.</p>
      ) : (
        <ul className="divide-y divide-filet">
          {documents.map((doc) => (
            <li key={doc.id} className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-2 py-2">
              <FileText aria-hidden className="size-5 text-texte2" />
              <span className="min-w-0">
                <span className="block truncate text-body-m font-semibold text-encre">{doc.nom}</span>
                <span className="block text-caption text-texte2">{DOC_TYPES.find((t) => t.value === doc.type)?.label ?? doc.type}</span>
              </span>
              <Button asChild variant="ghost" size="icon-sm">
                <a href={doc.url} target="_blank" rel="noopener noreferrer" aria-label={`Ouvrir ${doc.nom}`}>
                  <ExternalLink aria-hidden />
                </a>
              </Button>
              <Button variant="ghost" size="icon-sm" aria-label={`Supprimer ${doc.nom}`} onClick={() => setASupprimer({ id: doc.id, nom: doc.nom })}>
                <Trash2 aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 space-y-3 border-t border-filet pt-4">
        <FormField label="Type de document">
          <NativeSelect value={docType} onChange={(e) => setDocType(e.target.value)}>
            {DOC_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </NativeSelect>
        </FormField>
        <label
          className={cn(
            "flex h-12 cursor-pointer items-center justify-center gap-2 rounded-control border border-dashed border-bord-champ text-body-m font-semibold text-baobab transition-colors duration-hover hover:bg-baobab-100 focus-within:outline focus-within:outline-2 focus-within:outline-ring",
            upload.isPending && "pointer-events-none text-texte2",
          )}
        >
          <input type="file" accept="application/pdf" onChange={handleFile} className="sr-only" disabled={upload.isPending} />
          {upload.isPending ? <Loader2 aria-hidden className="size-5 animate-spin" /> : <UploadCloud aria-hidden className="size-5" />}
          {upload.isPending ? "Envoi en cours" : "Ajouter un PDF"}
        </label>
      </div>

      <ConfirmModal
        open={Boolean(aSupprimer)}
        title="Supprimer ce document ?"
        message={`« ${aSupprimer?.nom ?? ""} » sera définitivement supprimé.`}
        confirmLabel="Supprimer"
        isPending={remove.isPending}
        onConfirm={supprimer}
        onCancel={() => setASupprimer(null)}
      />
    </Section>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function BienDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: bien, isLoading, isError } = useBienById(id ?? "");
  const { data: locataires = [] } = useLocataires();
  const deleteMutation = useDeleteBien();
  const retour = useRetourBrouillon();
  const annuler = useAnnulerAnnonce();
  const soumettre = useSoumettreBien();

  const isLocation = bien?.typeTransaction?.slug === "location";
  const { data: bail, refetch: refetchBail } = useBailActif(
    isLocation ? (id ?? "") : ""
  );
  const { data: messagesBail = [] } = useMessagesBailOwner();
  const marquerLus = useMarquerMessagesBailOwnerLus();
  const messagesBailBien = messagesBail.filter(
    (m) => m.bienId === bien?.id && !m.lu && m.type !== "CONFIRMATION_ESPECES"
  );

  const terminer = useTerminerBail();
  const resilier = useResilierBail();
  const prolonger = useProlongerBail();
  const mettreEnPreavis = useMettreEnPreavis();
  const mettreEnRenouvellement = useMettreEnRenouvellement();
  const archiver = useArchiverBail();

  // Bail à archiver (TERMINE/RESILIE) - chargé uniquement si pas de bail actif
  const { data: bailAArchiver } = useBailAArchiver(
    isLocation && !bail ? (id ?? "") : ""
  );

  // Historique des baux
  const { data: historiqueBails = [] } = useHistoriqueBails(isLocation ? (id ?? "") : "");
  const [historiqueOpen, setHistoriqueOpen] = useState(false);

  // Suivi financier - chargé uniquement si bail actif
  const { data: echeancier = [] } = useEcheancier(id ?? "", bail?.id ?? "");
  const { data: caution } = useCaution(id ?? "", bail?.id ?? "");
  const restituerCaution = useRestituerCaution();
  const envoyerRappel = useEnvoyerRappel();
  const { owner } = useOwnerAuth();
  const queryClient = useQueryClient();
  const { data: statsFavoris } = useStatsFavorisBien(id);

  const [photoIndex, setPhotoIndex] = useState(0);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [retourOpen, setRetourOpen] = useState(false);
  const [annulerOpen, setAnnulerOpen] = useState(false);
  const [showBailForm, setShowBailForm] = useState(false);
  const [showNote, setShowNote] = useState(true);
  React.useEffect(() => {
    const t = setTimeout(() => setShowNote(false), 8000);
    return () => clearTimeout(t);
  }, []);
  const [showContratModal, setShowContratModal] = useState(false);
  const [activeBailForContrat, setActiveBailForContrat] = useState<typeof bail | null>(null);
  const [isContratCreationFlow, setIsContratCreationFlow] = useState(false);
  const [terminerOpen, setTerminerOpen] = useState(false);
  const [resilierOpen, setResilierOpen] = useState(false);
  const [resilierMotif, setResilierMotif] = useState("");
  const [prolongerOpen, setProlongerOpen] = useState(false);
  const [prolongerDuree, setProlongerDuree] = useState<6 | 12 | null>(null);
  const [restituerOpen, setRestituerOpen] = useState(false);
  const [restituerMontant, setRestituerMontant] = useState("");
  const [restituerMotif, setRestituerMotif] = useState("");
  const [echeancierExpanded, setEcheancierExpanded] = useState(false);
  const [preavisOpen, setPreavisOpen] = useState(false);
  const [renouvellementOpen, setRenouvellementOpen] = useState(false);
  const [archiverOpen, setArchiverOpen] = useState(false);
  const [archiverRestituerMontant, setArchiverRestituerMontant] = useState("");
  const [archiverRestituerMotif, setArchiverRestituerMotif] = useState("");
  const [erreurArchiverMontant, setErreurArchiverMontant] = useState<string>();
  const [rappelEnCours, setRappelEnCours] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-5">
        <SkDetailSections sections={5} />
      </div>
    );
  }

  if (isError || !bien) {
    return (
      <EmptyState
        titreNiveau="h1"
        titre="Bien introuvable"
        texte="Ce bien n'existe plus ou ne vous appartient pas."
        action={
          <Button asChild>
            <Link to="/owner/biens">Retour à mes biens</Link>
          </Button>
        }
      />
    );
  }

  const photos = bien.photos ?? [];
  const statut = bien.statutAnnonce;
  const etatsDesLieux = bail?.etatsDesLieux ?? [];
  const hasEdlEntreeValide = etatsDesLieux.some((edl) => edl.type === "ENTREE" && edl.statut === "VALIDE");
  const hasEdlSortieValide = etatsDesLieux.some((edl) => edl.type === "SORTIE" && edl.statut === "VALIDE");
  const canRestituerCaution = hasEdlEntreeValide && hasEdlSortieValide;
  const etatsDesLieuxHref = bail
    ? etatsDesLieux.length
      ? `/owner/bails/${bail.id}/etats-des-lieux`
      : `/owner/bails/${bail.id}/etats-des-lieux/creer?type=ENTREE`
    : "#";

  const options = [
    { label: "Meublé",    value: bien.meuble,    icon: Sofa },
    { label: "Fumeurs",   value: bien.fumeurs,   icon: Cigarette },
    { label: "Animaux",   value: bien.animaux,   icon: PawPrint },
    { label: "Parking",   value: bien.parking,   icon: ParkingSquare },
    { label: "Ascenseur", value: bien.ascenseur, icon: ArrowUpDown },
  ].filter((o) => o.value);

  const caracteristiques = [
    { label: "Surface", value: bien.surface ? `${bien.surface} m²` : null },
    { label: "Chambres", value: bien.nbChambres },
    { label: "Salles de bain", value: bien.nbSdb },
    { label: "Salons", value: bien.nbSalons },
    { label: "Cuisines", value: bien.nbCuisines },
    { label: "WC", value: bien.nbWc },
    { label: "Étage", value: bien.etage },
    { label: "Nombre d'étages", value: bien.nbEtages },
  ].filter((c) => c.value !== null && c.value !== undefined);

  const hasEquipements = bien.equipements && bien.equipements.length > 0;
  const hasMeubles = bien.meubles && bien.meubles.length > 0;
  const bauxTermines = historiqueBails
    .filter((b) => b.statut === "TERMINE" || b.statut === "RESILIE" || b.statut === "ARCHIVE")
    .sort((a, b) => new Date(b.dateDebutBail).getTime() - new Date(a.dateDebutBail).getTime());

  // EN_ATTENTE: Annuler la soumission (→ BROUILLON, pas modifier)
  // PUBLIE: Modifier + Dépublier + Supprimer
  // BROUILLON/REJETE: Modifier + Annuler l'annonce (= suppression définitive)
  const canEdit    = statut === "BROUILLON" || statut === "REJETE" || statut === "PUBLIE";
  const canDelete  = statut === "PUBLIE";
  const canRetour  = statut === "EN_ATTENTE" || statut === "PUBLIE";
  const canAnnuler = statut === "BROUILLON" || statut === "REJETE";
  const retourLabel = statut === "EN_ATTENTE" ? "Annuler la soumission" : "Dépublier";
  const retourMessage =
    statut === "EN_ATTENTE"
      ? "L'annonce sera remise en brouillon et retirée de la file d'attente."
      : "L'annonce sera dépubliée et remise en brouillon. Elle ne sera plus visible.";

  const statutAnnonce = STATUT_ANNONCE[statut];
  const cautionAArchiver = bailAArchiver?.montantCaution ?? 0;
  const frequence = libelleFrequence(bien.frequencePaiement) ?? bien.frequencePaiement;

  const relancer = (echeanceId: string) => {
    if (!bail) return;
    setRappelEnCours(echeanceId);
    envoyerRappel.mutate(
      { bienId: id!, bailId: bail.id, echeanceId },
      {
        onSuccess: () => toast.success("Relance envoyée au locataire par SMS et e-mail"),
        onError: (error) => toast.error(messageErreurApi(error, "La relance n'est pas partie. Réessayez dans un instant.")),
        onSettled: () => setRappelEnCours(null),
      },
    );
  };

  return (
    <div className="space-y-5">

      {/* Alertes messages bail */}
      {messagesBailBien.length > 0 && (
        <ul className="space-y-2">
          {messagesBailBien.map((msg) => (
            <li
              key={msg.id}
              className={cn(
                "grid grid-cols-[auto_1fr_auto] items-start gap-3 rounded-card p-4 text-encre",
                msg.type === "FIN_BAIL" ? "bg-surface" : "bg-soleil-100",
              )}
            >
              <Bell aria-hidden className="mt-0.5 size-5" />
              <div className="min-w-0">
                <p className="text-body-l font-semibold">{msg.titre}</p>
                <p className="mt-0.5 text-body-m">{msg.corps}</p>
                <p className="mt-1 text-caption text-texte2">{formatDateLongue(msg.createdAt)}</p>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={() => marquerLus.mutate()} aria-label="Marquer comme lu">
                <X aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {/* En-tête */}
      <div className="grid grid-cols-1 items-end gap-4 lg:grid-cols-[1fr_auto]">
        <div className="min-w-0">
          <Link to="/owner/biens" className="inline-flex items-center gap-1 text-body-m font-semibold text-baobab hover:underline">
            <ArrowLeft aria-hidden className="size-4" />
            Mes biens
          </Link>
          <h1 className="mt-1 break-words font-display text-h2 font-bold text-encre lg:text-h1">
            {bien.titre || "Annonce sans titre"}
          </h1>
          <p className="font-mono text-ref text-texte2">Réf. {referenceBien(bien.id)}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone={statutAnnonce.tone}>{statutAnnonce.label}</StatusBadge>
          {statut === "BROUILLON" && (
            <Button
              size="sm"
              variant="soleil"
              onClick={() => soumettre.mutate(bien.id, {
                onSuccess: () => toast.success("Annonce envoyée en vérification"),
                onError: (error) => toast.error(messageErreurApi(error, "L'annonce n'a pas pu être envoyée. Réessayez.")),
              })}
              disabled={soumettre.isPending}
            >
              {soumettre.isPending ? <Loader2 aria-hidden className="animate-spin" /> : <Send aria-hidden />}
              Soumettre
            </Button>
          )}
          {canEdit && (
            <Button asChild size="sm">
              <Link to={`/owner/biens/ajouter?edit=${bien.id}`}>
                <Edit aria-hidden />
                Modifier
              </Link>
            </Button>
          )}
          {canRetour && (
            <Button size="sm" variant="outline" onClick={() => setRetourOpen(true)} disabled={retour.isPending}>
              <RotateCcw aria-hidden />
              {retourLabel}
            </Button>
          )}
          {canAnnuler && (
            <Button size="sm" variant="outline" onClick={() => setAnnulerOpen(true)} disabled={annuler.isPending}>
              <Trash2 aria-hidden />
              Supprimer l'annonce
            </Button>
          )}
          {canDelete && (
            <Button size="sm" variant="ghost" onClick={() => setDeleteOpen(true)}>
              <Trash2 aria-hidden />
              Supprimer
            </Button>
          )}
        </div>
      </div>

      {/* Note de rejet */}
      {showNote && statut === "REJETE" && bien.noteAdmin && (
        <div className="grid grid-cols-[auto_1fr_auto] items-start gap-3 rounded-card bg-soleil-100 p-4 text-encre">
          <Info aria-hidden className="mt-0.5 size-5" />
          <div className="min-w-0 text-body-m">
            <p className="font-semibold">Motif du refus</p>
            <p>{bien.noteAdmin}</p>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={() => setShowNote(false)} aria-label="Masquer le motif">
            <X aria-hidden />
          </Button>
        </div>
      )}

      {/* Stats vues & favoris */}
      {statut === "PUBLIE" && (
        <dl className="grid grid-cols-2 gap-3 sm:max-w-md">
          <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 rounded-card bg-white p-4">
            <Eye aria-hidden className="row-span-2 size-5 text-baobab" />
            <dd className="text-h3 font-bold text-encre">{(bien.nbVues ?? 0).toLocaleString("fr-FR")}</dd>
            <dt className="text-body-m text-texte2">vue{(bien.nbVues ?? 0) > 1 ? "s" : ""}</dt>
          </div>
          <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 rounded-card bg-white p-4">
            <Heart aria-hidden className="row-span-2 size-5 text-baobab" />
            <dd className="text-h3 font-bold text-encre">{(statsFavoris?.favorisTotaux ?? 0).toLocaleString("fr-FR")}</dd>
            <dt className="text-body-m text-texte2">favori{(statsFavoris?.favorisTotaux ?? 0) > 1 ? "s" : ""}</dt>
          </div>
        </dl>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Colonne principale */}
        <div className="space-y-5 lg:col-span-2">
          {/* Galerie */}
          <Section title="Photos">
            {photos.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center rounded-control bg-surface text-texte2">
                <Image aria-hidden className="mb-2 size-8" />
                <p className="text-body-m">Aucune photo. Ajoutez-en en modifiant l'annonce.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative aspect-video overflow-hidden rounded-control bg-surface">
                  <img src={photos[photoIndex]} alt={`Photo ${photoIndex + 1} sur ${photos.length}`} className="size-full object-cover" />
                  <span className="absolute bottom-2 right-2 rounded-full bg-encre/70 px-2 py-0.5 text-caption text-white">
                    {photoIndex + 1} / {photos.length}
                  </span>
                </div>
                {photos.length > 1 && (
                  <ul className="flex flex-wrap gap-2">
                    {photos.map((url, i) => (
                      <li key={url}>
                        <button
                          type="button"
                          onClick={() => setPhotoIndex(i)}
                          aria-label={`Afficher la photo ${i + 1}`}
                          aria-current={i === photoIndex}
                          className={cn(
                            "h-12 w-16 overflow-hidden rounded-control border-2 transition-opacity duration-hover",
                            i === photoIndex ? "border-baobab" : "border-transparent opacity-60 hover:opacity-100",
                          )}
                        >
                          <img src={url} alt="" className="size-full object-cover" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </Section>

          {/* Description */}
          {bien.description && (
            <Section title="Description">
              <p className="whitespace-pre-wrap text-body-l text-encre">{bien.description}</p>
            </Section>
          )}

          {/* Caractéristiques */}
          <Section title="Caractéristiques">
            {caracteristiques.length > 0 ? (
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {caracteristiques.map(({ label, value }) => (
                  <div key={label} className="rounded-control bg-surface p-3">
                    <dt className="text-caption text-texte2">{label}</dt>
                    <dd className="text-body-l font-semibold text-encre">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-body-m text-texte2">Aucune caractéristique renseignée.</p>
            )}
            {options.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-2">
                {options.map(({ label, icon: Icon }) => (
                  <li key={label} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-baobab-100 px-3 text-body-m font-semibold text-baobab">
                    <Icon aria-hidden className="size-4" />
                    {label}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* Équipements & Mobilier en onglets */}
          <Section title="Équipements et mobilier">
            <Tabs defaultValue={hasEquipements ? "equipements" : "mobilier"} className="w-full">
              <TabsList className="h-auto w-full justify-start gap-1 rounded-control bg-surface p-1">
                <TabsTrigger
                  value="equipements"
                  className="h-10 gap-2 rounded-control px-4 text-body-m font-semibold text-texte2 data-[state=active]:bg-white data-[state=active]:text-encre data-[state=active]:shadow-none"
                >
                  <BadgeCheck aria-hidden className="size-4" />
                  Équipements
                </TabsTrigger>
                <TabsTrigger
                  value="mobilier"
                  className="h-10 gap-2 rounded-control px-4 text-body-m font-semibold text-texte2 data-[state=active]:bg-white data-[state=active]:text-encre data-[state=active]:shadow-none"
                >
                  <Sofa aria-hidden className="size-4" />
                  Mobilier
                </TabsTrigger>
              </TabsList>

              <TabsContent value="equipements" className="mt-4">
                {hasEquipements ? (
                  <ul className="flex flex-wrap gap-2">
                    {bien.equipements!.map((e) => (
                      <li key={e.equipementId} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-surface px-3 text-body-m text-encre">
                        <BadgeCheck aria-hidden className="size-4 text-baobab" />
                        {e.equipement.nom}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="py-4 text-center text-body-m text-texte2">Aucun équipement renseigné.</p>
                )}
              </TabsContent>

              <TabsContent value="mobilier" className="mt-4">
                {hasMeubles ? (
                  <ul className="flex flex-wrap gap-2">
                    {bien.meubles!.map((m) => (
                      <li key={m.meubleId} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-surface px-3 text-body-m text-encre">
                        <Sofa aria-hidden className="size-4 text-baobab" />
                        {m.meuble.nom} × {m.quantite}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="py-4 text-center text-body-m text-texte2">Aucun mobilier renseigné.</p>
                )}
              </TabsContent>
            </Tabs>
          </Section>
        </div>

        {/* Colonne latérale */}
        <div className="space-y-5">
          {/* Section Locataire - uniquement pour les biens en location */}
          {isLocation && (
            <Section title="Locataire actuel">
              {bail ? (() => {
                const statut = bail.statut;
                const daysUntilEnd = bail.dateFinBail
                  ? Math.ceil((new Date(bail.dateFinBail).getTime() - Date.now()) / 86400000)
                  : null;
                const approachingEnd = statut === "ACTIF" && daysUntilEnd !== null && daysUntilEnd <= 30 && daysUntilEnd >= 0;
                // Bailleur : préavis autorisé si pas de date de fin OU ≥ 6 mois restants
                const preavisOwnerAllowed = !bail.dateFinBail || (daysUntilEnd !== null && daysUntilEnd >= 180);
                const preavisOwnerReason = bail.dateFinBail && !preavisOwnerAllowed
                  ? `Le préavis demande au moins 6 mois. Le bail se termine le ${formatDateLongue(bail.dateFinBail)}.`
                  : null;
                const badge = BAIL_STATUT[statut];

                return (
                  <div className="space-y-4">
                    <CarteLocataire
                      to={`/owner/locataires/${bail.locataireId}`}
                      prenom={bail.locataire.prenom}
                      nom={bail.locataire.nom}
                      telephone={bail.locataire.telephone}
                      badge={badge && <StatusBadge tone={badge.tone} size="sm">{badge.label}</StatusBadge>}
                    />

                    {/* Alerte approche fin de bail */}
                    {approachingEnd && (
                      <Avis icone={<Bell aria-hidden className="mt-0.5 size-4" />}>
                        Le bail se termine dans <strong>{daysUntilEnd} jour{daysUntilEnd > 1 ? "s" : ""}</strong>. Mettez-le en préavis pour entamer la procédure de fin.
                      </Avis>
                    )}

                    {/* Alerte EN_PREAVIS */}
                    {statut === "EN_PREAVIS" && (
                      <Avis icone={<Bell aria-hidden className="mt-0.5 size-4" />}>
                        Bail en période de préavis.
                        {bail.dateFinBail && ` Fin prévue le ${formatDateLongue(bail.dateFinBail)}.`} Passez-le en renouvellement pour annuler le préavis, ou résiliez-le pour mettre fin au contrat.
                      </Avis>
                    )}

                    {/* Alerte EN_RENOUVELLEMENT */}
                    {statut === "EN_RENOUVELLEMENT" && (
                      <Avis tone="baobab" icone={<RefreshCcw aria-hidden className="mt-0.5 size-4 text-baobab" />}>
                        Renouvellement en cours. Prolongez le bail pour confirmer la nouvelle période.
                      </Avis>
                    )}

                    <dl>
                      {bail.typeBail && <InfoRow label="Type de bail" value={bail.typeBail} />}
                      <InfoRow label="Début du bail" value={formatDateLongue(bail.dateDebutBail)} />
                      {bail.dateFinBail && <InfoRow label="Fin du bail" value={formatDateLongue(bail.dateFinBail)} />}
                      <InfoRow label="Loyer" value={formatFcfa(bail.montantLoyer)} />
                      {bail.renouvellement && <InfoRow label="Renouvellement" value="Possible" />}
                    </dl>

                    {/* Actions bail - selon statut */}
                    <div className="grid gap-2">
                      <Button variant="outline" onClick={() => { setActiveBailForContrat(bail); setIsContratCreationFlow(false); setShowContratModal(true); }}>
                        <FileText aria-hidden />
                        Voir le contrat
                      </Button>

                      <Button asChild variant="outline">
                        <Link to={bail.etatsDesLieux?.length ? `/owner/bails/${bail.id}/etats-des-lieux` : `/owner/bails/${bail.id}/etats-des-lieux/creer?type=ENTREE`}>
                          <ClipboardCheck aria-hidden />
                          {bail.etatsDesLieux?.length ? "États des lieux" : "Faire l'état des lieux d'entrée"}
                        </Link>
                      </Button>

                      {/* Prolonger - disponible si ACTIF ou EN_RENOUVELLEMENT */}
                      {(statut === "ACTIF" || statut === "EN_RENOUVELLEMENT") && (
                        <Button variant="outline" onClick={() => { setProlongerDuree(null); setProlongerOpen(true); }}>
                          <CalendarPlus aria-hidden />
                          {statut === "EN_RENOUVELLEMENT" ? "Confirmer le renouvellement" : "Prolonger le bail"}
                        </Button>
                      )}

                      {/* Passer en renouvellement - EN_PREAVIS uniquement (règle du back) */}
                      {statut === "EN_PREAVIS" && (
                        <Button variant="outline" onClick={() => setRenouvellementOpen(true)}>
                          <RefreshCcw aria-hidden />
                          Passer en renouvellement
                        </Button>
                      )}

                      {/* Mettre en préavis - ACTIF uniquement, délai bailleur 6 mois */}
                      {statut === "ACTIF" && (
                        <div>
                          <Button className="w-full" variant="outline" onClick={() => preavisOwnerAllowed && setPreavisOpen(true)} disabled={!preavisOwnerAllowed}>
                            <Bell aria-hidden />
                            Mettre en préavis
                          </Button>
                          {preavisOwnerReason && <p className="mt-1 px-1 text-caption text-texte2">{preavisOwnerReason}</p>}
                        </div>
                      )}

                      {/* Résilier - ACTIF ou EN_PREAVIS, uniquement si date de fin définie */}
                      {(statut === "ACTIF" || statut === "EN_PREAVIS") && bail.dateFinBail && (
                        <Button variant="ghost" onClick={() => { setResilierMotif(""); setResilierOpen(true); }}>
                          Résilier le bail
                        </Button>
                      )}

                      {/* Terminer - bail sans date de fin, pour les baux indéterminés */}
                      {(statut === "ACTIF" || statut === "EN_PREAVIS" || statut === "EN_RENOUVELLEMENT") && !bail.dateFinBail && (
                        <Button variant="ghost" onClick={() => setTerminerOpen(true)}>
                          Terminer le bail
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })() : (
                <div className="py-2 text-center">
                  <p className="text-body-l font-semibold text-encre">Aucun locataire associé</p>
                  {statut !== "PUBLIE" ? (
                    <p className="mt-1 text-body-m text-texte2">Publiez le bien pour pouvoir associer un locataire.</p>
                  ) : bien.statutBien?.slug !== "libre" ? (
                    <p className="mt-1 text-body-m text-texte2">
                      Le bien doit être au statut <strong className="text-encre">Libre</strong> pour associer un locataire.
                    </p>
                  ) : (
                    <Button
                      className="mt-4"
                      onClick={() => {
                        if (locataires.length === 0) {
                          toast.error("Aucun locataire pour l'instant. Créez d'abord la fiche du locataire.");
                          return;
                        }
                        setShowBailForm(true);
                      }}
                    >
                      <UserPlus aria-hidden />
                      Associer un locataire
                    </Button>
                  )}
                </div>
              )}
            </Section>
          )}

          {isLocation && !bail && bailAArchiver && (
            <Section title="Bail à archiver">
              <div className="space-y-4">
                <CarteLocataire
                  to={`/owner/locataires/${bailAArchiver.locataireId}`}
                  prenom={bailAArchiver.locataire.prenom}
                  nom={bailAArchiver.locataire.nom}
                  telephone={bailAArchiver.locataire.telephone}
                  badge={
                    <StatusBadge tone="arret" size="sm">
                      {bailAArchiver.statut === "RESILIE" ? "Résilié" : "Terminé"}
                    </StatusBadge>
                  }
                />
                <dl>
                  <InfoRow label="Début" value={formatDateLongue(bailAArchiver.dateDebutBail)} />
                  {bailAArchiver.dateFinBail && <InfoRow label="Fin" value={formatDateLongue(bailAArchiver.dateFinBail)} />}
                  <InfoRow label="Loyer" value={formatFcfa(bailAArchiver.montantLoyer)} />
                </dl>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => {
                    setArchiverRestituerMontant("");
                    setArchiverRestituerMotif("");
                    setErreurArchiverMontant(undefined);
                    setArchiverOpen(true);
                  }}
                >
                  <Archive aria-hidden />
                  Archiver le bail
                </Button>
              </div>
            </Section>
          )}

          {/* Historique des baux */}
          {isLocation && bauxTermines.length > 0 && (
            <section aria-label="Historique des baux" className="rounded-card bg-white p-5 lg:p-6">
              <button
                type="button"
                onClick={() => setHistoriqueOpen((prev) => !prev)}
                aria-expanded={historiqueOpen}
                className="grid min-h-12 w-full grid-cols-[1fr_auto] items-center gap-3 text-left"
              >
                <span>
                  <span className="block font-display text-h3 font-bold text-encre">Historique des baux</span>
                  <span className="block text-body-m text-texte2">
                    {bauxTermines.length} bail{bauxTermines.length > 1 ? "s" : ""} terminé{bauxTermines.length > 1 ? "s" : ""}
                  </span>
                </span>
                <ChevronDown aria-hidden className={cn("size-5 text-texte2 transition-transform duration-tab", historiqueOpen && "rotate-180")} />
              </button>

              {historiqueOpen && (
                <ul className="mt-4 divide-y divide-filet">
                  {bauxTermines.map((b) => {
                    const st = BAIL_STATUT[b.statut] ?? { label: b.statut, tone: "neutre" as const };
                    return (
                      <li key={b.id} className="py-3">
                        <div className="grid grid-cols-[1fr_auto] items-center gap-3">
                          <Link to={`/owner/locataires/${b.locataireId}`} className="truncate text-body-m font-semibold text-encre hover:text-baobab hover:underline">
                            {b.locataire.prenom} {b.locataire.nom}
                          </Link>
                          <StatusBadge tone={st.tone} size="sm">
                            {st.label}
                          </StatusBadge>
                        </div>
                        <p className="mt-1 text-body-m text-texte2">
                          {formatDateLongue(b.dateDebutBail)}
                          {b.dateFinBail && ` au ${formatDateLongue(b.dateFinBail)}`} · {formatFcfa(b.montantLoyer)}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          )}

          {/* Suivi financier - uniquement si bail actif */}
          {bail && (
            <Section
              title="Loyers"
              actions={
                <Button asChild size="sm" variant="ghost">
                  <Link to={`/owner/biens/${id}/paiements`}>
                    <History aria-hidden />
                    Tout voir
                  </Link>
                </Button>
              }
            >
              <div className="space-y-5">
                {/* Caution */}
                {caution && (() => {
                  const st = CAUTION_STATUT[caution.statut] ?? { label: caution.statut, tone: "neutre" as const };
                  return (
                    <div className="rounded-control bg-surface p-4">
                      <div className="grid grid-cols-[1fr_auto] items-center gap-3">
                        <span className="text-body-m font-semibold text-encre">Caution</span>
                        <StatusBadge tone={st.tone} size="sm">
                          {st.label}
                        </StatusBadge>
                      </div>
                      <div className="mt-2 grid grid-cols-[1fr_auto] items-center gap-3">
                        <span className="text-price font-bold text-encre">{formatFcfa(caution.montant)}</span>
                        {caution.statut === "RECU" && (
                          <Button size="sm" variant="outline" onClick={() => { setRestituerMontant(String(caution.montant)); setRestituerOpen(true); }}>
                            Restituer
                          </Button>
                        )}
                      </div>
                      {caution.montantRestitue != null && <p className="mt-1 text-body-m text-texte2">Restitué : {formatFcfa(caution.montantRestitue)}</p>}
                    </div>
                  );
                })()}

                {/* Échéancier */}
                {echeancier.length > 0 && (() => {
                  const total   = echeancier.length;
                  const payes   = echeancier.filter(e => e.statut === "PAYE").length;
                  const retards = echeancier.filter(e => e.statut === "EN_RETARD").length;
                  const avenir  = echeancier.filter(e => e.statut === "A_VENIR").length;

                  // Tri : EN_RETARD → EN_ATTENTE → A_VENIR → PAYE
                  const ORDER: Record<string, number> = { EN_RETARD: 0, EN_ATTENTE: 1, A_VENIR: 2, PAYE: 3, ANNULE: 4 };
                  const sorted = [...echeancier].sort((a, b) =>
                    (ORDER[a.statut] ?? 9) - (ORDER[b.statut] ?? 9) ||
                    new Date(a.dateEcheance).getTime() - new Date(b.dateEcheance).getTime()
                  );
                  const visible = echeancierExpanded ? sorted : sorted.slice(0, 4);
                  const progression = total > 0 ? Math.round((payes / total) * 100) : 0;

                  return (
                    <div>
                      <p className="text-body-m text-texte2">
                        {[`${payes} sur ${total} payés`, retards > 0 ? `${retards} en retard` : null, avenir > 0 ? `${avenir} à venir` : null].filter(Boolean).join(" · ")}
                      </p>
                      <div
                        role="progressbar"
                        aria-label="Loyers payés"
                        aria-valuenow={progression}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        className="mt-2 h-2 overflow-hidden rounded-full bg-surface"
                      >
                        <div className="h-full rounded-full bg-baobab" style={{ width: `${progression}%` }} />
                      </div>

                      <ul className="mt-3 divide-y divide-filet">
                        {visible.map((ech) => {
                          const cfg = STATUT_ECHEANCE[ech.statut] ?? STATUT_ECHEANCE.A_VENIR;
                          const peutRelancer = ech.statut === "EN_RETARD" || ech.statut === "EN_ATTENTE";
                          const peutTelecharger = ech.statut === "PAYE" && Boolean(ech.datePaiement);
                          return (
                            <li key={ech.id} className="grid grid-cols-[1fr_auto] items-center gap-3 py-3">
                              <div className="min-w-0">
                                <p className="text-body-m font-semibold text-encre">{formatDateLongue(ech.dateEcheance)}</p>
                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                  <StatusBadge tone={cfg.tone} size="sm">
                                    {ech.statut === "EN_RETARD" ? `${cfg.label} · ${joursRetard(ech.dateEcheance)} j` : cfg.label}
                                  </StatusBadge>
                                  <span className="text-body-m text-texte2">{formatFcfa(ech.montant)}</span>
                                </div>
                                {ech.statut === "PAYE" && ech.sourceEnregistrement && (
                                  <p className="mt-1 text-caption text-texte2">Enregistré par {ech.sourceEnregistrement === "LOCATAIRE" ? "le locataire" : "vous"}</p>
                                )}
                              </div>
                              {peutRelancer && (
                                <Button size="sm" variant="outline" onClick={() => relancer(ech.id)} disabled={rappelEnCours !== null}>
                                  {rappelEnCours === ech.id ? <Loader2 aria-hidden className="animate-spin" /> : <Bell aria-hidden />}
                                  Relancer
                                </Button>
                              )}
                              {peutTelecharger && (
                                <Button
                                  size="icon-sm"
                                  variant="outline"
                                  aria-label={`Télécharger la quittance du ${formatDateLongue(ech.dateEcheance)}`}
                                  onClick={() => {
                                    if (!bail || !bien || !owner) return;
                                    generateQuittancePDF({
                                      numero: ech.id.slice(0, 8).toUpperCase(),
                                      dateGeneration: new Date().toLocaleDateString("fr-FR"),
                                      dateEcheance: ech.dateEcheance,
                                      datePaiement: ech.datePaiement!,
                                      modePaiement: ech.modePaiement ?? undefined,
                                      reference: ech.reference ?? undefined,
                                      note: ech.note ?? undefined,
                                      montantLoyer: ech.montant,
                                      statut: ech.statut,
                                      bienTitre: bien.titre ?? undefined,
                                      bienAdresse: [bien.adresse, bien.quartier].filter(Boolean).join(", ") || undefined,
                                      bienVille: bien.ville ?? undefined,
                                      bienPays: bien.pays ?? undefined,
                                      proprietaireNom: `${owner.prenom} ${owner.nom}`,
                                      proprietaireTelephone: owner.telephone,
                                      locataireNom: `${bail.locataire.prenom} ${bail.locataire.nom}`,
                                      locataireTelephone: bail.locataire.telephone,
                                    });
                                  }}
                                >
                                  <Download aria-hidden />
                                </Button>
                              )}
                            </li>
                          );
                        })}
                      </ul>

                      {total > 4 && (
                        <Button variant="link" className="mt-2" onClick={() => setEcheancierExpanded((v) => !v)} aria-expanded={echeancierExpanded}>
                          {echeancierExpanded ? "Réduire" : `Voir les ${total} échéances`}
                        </Button>
                      )}
                    </div>
                  );
                })()}
              </div>
            </Section>
          )}

          {/* Localisation */}
          <Section title="Localisation">
            <p className="grid grid-cols-[auto_1fr] items-start gap-2 text-body-m text-encre">
              <MapPin aria-hidden className="mt-0.5 size-4 text-baobab" />
              {[bien.adresse, bien.quartier, bien.ville, bien.region, bien.pays].filter(Boolean).join(", ") || "Non renseignée"}
            </p>
          </Section>

          {/* Classification */}
          <Section title="Classification">
            <dl>
              <InfoRow label="Type de logement"    value={bien.typeLogement?.nom} />
              <InfoRow label="Type de transaction" value={bien.typeTransaction?.nom} />
              <InfoRow label="Statut du bien"      value={bien.statutBien?.nom} />
            </dl>
          </Section>

          {/* Promotion - uniquement pour les annonces publiées */}
          {statut === "PUBLIE" && (
            <PremiumPayment bienId={bien.id} bienTitre={bien.titre || "Annonce"} />
          )}

          {/* Tarifs */}
          <Section title="Tarifs">
            {bien.prix && (
              <p className="mb-2 font-display text-price-l font-bold text-encre">
                {formatFcfa(bien.prix)}
                {frequence && <span className="font-body text-body-l font-semibold text-texte2"> / {frequence}</span>}
              </p>
            )}
            <dl>
              <InfoRow label="Caution"          value={bien.caution ? formatFcfa(bien.caution) : null} />
              <InfoRow label="Charges incluses" value={bien.chargesIncluses ? "Oui" : "Non"} />
              {bien.disponibleLe && <InfoRow label="Disponible le" value={formatDateLongue(bien.disponibleLe)} />}
            </dl>
          </Section>

          {/* Dates */}
          <Section title="Dates">
            <dl>
              <InfoRow label="Créé le" value={formatDateLongue(bien.createdAt)} />
              {Math.abs(new Date(bien.updatedAt).getTime() - new Date(bien.createdAt).getTime()) > 5000 && (
                <InfoRow label="Mis à jour le" value={formatDateLongue(bien.updatedAt)} />
              )}
            </dl>
          </Section>

          <DocumentsBienSection bienId={bien.id} />
        </div>
      </div>

      {/* Modal retour brouillon */}
      <ConfirmModal
        open={retourOpen}
        title={`${retourLabel} ?`}
        message={retourMessage}
        confirmLabel={retourLabel}
        cancelLabel="Annuler"
        variant="warning"
        isPending={retour.isPending}
        onConfirm={() =>
          retour.mutate(bien.id, {
            onSuccess: () => { toast.success("Annonce remise en brouillon"); setRetourOpen(false); },
            onError: (error) => { toast.error(messageErreurApi(error, "L'annonce n'a pas pu être remise en brouillon. Réessayez.")); setRetourOpen(false); },
          })
        }
        onCancel={() => setRetourOpen(false)}
      />

      {/* Modal annulation */}
      <ConfirmModal
        open={annulerOpen}
        title="Supprimer l'annonce ?"
        message="Cette action est irréversible. L'annonce et toutes ses données seront définitivement supprimées."
        confirmLabel="Supprimer définitivement"
        cancelLabel="Retour"
        variant="danger"
        isPending={annuler.isPending}
        onConfirm={() =>
          annuler.mutate(bien.id, {
            onSuccess: () => { toast.success("Annonce supprimée"); navigate("/owner/biens"); },
            onError: (error) => { toast.error(messageErreurApi(error, "L'annonce n'a pas pu être supprimée. Réessayez.")); setAnnulerOpen(false); },
          })
        }
        onCancel={() => setAnnulerOpen(false)}
      />

      {/* Modal suppression */}
      <ConfirmModal
        open={deleteOpen}
        title="Supprimer l'annonce ?"
        message="Cette action est irréversible. L'annonce sera définitivement supprimée."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="danger"
        isPending={deleteMutation.isPending}
        onConfirm={() =>
          deleteMutation.mutate(bien.id, {
            onSuccess: () => { toast.success("Annonce supprimée"); navigate("/owner/biens"); },
            onError: (error) => { toast.error(messageErreurApi(error, "L'annonce n'a pas pu être supprimée. Réessayez.")); setDeleteOpen(false); },
          })
        }
        onCancel={() => setDeleteOpen(false)}
      />

      {/* Modal terminer bail */}
      <ConfirmModal
        open={terminerOpen}
        title="Terminer le bail ?"
        message="Le bail sera marqué comme terminé et le bien reviendra au statut Libre."
        confirmLabel="Terminer le bail"
        cancelLabel="Annuler"
        variant="warning"
        isPending={terminer.isPending}
        onConfirm={() =>
          terminer.mutate(
            { bienId: bien.id, bailId: bail!.id },
            {
              onSuccess: () => {
                toast.success("Bail terminé, le bien est Libre");
                setTerminerOpen(false);
                refetchBail();
              },
              onError: (error) => { toast.error(messageErreurApi(error, "Le bail n'a pas pu être terminé. Réessayez.")); setTerminerOpen(false); },
            }
          )
        }
        onCancel={() => setTerminerOpen(false)}
      />

      {/* Modal résilier bail */}
      <SheetDialog
        open={resilierOpen}
        onOpenChange={(open) => !open && !resilier.isPending && setResilierOpen(false)}
        title="Résilier le bail"
        description="Le bail sera résilié et le bien reviendra au statut Libre. Cette action indique une rupture anticipée du contrat."
      >
        <FormField label="Motif de résiliation">
          <NativeSelect value={resilierMotif} onChange={(e) => setResilierMotif(e.target.value)}>
            <option value="">Choisir un motif</option>
            {MOTIFS_RESILIATION.map((motif) => (
              <option key={motif} value={motif}>
                {motif}
              </option>
            ))}
          </NativeSelect>
        </FormField>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Button variant="outline" onClick={() => setResilierOpen(false)} disabled={resilier.isPending}>
            Annuler
          </Button>
          <Button
            variant="encre"
            disabled={!resilierMotif || resilier.isPending}
            onClick={() =>
              resilier.mutate(
                { bienId: bien.id, bailId: bail!.id, motif: resilierMotif },
                {
                  onSuccess: () => {
                    toast.success("Bail résilié, le bien est Libre");
                    setResilierOpen(false);
                    setResilierMotif("");
                    refetchBail();
                  },
                  onError: (error) => { toast.error(messageErreurApi(error, "Le bail n'a pas pu être résilié. Réessayez.")); setResilierOpen(false); },
                }
              )
            }
          >
            {resilier.isPending && <Loader2 aria-hidden className="animate-spin" />}
            Résilier le bail
          </Button>
        </div>
      </SheetDialog>

      {/* Modal prolonger bail */}
      <SheetDialog
        open={prolongerOpen}
        onOpenChange={(open) => !open && !prolonger.isPending && setProlongerOpen(false)}
        title={bail?.statut === "EN_RENOUVELLEMENT" ? "Confirmer le renouvellement" : "Prolonger le bail"}
        description={bail?.dateFinBail ? `Date de fin actuelle : ${formatDateLongue(bail.dateFinBail)}.` : undefined}
      >
        <fieldset>
          <legend className="mb-2 text-body-m font-semibold text-encre">Durée de la prolongation</legend>
          <div className="grid grid-cols-2 gap-3">
            {([6, 12] as const).map((d) => (
              <TuileChoix key={d} name="duree-prolongation" choisi={prolongerDuree === d} onChoisir={() => setProlongerDuree(d)}>
                {d === 12 ? "12 mois (1 an)" : "6 mois"}
              </TuileChoix>
            ))}
          </div>
        </fieldset>
        {prolongerDuree && bail?.dateFinBail && (() => {
          const base = new Date(bail.dateFinBail);
          base.setMonth(base.getMonth() + prolongerDuree);
          return (
            <p className="mt-4 rounded-control bg-baobab-100 p-3 text-body-m text-encre">
              Nouvelle date de fin : <strong>{formatDateLongue(base)}</strong>
            </p>
          );
        })()}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Button variant="outline" onClick={() => setProlongerOpen(false)} disabled={prolonger.isPending}>
            Annuler
          </Button>
          <Button
            onClick={() => {
              if (!prolongerDuree) { toast.error("Choisissez une durée de prolongation."); return; }
              prolonger.mutate(
                { bienId: bien.id, bailId: bail!.id, duree: prolongerDuree },
                {
                  onSuccess: () => {
                    toast.success("Bail prolongé");
                    setProlongerOpen(false);
                    setProlongerDuree(null);
                    refetchBail();
                  },
                  onError: (error) => toast.error(messageErreurApi(error, "Le bail n'a pas pu être prolongé. Réessayez.")),
                }
              );
            }}
            disabled={!prolongerDuree || prolonger.isPending}
          >
            {prolonger.isPending && <Loader2 aria-hidden className="animate-spin" />}
            Confirmer
          </Button>
        </div>
      </SheetDialog>

      {/* ContratModal */}
      {showContratModal && activeBailForContrat && (
        <ContratModal
          bail={activeBailForContrat}
          isCreationFlow={isContratCreationFlow}
          onClose={() => { setShowContratModal(false); setActiveBailForContrat(null); setIsContratCreationFlow(false); }}
          onValiderSuccess={(locataireId) => {
            setShowContratModal(false);
            setActiveBailForContrat(null);
            setIsContratCreationFlow(false);
            // Rafraîchir les données du locataire pour refléter le contrat validé
            queryClient.invalidateQueries({ queryKey: ["locataires"] });
            queryClient.invalidateQueries({ queryKey: ["locataires", locataireId] });
            navigate(`/owner/locataires/${locataireId}?refreshed=true`);
          }}
        />
      )}

      {/* Modal restituer la caution */}
      <SheetDialog
        open={restituerOpen && Boolean(caution)}
        onOpenChange={(open) => !open && !restituerCaution.isPending && setRestituerOpen(false)}
        title="Restituer la caution"
        description={caution ? `Montant reçu : ${formatFcfa(caution.montant)}.` : undefined}
      >
        {canRestituerCaution ? (
          <div className="space-y-5">
            <FormField label="Montant restitué (FCFA)">
              <Input type="number" inputMode="numeric" min={0} value={restituerMontant} onChange={(e) => setRestituerMontant(e.target.value)} />
            </FormField>
            <FormField label="Motif de la retenue" hint="(si vous gardez une partie)">
              <Input value={restituerMotif} onChange={(e) => setRestituerMotif(e.target.value)} placeholder="Exemple : réparations, dégradations" />
            </FormField>
          </div>
        ) : (
          <Avis icone={<Info aria-hidden className="mt-0.5 size-4" />}>
            La caution ne peut être restituée qu'après les états des lieux d'entrée et de sortie validés.
          </Avis>
        )}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Button variant="outline" onClick={() => setRestituerOpen(false)} disabled={restituerCaution.isPending}>
            Annuler
          </Button>
          {canRestituerCaution ? (
            <Button
              disabled={!restituerMontant || restituerCaution.isPending}
              onClick={() => {
                if (!bail) return;
                restituerCaution.mutate(
                  { bienId: id!, bailId: bail.id, payload: { montantRestitue: parseFloat(restituerMontant), motifRetenue: restituerMotif || undefined } },
                  {
                    onSuccess: () => { toast.success("Caution mise à jour"); setRestituerOpen(false); },
                    onError: (error) => toast.error(messageErreurApi(error, "La restitution n'a pas pu être enregistrée. Réessayez.")),
                  }
                );
              }}
            >
              {restituerCaution.isPending && <Loader2 aria-hidden className="animate-spin" />}
              Confirmer
            </Button>
          ) : (
            <Button asChild variant="soleil">
              <Link to={etatsDesLieuxHref} onClick={() => setRestituerOpen(false)}>
                Faire l'état des lieux
              </Link>
            </Button>
          )}
        </div>
      </SheetDialog>

      {/* Modal mettre en préavis */}
      <ConfirmModal
        open={preavisOpen}
        title="Mettre le bail en préavis ?"
        message="Le bail passera en préavis pour 6 mois. Si aucune date de fin n'est fixée, elle sera placée dans 6 mois."
        confirmLabel="Confirmer le préavis (6 mois)"
        cancelLabel="Annuler"
        variant="warning"
        isPending={mettreEnPreavis.isPending}
        onConfirm={() =>
          mettreEnPreavis.mutate(
            { bienId: bien.id, bailId: bail!.id },
            {
              onSuccess: () => { toast.success("Bail en préavis pour 6 mois"); setPreavisOpen(false); refetchBail(); },
              onError: (error) => { toast.error(messageErreurApi(error, "Le préavis n'a pas pu être enregistré. Réessayez.")); setPreavisOpen(false); },
            }
          )
        }
        onCancel={() => setPreavisOpen(false)}
      />

      {/* Modal mettre en renouvellement */}
      <ConfirmModal
        open={renouvellementOpen}
        title="Mettre le bail en renouvellement ?"
        message="Le bail passera en renouvellement. Prolongez-le ensuite pour confirmer la nouvelle période."
        confirmLabel="Confirmer le renouvellement"
        cancelLabel="Annuler"
        variant="warning"
        isPending={mettreEnRenouvellement.isPending}
        onConfirm={() =>
          mettreEnRenouvellement.mutate(
            { bienId: bien.id, bailId: bail!.id },
            {
              onSuccess: () => { toast.success("Bail en renouvellement"); setRenouvellementOpen(false); refetchBail(); },
              onError: (error) => { toast.error(messageErreurApi(error, "Le renouvellement n'a pas pu être enregistré. Réessayez.")); setRenouvellementOpen(false); },
            }
          )
        }
        onCancel={() => setRenouvellementOpen(false)}
      />

      {/* Modal archiver le bail */}
      <SheetDialog
        open={archiverOpen && Boolean(bailAArchiver)}
        onOpenChange={(open) => !open && !archiver.isPending && setArchiverOpen(false)}
        title="Archiver le bail"
        description="Le contrat sera archivé et le locataire passera en ancien locataire."
      >
        {cautionAArchiver > 0 && (
          <fieldset className="space-y-4 rounded-card bg-surface p-4">
            <legend className="sr-only">Restitution de la caution</legend>
            <p className="text-body-m text-encre">
              <span className="font-semibold">Restitution de la caution</span> (facultatif). Caution reçue : {formatFcfa(cautionAArchiver)}.
            </p>
            <FormField
              label="Montant restitué (FCFA)"
              help="Laissez vide si la caution est déjà réglée. La restitution demande des états des lieux d'entrée et de sortie validés."
              error={erreurArchiverMontant}
            >
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                max={cautionAArchiver}
                value={archiverRestituerMontant}
                onChange={(e) => {
                  setArchiverRestituerMontant(e.target.value);
                  setErreurArchiverMontant(undefined);
                }}
              />
            </FormField>
            {archiverRestituerMontant && (
              <FormField label="Motif de la retenue">
                <Input value={archiverRestituerMotif} onChange={(e) => setArchiverRestituerMotif(e.target.value)} placeholder="Exemple : réparations, dégradations" />
              </FormField>
            )}
          </fieldset>
        )}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Button variant="outline" onClick={() => setArchiverOpen(false)} disabled={archiver.isPending}>
            Annuler
          </Button>
          <Button
            variant="encre"
            disabled={archiver.isPending || !bailAArchiver}
            onClick={() => {
              if (!bailAArchiver) return;
              const saisie = archiverRestituerMontant.trim();
              const montant = Number(saisie);
              if (saisie && (!Number.isFinite(montant) || montant < 0 || montant > cautionAArchiver)) {
                setErreurArchiverMontant(`Indiquez un montant entre 0 et ${formatFcfa(cautionAArchiver)}.`);
                return;
              }
              archiver.mutate(
                {
                  bienId: bien.id,
                  bailId: bailAArchiver.id,
                  restitution: saisie ? { montantRestitue: montant, motifRetenue: archiverRestituerMotif.trim() || undefined } : undefined,
                },
                {
                  onSuccess: () => {
                    toast.success(saisie ? "Bail archivé et caution mise à jour" : "Bail archivé, le locataire est passé en ancien locataire");
                    setArchiverOpen(false);
                  },
                  onError: (error) => toast.error(messageErreurApi(error, "Le bail n'a pas pu être archivé. Réessayez.")),
                }
              );
            }}
          >
            {archiver.isPending && <Loader2 aria-hidden className="animate-spin" />}
            Archiver
          </Button>
        </div>
      </SheetDialog>

      {/* BailForm modal */}
      {showBailForm && (
        <BailForm
          bienId={bien.id}
          bien={{
            prix: bien.prix,
            caution: bien.caution,
            frequencePaiement: bien.frequencePaiement,
            titre: bien.titre,
            adresse: bien.adresse,
            ville: bien.ville,
          }}
          onClose={() => setShowBailForm(false)}
          onBailCreated={(newBail) => {
            setShowBailForm(false);
            refetchBail();
            setActiveBailForContrat(newBail);
            setIsContratCreationFlow(true);
            setShowContratModal(true);
          }}
        />
      )}
    </div>
  );
}
