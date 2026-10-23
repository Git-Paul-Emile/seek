import { cn } from "@/lib/utils";

// Sélecteur segmenté de la charte (Louer / Acheter). Exception pilule validée dans rules/30-produit/ui.md.
export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  tone?: "sur-baobab" | "sur-blanc";
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  tone = "sur-blanc",
  className,
}: SegmentedControlProps<T>) {
  const onBaobab = tone === "sur-baobab";
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        "inline-flex rounded-full p-1",
        onBaobab ? "bg-baobab-900" : "bg-surface",
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "h-10 rounded-full px-5 text-body-l font-semibold transition-colors duration-tab",
              active && "bg-white text-baobab shadow-sm",
              !active && (onBaobab ? "text-white/85 hover:text-white" : "text-texte2 hover:text-encre"),
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
