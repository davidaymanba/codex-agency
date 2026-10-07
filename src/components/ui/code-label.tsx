import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Mono section label in the brand's code style: `{ 01 — Services }`.
 * The bracket run is isolated as LTR (so braces never flip), while the paragraph
 * itself follows the page direction (so it sits at the start edge in RTL too).
 */
export function CodeLabel({
  index,
  children,
  className,
}: {
  index?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("label-mono text-fg-muted", className)}>
      <span dir="ltr" className="inline-flex items-center gap-[0.6ch]">
        <span aria-hidden>{"{"}</span>
        {index && <span>{index} —</span>}
        <bdi className="text-link">{children}</bdi>
        <span aria-hidden>{"}"}</span>
      </span>
    </p>
  );
}
