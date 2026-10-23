import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SheetDialog } from "@/components/ui/SheetDialog";

// Confirmation d'une action (charte, planche « Alertes et fenêtres ») : tiroir sur mobile,
// fenêtre centrée sur desktop. Pas de rouge : l'action irréversible est en encre.

interface ConfirmModalProps {
  /** Absent : la fenêtre est ouverte dès qu'elle est rendue. */
  open?: boolean;
  title?: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** « danger » : action irréversible (bouton encre). « warning » : action réversible (bouton Baobab). */
  variant?: "danger" | "warning";
  isPending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open = true,
  title = "Confirmer l'action",
  message,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  variant = "danger",
  isPending = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <SheetDialog open={open} onOpenChange={(ouvert) => !ouvert && !isPending && onCancel()} title={title}>
      <div className="text-body-l text-texte2">{message}</div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Button variant="outline" onClick={onCancel} disabled={isPending}>
          {cancelLabel}
        </Button>
        <Button variant={variant === "danger" ? "encre" : "default"} onClick={onConfirm} disabled={isPending}>
          {isPending && <Loader2 aria-hidden className="animate-spin" />}
          {confirmLabel}
        </Button>
      </div>
    </SheetDialog>
  );
}
