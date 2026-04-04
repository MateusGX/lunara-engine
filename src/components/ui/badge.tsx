import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-none border px-2 py-0.5 text-[10px] font-medium whitespace-nowrap transition-all [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default:
          "border-rpg-gold/40 bg-rpg-gold/12 text-rpg-gold",
        outline:
          "border-rpg-gold/25 bg-transparent text-rpg-stone",
        destructive:
          "border-rpg-blood/40 bg-rpg-blood/10 text-rpg-blood",
        secondary:
          "border-rpg-stone/30 bg-surface-overlay text-rpg-stone",
        emerald:
          "border-rpg-emerald/40 bg-rpg-emerald/10 text-rpg-emerald",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export { Badge, badgeVariants }
