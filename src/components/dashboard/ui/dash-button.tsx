import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** Compact dashboard button. Snappy hover (150ms) + micro-press scale. */
export const dashButton = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 font-medium whitespace-nowrap transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-primary text-white hover:bg-blue-600/90",
        accent: "bg-accent text-accent-fg hover:bg-accent-hover",
        secondary: "border border-border bg-surface text-fg hover:border-border-strong",
        ghost: "text-fg hover:bg-surface-2",
        warning: "border border-yellow-500 text-fg hover:bg-yellow-500 hover:text-navy-950",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        icon: "size-9",
        "icon-sm": "size-8",
      },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  },
);

export function DashButton({
  className,
  variant,
  size,
  asChild,
  ...props
}: ComponentProps<"button"> & VariantProps<typeof dashButton> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "button";
  return <Comp className={cn(dashButton({ variant, size }), className)} {...props} />;
}
