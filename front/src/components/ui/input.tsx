import * as React from "react";

import { cn } from "@/lib/utils";

// Champ de la charte : 48 px de haut, texte de 16 px (évite le zoom sur iPhone),
// bord de champ 3:1, bord Baobab de 2 px au focus.
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-control border border-input bg-white px-4 text-body-l text-encre transition-colors duration-hover file:border-0 file:bg-transparent file:text-body-m file:font-medium file:text-foreground placeholder:text-bord-champ focus-visible:border-2 focus-visible:border-baobab focus-visible:px-[15px] focus-visible:outline-none aria-[invalid=true]:border-2 aria-[invalid=true]:border-encre aria-[invalid=true]:px-[15px] disabled:cursor-not-allowed disabled:bg-surface disabled:opacity-70",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
