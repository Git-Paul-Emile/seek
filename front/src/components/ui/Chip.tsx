import * as React from "react";
import { cn } from "@/lib/utils";

// Puce de filtre de la charte : pilule, teinte Baobab quand active.
interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  icon?: React.ReactNode;
  size?: "sm" | "md";
}

export const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  ({ selected = false, icon, size = "md", className, children, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      aria-pressed={selected}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border font-medium transition-colors duration-hover",
        size === "md" ? "h-10 px-4 text-body-m" : "h-8 px-3 text-caption",
        selected
          ? "border-baobab bg-baobab-100 text-baobab"
          : "border-bord-champ bg-white text-encre hover:bg-surface",
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  ),
);
Chip.displayName = "Chip";
