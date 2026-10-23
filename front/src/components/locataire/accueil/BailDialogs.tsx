import { useRef, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "sonner";
import type { ContratLocataireData } from "@/api/locataireAuth";
import { SheetDialog } from "@/components/ui/SheetDialog";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/FormField";
import { NativeSelect } from "@/components/ui/NativeSelect";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDateLongue } from "@/lib/dates";
import { useMettreEnPreavisLocataire, useResilierBailLocataire } from "@/hooks/useBail";
import { useSupprimerCompteLocataire } from "@/hooks/useLocataireEcheancier";
import { DUREE_PREAVIS_MOIS } from "./preavis";

// Fenêtres d'action du locataire sur son bail et son compte.

const PDF_ECHELLE = 2;

// ─── Contrat ──────────────────────────────────────────────────────────────────

interface ContratDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contrat: ContratLocataireData | null | undefined;
  isLoading: boolean;
}

export function ContratDialog({ open, onOpenChange, contrat, isLoading }: ContratDialogProps) {
  const pdfRef = useRef<HTMLDivElement>(null);
  const titre = contrat?.contrat?.titre ?? "Contrat de bail";

  const telechargerPdf = async () => {
    const element = pdfRef.current;
    if (!element) return;
    try {
      toast.loading("Préparation du PDF…", { id: "pdf" });
      const canvas = await html2canvas(element, { scale: PDF_ECHELLE, useCORS: true });
      const pdf = new jsPDF("p", "mm", "a4");
      const largeurPage = pdf.internal.pageSize.getWidth();
      const hauteurPage = pdf.internal.pageSize.getHeight();
      const hauteurImage = (canvas.height * largeurPage) / canvas.width;
      const image = canvas.toDataURL("image/png");
      for (let y = 0; y < hauteurImage; y += hauteurPage) {
        if (y > 0) pdf.addPage();
        pdf.addImage(image, "PNG", 0, -y, largeurPage, hauteurImage);
      }
      pdf.save(`${titre.replace(/\s+/g, "_")}.pdf`);
      toast.success("PDF téléchargé", { id: "pdf" });
    } catch {
      toast.error("Le PDF n'a pas pu être créé. Réessayez.", { id: "pdf" });
    }
  };

  return (
    <SheetDialog
      open={open}
      onOpenChange={onOpenChange}
      title={titre}
      description={contrat?.bien?.titre ?? contrat?.bien?.ville ?? undefined}
      className="sm:max-w-4xl"
    >
      {isLoading ? (
        <p className="flex items-center justify-center gap-3 py-16 text-body-m text-texte2">
          <Loader2 aria-hidden className="size-5 animate-spin" />
          Chargement du contrat…
        </p>
      ) : !contrat ? (
        <p className="py-16 text-center text-body-l text-texte2">Votre propriétaire n'a pas encore ajouté de contrat à ce bail.</p>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <StatusBadge tone={contrat.contrat.statut === "ACTIF" ? "positif" : "neutre"}>
              {contrat.contrat.statut === "ACTIF" ? "Actif" : "Brouillon"}
            </StatusBadge>
            <Button variant="outline" size="sm" onClick={telechargerPdf}>
              <Download aria-hidden />
              Télécharger le PDF
            </Button>
          </div>
          <div className="overflow-x-auto rounded-card border border-filet">
            <div ref={pdfRef} className="min-w-[700px] bg-white p-8">
              <div
                className="prose prose-sm max-w-none break-words"
                dangerouslySetInnerHTML={{ __html: contrat.contrat.contenu }}
              />
            </div>
          </div>
        </>
      )}
    </SheetDialog>
  );
}

// ─── Préavis ──────────────────────────────────────────────────────────────────

interface PreavisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dateFinBail?: string | null;
}

export function PreavisDialog({ open, onOpenChange, dateFinBail }: PreavisDialogProps) {
  const mettreEnPreavis = useMettreEnPreavisLocataire();
  const confirmer = () =>
    mettreEnPreavis.mutate(
      {},
      {
        onSuccess: () => {
          toast.success(`Préavis enregistré. Le bail prend fin dans ${DUREE_PREAVIS_MOIS} mois.`);
          onOpenChange(false);
        },
        onError: () => toast.error("Le préavis n'a pas pu être enregistré. Réessayez."),
      },
    );

  return (
    <SheetDialog open={open} onOpenChange={onOpenChange} title="Donner mon préavis">
      <p className="text-body-l text-texte2">
        Votre bail passe en préavis pour {DUREE_PREAVIS_MOIS} mois.
        {dateFinBail && ` La fin reste fixée au ${formatDateLongue(dateFinBail)}.`} Le loyer reste dû pendant toute cette période.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Annuler
        </Button>
        <Button onClick={confirmer} disabled={mettreEnPreavis.isPending}>
          {mettreEnPreavis.isPending && <Loader2 aria-hidden className="animate-spin" />}
          Confirmer le préavis
        </Button>
      </div>
    </SheetDialog>
  );
}

// ─── Résiliation ──────────────────────────────────────────────────────────────

const MOTIFS_RESILIATION = [
  "Logement insalubre",
  "Manquement du propriétaire à ses obligations",
  "Mutation professionnelle",
  "Problème de sécurité",
  "Raisons personnelles urgentes",
  "Autre",
];

export function ResilierDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const resilierBail = useResilierBailLocataire();
  const [motif, setMotif] = useState("");
  const [erreur, setErreur] = useState<string>();

  const confirmer = () => {
    if (!motif) {
      setErreur("Choisissez le motif de la résiliation.");
      return;
    }
    resilierBail.mutate(
      { motif },
      {
        onSuccess: () => {
          toast.success("Bail résilié");
          setMotif("");
          onOpenChange(false);
        },
        onError: () => toast.error("La résiliation n'a pas pu être enregistrée. Réessayez."),
      },
    );
  };

  return (
    <SheetDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Résilier le bail"
      description="La résiliation met fin au contrat de location. Votre propriétaire en est informé."
    >
      <FormField label="Motif de la résiliation" error={erreur}>
        <NativeSelect
          value={motif}
          onChange={(event) => {
            setMotif(event.target.value);
            setErreur(undefined);
          }}
        >
          <option value="">Choisir un motif</option>
          {MOTIFS_RESILIATION.map((valeur) => (
            <option key={valeur} value={valeur}>
              {valeur}
            </option>
          ))}
        </NativeSelect>
      </FormField>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Annuler
        </Button>
        <Button variant="encre" onClick={confirmer} disabled={resilierBail.isPending}>
          {resilierBail.isPending && <Loader2 aria-hidden className="animate-spin" />}
          Résilier le bail
        </Button>
      </div>
    </SheetDialog>
  );
}

// ─── Suppression du compte ────────────────────────────────────────────────────

export function SupprimerCompteDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const supprimerCompte = useSupprimerCompteLocataire();
  const confirmer = () =>
    supprimerCompte.mutate(undefined, {
      onSuccess: () => {
        toast.success("Compte supprimé");
        window.location.href = "/locataire/login";
      },
      onError: () => toast.error("Le compte n'a pas pu être supprimé. Vérifiez qu'aucun paiement n'est en attente."),
    });

  return (
    <SheetDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Supprimer mon compte"
      description="Cette action est définitive : votre fiche et votre historique sont effacés et vous ne pourrez plus vous connecter."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Annuler
        </Button>
        <Button variant="encre" onClick={confirmer} disabled={supprimerCompte.isPending}>
          {supprimerCompte.isPending && <Loader2 aria-hidden className="animate-spin" />}
          Supprimer définitivement
        </Button>
      </div>
    </SheetDialog>
  );
}
