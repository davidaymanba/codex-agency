import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-[var(--radius-brand)] border border-border bg-surface", className)}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  action,
  className,
}: {
  title: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 border-b border-border px-5 py-4",
        className,
      )}
    >
      <h2 className="text-sm font-medium">{title}</h2>
      {action}
    </div>
  );
}

const inputCls =
  "w-full border border-border bg-bg px-3 text-sm text-fg outline-none transition-colors placeholder:text-fg-muted/70 hover:border-border-strong focus:border-primary aria-[invalid=true]:border-yellow-500";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(inputCls, "h-10", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(inputCls, "min-h-24 resize-y py-2.5", className)} {...props} />;
}

export function NativeSelect({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(inputCls, "h-10 cursor-pointer pe-8", className)} {...props} />;
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  return (
    <label className={cn("mb-1.5 block text-xs font-medium text-fg-muted", className)} {...props} />
  );
}

export function FieldError({ id, children }: { id?: string; children?: ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 flex items-center gap-2 text-xs">
      <span aria-hidden className="size-1.5 shrink-0 bg-yellow-500" />
      {children}
    </p>
  );
}

/** Shimmer skeleton block. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("relative overflow-hidden bg-surface-2", className)}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/25 to-transparent motion-reduce:hidden dark:via-white/5" />
    </div>
  );
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-8 shrink-0 place-items-center bg-primary text-xs font-medium text-white",
        className,
      )}
    >
      {initials}
    </span>
  );
}

/** Kbd hint, e.g. ⌘K. */
export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="border border-border bg-bg px-1.5 py-0.5 font-mono text-[0.625rem] text-fg-muted">
      {children}
    </kbd>
  );
}
