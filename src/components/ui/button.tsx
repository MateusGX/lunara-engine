import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-none border border-transparent bg-clip-padding text-xs font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        /* ── Standard (gold bg) ── */
        default:
          "bg-rpg-gold text-[oklch(0.10_0.02_80)] hover:bg-rpg-gold-bright border-rpg-gold/60 hover:border-rpg-gold",
        /* ── Outline — stone wall with gold border ── */
        outline:
          "border-rpg-gold/30 bg-surface-card text-rpg-gold hover:border-rpg-gold/60 hover:bg-rpg-gold/8 hover:text-rpg-gold-bright",
        /* ── Ghost — no border, muted text ── */
        ghost:
          "text-rpg-stone hover:bg-rpg-gold/6 hover:text-rpg-parchment hover:border-rpg-gold/20",
        /* ── Secondary — dim stone ── */
        secondary:
          "bg-surface-overlay border-rpg-gold/15 text-rpg-parchment hover:border-rpg-gold/30 hover:bg-surface-overlay/80",
        /* ── Destructive — blood red ── */
        destructive:
          "bg-rpg-blood/15 text-rpg-blood border-rpg-blood/30 hover:bg-rpg-blood/25 hover:border-rpg-blood/50",
        /* ── Emerald — play/cast green ── */
        emerald:
          "bg-rpg-emerald/15 text-rpg-emerald border-rpg-emerald/30 hover:bg-rpg-emerald/25 hover:border-rpg-emerald/55",
        /* ── Link ── */
        link: "text-rpg-gold underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-8 gap-1.5 px-3 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 px-2 text-[10px] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 px-2.5 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-3",
        icon: "size-8",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  disabled = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(
        buttonVariants({ variant, size, className }),
        !disabled ? "cursor-pointer" : "cursor-not-allowed",
      )}
      disabled={disabled}
      {...props}
    />
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export { Button, buttonVariants };
