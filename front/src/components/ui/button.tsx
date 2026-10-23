import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// Boutons de la charte Seek : rayon 12 px, cibles de 48 px, une seule action Soleil par écran.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-control font-semibold transition-colors duration-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:bg-surface disabled:text-texte2 disabled:border-transparent [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-baobab text-white hover:bg-baobab-900",
        soleil: "bg-soleil text-encre hover:bg-soleil-600",
        encre: "bg-encre text-white hover:bg-baobab-900",
        destructive: "bg-destructive text-destructive-foreground hover:bg-soleil-600",
        outline: "border border-bord-champ bg-white text-encre hover:bg-surface",
        "outline-inverse": "border border-white/70 bg-transparent text-white hover:bg-white/10",
        secondary: "bg-surface text-encre hover:bg-baobab-100",
        inverse: "bg-white text-baobab hover:bg-baobab-100",
        ghost: "text-encre hover:bg-surface",
        link: "text-baobab underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 px-5 text-body-l",
        sm: "h-10 px-4 text-body-m [&_svg]:size-4",
        lg: "h-14 px-6 text-body-l",
        icon: "h-12 w-12",
        "icon-sm": "h-10 w-10 [&_svg]:size-4",
      },
    },
    // Un lien n'a ni hauteur imposée ni marge latérale, quelle que soit la taille.
    compoundVariants: [{ variant: "link", className: "h-auto px-0" }],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
