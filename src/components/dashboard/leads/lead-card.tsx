"use client";

import { useFormatter, useNow, useTranslations } from "next-intl";
import type { Lead, Profile } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";
import { Avatar } from "../ui/primitives";

const money = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);

/** Compact kanban card. `lifted` = the drag overlay copy (shadow + slight tilt). */
export function LeadCardView({
  lead,
  users,
  lifted,
  fresh,
}: {
  lead: Lead;
  users: Profile[];
  lifted?: boolean;
  fresh?: boolean;
}) {
  const t = useTranslations("dash.leads");
  const format = useFormatter();
  const now = useNow({ updateInterval: 60_000 });
  const owner = users.find((u) => u.id === lead.assigned_to);
  return (
    <div
      className={cn(
        "border border-border bg-surface p-3.5 transition-[border-color,box-shadow] duration-150 hover:border-border-strong",
        lifted &&
          "rotate-[2.5deg] cursor-grabbing border-primary shadow-[0_24px_48px_-16px_color-mix(in_oklab,var(--color-navy-950)_45%,transparent)]",
        fresh && "animate-pulse-ring border-blue-400",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="truncate text-sm font-medium">{lead.name}</p>
        <span className="shrink-0 label-mono text-fg-muted">{lead.country}</span>
      </div>
      <p className="mt-0.5 truncate text-xs text-fg-muted">{lead.company ?? lead.email}</p>
      <div className="mt-3 flex items-center gap-2">
        <span className="bg-surface-2 px-1.5 py-0.5 text-[0.6875rem]">
          {t(`services.${lead.service}`)}
        </span>
        {lead.estimated_value != null && (
          <span className="text-xs font-medium tabular-nums" dir="ltr">
            {money(lead.estimated_value)}
          </span>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5 text-xs text-fg-muted">
        <span>{format.relativeTime(new Date(lead.created_at), now)}</span>
        {owner ? (
          <Avatar name={owner.full_name} className="size-6 text-[0.625rem]" />
        ) : (
          <span aria-hidden>—</span>
        )}
      </div>
    </div>
  );
}
