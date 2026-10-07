import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps, ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { Magnetic } from "@/components/motion/magnetic";
import { cn } from "@/lib/utils";

/**
 * Brand button. The fill lives on an inner layer clipped with the logo's square
 * notch (top-start corner) — the button itself is NOT clipped, so focus rings stay visible.
 */
export const buttonVariants = cva(
  "group/btn relative isolate inline-flex shrink-0 select-none items-center justify-center gap-3 whitespace-nowrap font-medium transition-colors duration-300 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "text-accent-fg",
        secondary: "text-fg hover:text-bg",
        ghost: "text-fg hover:text-link",
        inverse: "text-bg hover:text-fg",
      },
      size: {
        sm: "h-10 px-4 text-sm",
        md: "h-12 px-6 text-[0.9375rem]",
        lg: "h-16 px-8 text-lg",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

const NOTCH =
  "[clip-path:polygon(10px_0,100%_0,100%_100%,0_100%,0_10px,10px_10px)] rtl:[clip-path:polygon(0_0,calc(100%-10px)_0,calc(100%-10px)_10px,100%_10px,100%_100%,0_100%)]";

function Fill({
  variant,
}: {
  variant: NonNullable<VariantProps<typeof buttonVariants>["variant"]>;
}) {
  if (variant === "ghost") return null;
  if (variant === "primary") {
    return (
      <span
        aria-hidden
        className={cn(
          "absolute inset-0 -z-10 bg-accent transition-colors duration-300 group-hover/btn:bg-accent-hover",
          NOTCH,
        )}
      />
    );
  }
  const base = variant === "secondary" ? "bg-fg" : "bg-bg";
  const ring = variant === "secondary" ? "border-border-strong" : "border-bg";
  return (
    <>
      <span aria-hidden className={cn("absolute inset-0 -z-20 border", ring)} />
      <span
        aria-hidden
        className={cn(
          "absolute inset-0 -z-10 origin-left scale-x-0 transition-transform duration-500 ease-[var(--ease-expo-out)] group-hover/btn:scale-x-100 rtl:origin-right",
          base,
          NOTCH,
        )}
      />
    </>
  );
}

/** Text rolls up on hover (string labels only). */
function Label({ children }: { children: ReactNode }) {
  if (typeof children !== "string") return <>{children}</>;
  return (
    <span className="relative block overflow-hidden">
      <span className="block transition-transform duration-500 ease-[var(--ease-expo-out)] group-hover/btn:-translate-y-full motion-reduce:transition-none">
        {children}
      </span>
      <span
        aria-hidden
        className="absolute inset-0 block translate-y-full transition-transform duration-500 ease-[var(--ease-expo-out)] group-hover/btn:translate-y-0 motion-reduce:transition-none"
      >
        {children}
      </span>
    </span>
  );
}

type Variants = VariantProps<typeof buttonVariants>;

export function Button({
  className,
  variant = "primary",
  size,
  children,
  icon,
  ...props
}: ComponentProps<"button"> & Variants & { icon?: ReactNode }) {
  return (
    <button className={cn(buttonVariants({ variant, size }), className)} {...props}>
      <Fill variant={variant ?? "primary"} />
      <Label>{children}</Label>
      {icon}
    </button>
  );
}

type ButtonLinkProps = Omit<ComponentProps<"a">, "href"> &
  Variants & { href: string; icon?: ReactNode; cursor?: string };

const isExternal = (href: string) => /^(https?:|mailto:|tel:|\/\/)/.test(href);

export function ButtonLink({
  className,
  variant = "primary",
  size,
  href,
  children,
  icon,
  cursor,
  ...props
}: ButtonLinkProps) {
  const cls = cn(buttonVariants({ variant, size }), className);
  const inner = (
    <>
      <Fill variant={variant ?? "primary"} />
      <Label>{children}</Label>
      {icon}
    </>
  );
  if (isExternal(href)) {
    return (
      <a
        href={href}
        className={cls}
        data-cursor={cursor}
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      >
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} className={cls} data-cursor={cursor} {...props}>
      {inner}
    </Link>
  );
}

/** `<MagneticButton>` from the brief: a ButtonLink that leans toward the cursor. */
export function MagneticButton({ strength, ...props }: ButtonLinkProps & { strength?: number }) {
  return (
    <Magnetic strength={strength}>
      <ButtonLink {...props} />
    </Magnetic>
  );
}
