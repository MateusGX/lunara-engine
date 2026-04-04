import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-8 w-full min-w-0 rounded-none border border-rpg-gold/15 bg-surface-raised px-2.5 py-1 text-xs text-rpg-parchment transition-colors outline-none",
        "placeholder:text-rpg-stone/60",
        "focus-visible:border-rpg-gold/50 focus-visible:ring-1 focus-visible:ring-rpg-gold/20",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-xs file:font-medium file:text-rpg-parchment",
        className
      )}
      {...props}
    />
  )
}

export { Input }
