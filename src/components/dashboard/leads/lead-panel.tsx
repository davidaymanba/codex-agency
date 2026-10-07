"use client";

import { Mail, MessageCircle, Phone, X } from "lucide-react";
import { useFormatter, useNow, useTranslations } from "next-intl";
import { Dialog as D } from "radix-ui";
import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";
import { addNote, updateLeadFields } from "@/app/[locale]/dashboard/actions";
import {
  LEAD_STATUSES,
  type Lead,
  type LeadNote,
  type LeadStatus,
  type Profile,
} from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";
import { useCan } from "../shell/user-context";
import { DashButton } from "../ui/dash-button";
import { SheetContent, SheetTitle } from "../ui/overlays";
import { Avatar, Input, Label, NativeSelect, Textarea } from "../ui/primitives";
import { useQueryState } from "../use-query-state";

type Detail = { lead: Lead; notes: LeadNote[] };

/**
 * Lead detail side panel (opens from the inline-end edge, ?lead=id in the URL).
 * Status / assignee / value update optimistically and roll back on failure.
 */
export function LeadPanel({ detail, users }: { detail: Detail | null; users: Profile[] }) {
  const { set } = useQueryState();
  return (
    <D.Root open={!!detail} onOpenChange={(o) => !o && set({ lead: null })}>
      {detail && (
        <PanelBody
          key={detail.lead.id + detail.lead.updated_at}
          detail={detail}
          users={users}
          onClose={() => set({ lead: null })}
        />
      )}
    </D.Root>
  );
}

function PanelBody({
  detail,
  users,
  onClose,
}: {
  detail: Detail;
  users: Profile[];
  onClose: () => void;
}) {
  const t = useTranslations("dash");
  const format = useFormatter();
  const now = useNow({ updateInterval: 60_000 });
  const canEdit = useCan("editor");
  const [, start] = useTransition();
  const [lead, patchLead] = useOptimistic(detail.lead, (cur: Lead, p: Partial<Lead>) => ({
    ...cur,
    ...p,
  }));
  const [value, setValue] = useState(detail.lead.estimated_value?.toString() ?? "");
  const [note, setNote] = useState("");
  const [posting, setPosting] = useState(false);
  const userName = (id: string | null) => users.find((u) => u.id === id)?.full_name;

  const update = (p: {
    status?: LeadStatus;
    assigned_to?: string | null;
    estimated_value?: number | null;
  }) =>
    start(async () => {
      patchLead(p);
      const r = await updateLeadFields(lead.id, p);
      if (r.ok) toast(t("common.saved"));
      else toast.error(r.error === "forbidden" ? t("common.forbidden") : t("common.error"));
    });

  const saveValue = () => {
    const n =
      value.trim() === "" ? null : Math.max(0, Math.round(Number(value.replace(/[^\d.]/g, ""))));
    if (Number.isNaN(n) || n === lead.estimated_value) return;
    update({ estimated_value: n });
  };

  const postNote = async () => {
    if (!note.trim()) return;
    setPosting(true);
    const r = await addNote(lead.id, note);
    setPosting(false);
    if (r.ok) setNote("");
    else toast.error(t("common.error"));
  };

  const phone = lead.phone.replace(/[^\d+]/g, "");

  return (
    <SheetContent title={t("leads.details")}>
      <header className="flex items-start justify-between gap-4 border-b border-border p-5">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={lead.name} className="size-11 text-sm" />
          <div className="min-w-0">
            <SheetTitle className="truncate text-lg font-medium">{lead.name}</SheetTitle>
            <p className="truncate text-sm text-fg-muted">{lead.company ?? "—"}</p>
          </div>
        </div>
        <DashButton variant="ghost" size="icon-sm" onClick={onClose} aria-label={t("common.close")}>
          <X />
        </DashButton>
      </header>

      <div className="flex-1 space-y-6 overflow-y-auto p-5" data-lenis-prevent>
        <div className="flex flex-wrap gap-2">
          <DashButton asChild size="sm" variant="primary">
            <a
              href={`https://wa.me/${phone.replace("+", "")}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle aria-hidden />
              {t("leads.whatsapp")}
            </a>
          </DashButton>
          <DashButton asChild size="sm">
            <a href={`mailto:${lead.email}`}>
              <Mail aria-hidden />
              {t("leads.email")}
            </a>
          </DashButton>
          <DashButton asChild size="sm">
            <a href={`tel:${phone}`}>
              <Phone aria-hidden />
              {t("leads.call")}
            </a>
          </DashButton>
        </div>

        <section className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="lp-status">{t("leads.status")}</Label>
            <NativeSelect
              id="lp-status"
              value={lead.status}
              disabled={!canEdit}
              onChange={(e) => update({ status: e.target.value as LeadStatus })}
            >
              {LEAD_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(`leads.statuses.${s}`)}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div>
            <Label htmlFor="lp-owner">{t("leads.assignee")}</Label>
            <NativeSelect
              id="lp-owner"
              value={lead.assigned_to ?? ""}
              disabled={!canEdit}
              onChange={(e) => update({ assigned_to: e.target.value || null })}
            >
              <option value="">{t("common.unassigned")}</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div>
            <Label htmlFor="lp-value">{t("leads.value")} (USD)</Label>
            <Input
              id="lp-value"
              inputMode="numeric"
              dir="ltr"
              value={value}
              disabled={!canEdit}
              onChange={(e) => setValue(e.target.value)}
              onBlur={saveValue}
              onKeyDown={(e) => e.key === "Enter" && saveValue()}
              className="rtl:text-end"
            />
          </div>
        </section>

        <dl className="grid gap-x-4 gap-y-3 border-y border-border py-5 text-sm sm:grid-cols-2">
          {[
            [
              t("leads.email"),
              <span key="e" dir="ltr">
                {lead.email}
              </span>,
            ],
            [
              t("leads.call"),
              <span key="p" dir="ltr">
                {lead.phone}
              </span>,
            ],
            [t("leads.service"), t(`leads.services.${lead.service}`)],
            [t("leads.budget"), t(`leads.budgets.${lead.budget}`)],
            [t("leads.country"), lead.country],
            [
              t("leads.source"),
              <span key="s" dir="ltr">
                {lead.source_page ?? "—"}
                {lead.utm ? ` · ${Object.values(lead.utm).join(" / ")}` : ""}
              </span>,
            ],
            [
              t("leads.created"),
              format.dateTime(new Date(lead.created_at), {
                dateStyle: "medium",
                timeStyle: "short",
                numberingSystem: "latn",
              }),
            ],
          ].map(([k, v], i) => (
            <div key={i} className="min-w-0">
              <dt className="text-xs text-fg-muted">{k}</dt>
              <dd className="mt-0.5 truncate">{v}</dd>
            </div>
          ))}
        </dl>

        <section>
          <h3 className="text-xs font-medium text-fg-muted">{t("leads.message")}</h3>
          <p
            className="mt-2 border-s-2 border-primary bg-surface-2/60 px-4 py-3 text-sm whitespace-pre-line"
            dir="auto"
          >
            {lead.message}
          </p>
        </section>

        <section>
          <h3 className="mb-3 text-xs font-medium text-fg-muted">{t("leads.notes")}</h3>
          {canEdit && (
            <div className="mb-5">
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t("leads.addNote")}
                aria-label={t("leads.addNote")}
                rows={3}
                dir="auto"
              />
              <div className="mt-2 flex justify-end">
                <DashButton
                  size="sm"
                  variant="primary"
                  disabled={!note.trim() || posting}
                  onClick={postNote}
                >
                  {t("leads.postNote")}
                </DashButton>
              </div>
            </div>
          )}
          <ol className="relative space-y-4 before:absolute before:inset-y-1 before:start-[0.3125rem] before:w-px before:bg-border">
            {detail.notes.map((n) => (
              <li key={n.id} className="relative flex gap-3">
                <span
                  aria-hidden
                  className={cn(
                    "relative z-10 mt-1.5 size-2.5 shrink-0",
                    n.kind === "note"
                      ? "bg-primary"
                      : n.kind === "status"
                        ? "bg-yellow-500"
                        : "bg-indigo-200 dark:bg-indigo-700",
                  )}
                />
                <div className="min-w-0 text-sm">
                  <p dir="auto" className={cn(n.kind !== "note" && "text-fg-muted")}>
                    {n.body}
                  </p>
                  <p className="mt-0.5 text-xs text-fg-muted">
                    {userName(n.author_id) ?? "CODEX"} ·{" "}
                    {format.relativeTime(new Date(n.created_at), now)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </SheetContent>
  );
}
