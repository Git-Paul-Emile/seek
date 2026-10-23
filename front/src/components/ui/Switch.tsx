import { cn } from "@/lib/utils";

// Interrupteur de la charte (maquette « Ajouter un bien », étape 3) : piste Baobab quand activé.
interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  className?: string;
}

export function Switch({ checked, onChange, label, className }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn("inline-flex min-h-12 items-center gap-3 text-body-l text-encre", className)}
    >
      <span>{label}</span>
      <span
        aria-hidden
        className={cn(
          "relative h-8 w-14 shrink-0 rounded-full border-2 transition-colors duration-tab",
          checked ? "border-baobab bg-baobab" : "border-bord-champ bg-white",
        )}
      >
        <span
          className={cn(
            "absolute top-1/2 size-6 -translate-y-1/2 rounded-full transition-transform duration-tab",
            checked ? "translate-x-[26px] bg-white" : "translate-x-0.5 bg-bord-champ",
          )}
        />
      </span>
    </button>
  );
}
