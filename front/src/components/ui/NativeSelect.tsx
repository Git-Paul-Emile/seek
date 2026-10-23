import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Liste déroulante native au gabarit des champs de la charte (48 px, rayon 12 px).
// Native pour profiter du sélecteur du téléphone et de l'accessibilité du navigateur.
export const NativeSelect = React.forwardRef<HTMLSelectElement, React.ComponentProps<"select">>(
  ({ className, children, ...props }, ref) => (
    <div className={cn("relative", className)}>
      <select
        ref={ref}
        className="h-12 w-full cursor-pointer appearance-none truncate rounded-control border border-input bg-white pl-4 pr-11 text-body-l text-encre transition-colors duration-hover focus-visible:border-2 focus-visible:border-baobab focus-visible:pl-[15px] focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-surface"
        {...props}
      >
        {children}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-texte2" />
    </div>
  ),
);
NativeSelect.displayName = "NativeSelect";
