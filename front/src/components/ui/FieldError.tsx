import { TriangleAlert } from "lucide-react";

// Message d'erreur de la charte : précédé du triangle Soleil, dit exactement quoi corriger.
export function FieldError({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} role="alert" className="mt-2 flex items-start gap-2 text-body-m font-semibold text-encre">
      <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0 fill-soleil text-encre" />
      {children}
    </p>
  );
}
