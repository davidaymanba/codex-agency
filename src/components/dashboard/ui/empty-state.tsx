import type { ReactNode } from "react";
import { BracketGlyph } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

/** On-brand empty state: a few blocks between brackets + message + call to action. */
export function EmptyState({
  title,
  body,
  action,
  className,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("flex flex-col items-center justify-center px-6 py-16 text-center", className)}
    >
      <div
        aria-hidden
        dir="ltr"
        className="flex items-center gap-3 text-[3.5rem] leading-none text-link"
      >
        <BracketGlyph side="left" />
        <span className="grid grid-cols-3 gap-1">
          {[1, 0, 1, 0, 1, 0, 1, 1, 0].map((on, i) => (
            <span key={i} className={cn("size-3", on ? "bg-primary" : "bg-surface-2")} />
          ))}
        </span>
        <BracketGlyph side="right" />
      </div>
      <h3 className="mt-6 text-base font-medium">{title}</h3>
      {body && <p className="mt-1 max-w-sm text-sm text-fg-muted">{body}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
