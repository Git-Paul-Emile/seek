import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Download, FileCheck, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  useContrat,
  useGenererContrat,
  useEnvoyerContrat,
} from "@/hooks/useContrat";
import type { Bail } from "@/api/bail";
import { Button } from "@/components/ui/button";
import { SheetDialog } from "@/components/ui/SheetDialog";
import { StatusBadge, type StatusTone } from "@/components/ui/StatusBadge";
import { STYLES_TEXTE_RICHE } from "@/lib/stylesTexteRiche";

// Contrat de bail en fenêtre large : lecture du contrat généré, téléchargement en PDF, puis
// validation (création du bail) ou renvoi au locataire (consultation).

// ─── Props ────────────────────────────────────────────────────────────────────

interface ContratModalProps {
  bail: Bail;
  onClose: () => void;
  /** true  = flux création du bail (Valider → active + envoie + ferme)
   *  false = consultation depuis BienDetail (Renvoyer uniquement) */
  isCreationFlow?: boolean;
  /** Appelé si l'utilisateur ferme la modal SANS valider (flux création uniquement).
   *  Permet au parent d'annuler le bail et supprimer le locataire. */
  onCancelCreation?: () => Promise<void>;
  /** Called when the contract is successfully validated (creation flow only).
   *  Provides the tenant ID for redirection to tenant detail page. */
  onValiderSuccess?: (locataireId: string) => void;
}

const STATUT_CONTRAT: Record<"BROUILLON" | "ACTIF" | "ARCHIVE", { label: string; tone: StatusTone }> = {
  BROUILLON: { label: "Brouillon", tone: "attente" },
  ACTIF: { label: "Actif", tone: "positif" },
  ARCHIVE: { label: "Archivé", tone: "neutre" },
};

// ─── Modal principal ──────────────────────────────────────────────────────────

export default function ContratModal({
  bail,
  onClose,
  isCreationFlow = false,
  onCancelCreation,
  onValiderSuccess,
}: ContratModalProps) {
  const bienId = bail.bienId;
  const bailId = bail.id;

  const { data: contrat, isLoading } = useContrat(bienId, bailId);
  const generer = useGenererContrat();
  const envoyer = useEnvoyerContrat();
  const queryClient = useQueryClient();

  const [contenu, setContenu] = useState("");
  const [autoGenDone, setAutoGenDone] = useState(false);
  // Track whether the contract was validated so X-close doesn't trigger cancellation
  const validatedRef = useRef(false);

  // Sync contenu when server data arrives
  useEffect(() => {
    if (contrat?.contenu) setContenu(contrat.contenu);
  }, [contrat?.contenu]);

  // Auto-generate only in creation flow if no contract exists yet
  useEffect(() => {
    if (!isCreationFlow) return;
    if (!isLoading && !contrat && !autoGenDone && !generer.isPending) {
      setAutoGenDone(true);
      generer.mutateAsync({ bienId, bailId }).then((c) => {
        setContenu(c.contenu);
      }).catch(() => {
        toast.error("Le contrat n'a pas pu être généré. Réessayez.");
      });
    }
  }, [isLoading, contrat, autoGenDone, generer.isPending, isCreationFlow]); // eslint-disable-line react-hooks/exhaustive-deps

  const contratId = contrat?.id ?? "";
  const titre     = contrat?.titre ?? "Contrat de bail";

  // ── Valider (création) → active + envoie automatiquement ───
  const handleValider = async () => {
    if (!contratId) {
      return;
    }
    try {
      await envoyer.mutateAsync({ bienId, bailId, contratId });
      queryClient.invalidateQueries({ queryKey: ["locataires", bail.locataireId] });
      validatedRef.current = true;
      toast.success("Contrat validé et envoyé au locataire");
      // Rediriger vers la page détails du locataire dans le flux de création
      if (isCreationFlow && onValiderSuccess && bail.locataireId) {
        onValiderSuccess(bail.locataireId);
      }
    } catch {
      toast.error("Le contrat n'a pas pu être validé. Réessayez.");
    }
  };

  // ── Fermeture avec annulation (X en flux création sans validation) ─────────
  const handleClose = async () => {
    if (isCreationFlow && !validatedRef.current && onCancelCreation) {
      try {
        await onCancelCreation();
      } catch {
        // best-effort
      }
    }
    onClose();
  };

  // ── Renvoyer (consultation) ────────────────────────────────────────────────
  const handleRenvoyer = async () => {
    if (!contratId) return;
    try {
      await envoyer.mutateAsync({ bienId, bailId, contratId });
    } catch {
      toast.error("Le contrat n'a pas pu être renvoyé. Réessayez dans un instant.");
    }
  };

  // ── PDF ───────────────────────────────────────────────────────────────────
  const pdfRef = useRef<HTMLDivElement>(null);

  const handleDownloadPdf = async () => {
    const el = pdfRef.current;
    if (!el) return;
    try {
      toast.loading("Préparation du PDF…", { id: "pdf" });
      const canvas = await html2canvas(el, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth  = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgHeight  = (canvas.height * pageWidth) / canvas.width;

      let y = 0;
      while (y < imgHeight) {
        if (y > 0) pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, -y, pageWidth, imgHeight);
        y += pageHeight;
      }
      pdf.save(`${titre.replace(/\s+/g, "_")}.pdf`);
      toast.success("PDF téléchargé", { id: "pdf" });
    } catch {
      toast.error("Le PDF n'a pas pu être créé. Réessayez.", { id: "pdf" });
    }
  };

  const isGenerating = generer.isPending;
  const isBusy = isGenerating || envoyer.isPending;
  const pret = !isLoading && !isGenerating && Boolean(contrat);
  const statut = contrat ? STATUT_CONTRAT[contrat.statut] : null;

  return (
    <SheetDialog
      open
      onOpenChange={(open) => !open && !isBusy && handleClose()}
      title={titre}
      description={[`Bail ${bail.typeBail}`, bail.bien?.titre].filter(Boolean).join(" · ")}
      className="sm:max-w-4xl"
    >
      {pret && (
        <div className="mb-4 grid gap-3 sm:grid-cols-[auto_1fr_auto] sm:items-center">
          {statut && <StatusBadge tone={statut.tone}>{statut.label}</StatusBadge>}
          <span aria-hidden className="hidden sm:block" />
          <div className="grid gap-2 sm:flex">
            <Button variant="outline" onClick={handleDownloadPdf} disabled={isBusy}>
              <Download aria-hidden />
              Télécharger le PDF
            </Button>
            {isCreationFlow ? (
              <Button onClick={handleValider} disabled={isBusy}>
                {envoyer.isPending ? <Loader2 aria-hidden className="animate-spin" /> : <FileCheck aria-hidden />}
                Valider le contrat
              </Button>
            ) : (
              <Button variant={contrat?.statut === "BROUILLON" ? "default" : "outline"} onClick={handleRenvoyer} disabled={isBusy}>
                {envoyer.isPending && <Loader2 aria-hidden className="animate-spin" />}
                {contrat?.statut === "BROUILLON" ? "Valider le contrat" : "Renvoyer au locataire"}
              </Button>
            )}
          </div>
        </div>
      )}

      {isCreationFlow && pret && (
        <p className="mb-4 flex items-center gap-2 rounded-control bg-soleil-100 p-3 text-body-m text-encre">
          <FileCheck aria-hidden className="size-4 shrink-0" />
          Lisez le contrat, puis validez-le pour finaliser le bail. Fermer sans valider annule le bail.
        </p>
      )}

      {isLoading || isGenerating ? (
        <div className="flex flex-col items-center gap-3 py-20">
          <Loader2 aria-hidden className="size-8 animate-spin text-baobab" />
          <p className="text-body-m text-texte2">{isGenerating ? "Génération du contrat…" : "Chargement du contrat…"}</p>
        </div>
      ) : !contrat ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <FileText aria-hidden className="size-10 text-texte2" />
          <p className="max-w-xs text-body-m text-texte2">
            {isCreationFlow
              ? `Aucun modèle de contrat n'existe pour le bail « ${bail.typeBail} ». Contactez l'administration de Seek.`
              : "Aucun contrat n'a encore été généré pour ce bail."}
          </p>
        </div>
      ) : (
        // Rendu figé à 700 px de large : c'est cette zone que le PDF capture.
        <div className="overflow-x-auto pb-2">
          <div ref={pdfRef} className="w-full min-w-[700px] rounded-control border border-filet bg-white p-8">
            <div className={`break-words ${STYLES_TEXTE_RICHE}`} dangerouslySetInnerHTML={{ __html: contenu }} />
          </div>
        </div>
      )}
    </SheetDialog>
  );
}
