import type { ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// Fenêtre de la charte (planche « Alertes et fenêtres ») : tiroir du bas sur mobile,
// fenêtre centrée sur desktop, rayon 28 px, fermeture au clavier et au clic extérieur.

interface SheetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function SheetDialog({ open, onOpenChange, title, description, children, className }: SheetDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[90] bg-encre/50 data-[state=open]:animate-overlay-in" />
        <Dialog.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-[91] max-h-[92dvh] overflow-y-auto rounded-t-sheet bg-white p-6 pb-[calc(24px+env(safe-area-inset-bottom))] shadow-float focus:outline-none",
            "sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-sheet sm:pb-6",
            className,
          )}
        >
          <div aria-hidden className="mx-auto -mt-2 mb-4 h-1 w-10 rounded-full bg-filet sm:hidden" />
          <div className="grid grid-cols-[1fr_auto] items-start gap-4">
            <Dialog.Title className="text-h3 font-bold text-encre">{title}</Dialog.Title>
            <Dialog.Close asChild>
              <button type="button" aria-label="Fermer" className="-m-2 flex size-12 items-center justify-center rounded-control hover:bg-surface">
                <X aria-hidden className="size-5" />
              </button>
            </Dialog.Close>
          </div>
          {description ? (
            <Dialog.Description className="mt-1 text-body-m text-texte2">{description}</Dialog.Description>
          ) : (
            <Dialog.Description className="sr-only">{title}</Dialog.Description>
          )}
          <div className="mt-6">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
