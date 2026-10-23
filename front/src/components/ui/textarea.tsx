import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[112px] w-full rounded-control border border-input bg-white px-4 py-3 text-body-l text-encre placeholder:text-bord-champ focus-visible:border-2 focus-visible:border-baobab focus-visible:px-[15px] focus-visible:py-[11px] focus-visible:outline-none aria-[invalid=true]:border-2 aria-[invalid=true]:border-encre disabled:cursor-not-allowed disabled:bg-surface disabled:opacity-70",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
