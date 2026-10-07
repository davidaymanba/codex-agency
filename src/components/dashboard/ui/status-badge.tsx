import type { LeadStatus } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

/** Palette-only status colours. Yellow is reserved for "proposal" (the money moment). */
export const STATUS_STYLE: Record<LeadStatus, { badge: string; dot: string }> = {
  new: {
    badge: "bg-blue-100 text-blue-600 dark:bg-blue-600/25 dark:text-blue-300",
    dot: "bg-blue-400",
  },
  contacted: {
    badge: "bg-indigo-200/60 text-indigo-700 dark:bg-indigo-700/40 dark:text-indigo-200",
    dot: "bg-indigo-700 dark:bg-indigo-200",
  },
  qualified: {
    badge: "bg-blue-300/40 text-navy-950 dark:bg-blue-400/20 dark:text-blue-300",
    dot: "bg-blue-600 dark:bg-blue-300",
  },
  proposal: {
    badge: "bg-yellow-200 text-navy-950 dark:bg-yellow-500/20 dark:text-yellow-400",
    dot: "bg-yellow-500",
  },
  won: { badge: "bg-blue-600 text-white", dot: "bg-blue-600 dark:bg-blue-400" },
  lost: { badge: "border border-border text-fg-muted", dot: "bg-indigo-200 dark:bg-indigo-700" },
};

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: LeadStatus;
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 px-2 text-xs font-medium whitespace-nowrap",
        STATUS_STYLE[status].badge,
        className,
      )}
    >
      {label}
    </span>
  );
}
