import { useId, type ReactElement, cloneElement } from "react";
import { FieldError } from "@/components/ui/FieldError";

// Champ de formulaire de la charte : libellé toujours visible au-dessus, aide sous le champ,
// erreur précédée du triangle Soleil et reliée au champ pour les lecteurs d'écran.

interface FormFieldProps {
  label: string;
  /** Mention ajoutée au libellé, par exemple « (facultatif) ». */
  hint?: string;
  help?: string;
  error?: string;
  children: ReactElement<{ id?: string; "aria-invalid"?: boolean; "aria-describedby"?: string }>;
}

export function FormField({ label, hint, help, error, children }: FormFieldProps) {
  const id = useId();
  const helpId = `${id}-aide`;
  const errorId = `${id}-erreur`;
  const describedBy = [help ? helpId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-body-m font-semibold text-encre">
        {label}
        {hint && <span className="font-normal text-texte2"> {hint}</span>}
      </label>
      {cloneElement(children, { id, "aria-invalid": Boolean(error), "aria-describedby": describedBy })}
      {help && !error && (
        <p id={helpId} className="mt-2 text-caption text-texte2">
          {help}
        </p>
      )}
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  );
}
