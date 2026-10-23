import * as React from "react";
import { cn } from "@/lib/utils";
import { SENEGAL_PREFIX, formatNumeroSenegal } from "@/lib/telephone";

// Champ téléphone de la charte : indicatif +221 fixe, groupes de deux chiffres (77 123 45 67).

type PhoneInputProps = Omit<React.ComponentProps<"input">, "onChange" | "value" | "type"> & {
  value: string;
  onChange: (value: string) => void;
};

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, className, ...props }, ref) => (
    <div
      className={cn(
        "flex h-12 w-full items-center rounded-control border border-input bg-white transition-colors duration-hover focus-within:border-2 focus-within:border-baobab has-[[aria-invalid=true]]:border-2 has-[[aria-invalid=true]]:border-encre",
        className,
      )}
    >
      <span className="border-r border-filet px-4 text-body-l font-semibold text-encre">{SENEGAL_PREFIX}</span>
      <input
        ref={ref}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        value={value}
        onChange={(event) => onChange(formatNumeroSenegal(event.target.value))}
        placeholder="77 123 45 67"
        className="h-full min-w-0 flex-1 rounded-r-control bg-transparent px-4 text-body-l text-encre placeholder:text-bord-champ focus:outline-none"
        {...props}
      />
    </div>
  ),
);
PhoneInput.displayName = "PhoneInput";
