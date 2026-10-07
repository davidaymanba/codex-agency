"use client";

import { Download, Filter, KanbanSquare, Search, Table2, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { LEAD_STATUSES } from "@/lib/dashboard/types";
import { LEAD_SERVICES } from "@/lib/schemas/lead";
import { DashButton } from "../ui/dash-button";
import {
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuLabel,
  MenuSeparator,
  MenuTrigger,
} from "../ui/overlays";
import { Input, NativeSelect } from "../ui/primitives";
import { Segmented } from "../ui/segmented";
import { useQueryState } from "../use-query-state";

/** Search (debounced), status/service filters, board/table toggle, CSV export — all in the URL. */
export function LeadsToolbar({ view }: { view: "board" | "table" }) {
  const t = useTranslations("dash");
  const locale = useLocale();
  const { params, set } = useQueryState();
  const [q, setQ] = useState(params.get("q") ?? "");
  const statuses = (params.get("status") ?? "").split(",").filter(Boolean);
  const service = params.get("service") ?? "";

  useEffect(() => {
    const id = setTimeout(() => {
      if ((params.get("q") ?? "") !== q) set({ q }, { resetPage: true });
    }, 300);
    return () => clearTimeout(id);
  }, [q, params, set]);

  const toggleStatus = (s: string) => {
    const next = statuses.includes(s) ? statuses.filter((x) => x !== s) : [...statuses, s];
    set({ status: next.join(",") }, { resetPage: true });
  };
  const hasFilters = statuses.length > 0 || service || q;
  const exportHref = `/api/dashboard/leads/export?${new URLSearchParams({ locale, ...(q && { q }), ...(service && { service }), ...(statuses.length && { status: statuses.join(",") }) })}`;

  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      <div className="relative w-full sm:w-72">
        <Search
          aria-hidden
          className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-fg-muted"
        />
        <Input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("leads.searchPlaceholder")}
          aria-label={t("common.search")}
          className="ps-9"
        />
      </div>

      <Menu>
        <MenuTrigger asChild>
          <DashButton>
            <Filter aria-hidden />
            {t("leads.status")}
            {statuses.length > 0 && (
              <span className="bg-primary px-1.5 text-xs text-white">{statuses.length}</span>
            )}
          </DashButton>
        </MenuTrigger>
        <MenuContent align="start">
          <MenuLabel>{t("leads.status")}</MenuLabel>
          <MenuSeparator />
          {LEAD_STATUSES.map((s) => (
            <MenuCheckboxItem
              key={s}
              checked={statuses.includes(s)}
              onCheckedChange={() => toggleStatus(s)}
              onSelect={(e) => e.preventDefault()}
            >
              {t(`leads.statuses.${s}`)}
            </MenuCheckboxItem>
          ))}
        </MenuContent>
      </Menu>

      <NativeSelect
        aria-label={t("leads.service")}
        value={service}
        onChange={(e) => set({ service: e.target.value }, { resetPage: true })}
        className="w-auto"
      >
        <option value="">
          {t("leads.service")}: {t("common.all")}
        </option>
        {LEAD_SERVICES.map((s) => (
          <option key={s} value={s}>
            {t(`leads.services.${s}`)}
          </option>
        ))}
      </NativeSelect>

      {hasFilters && (
        <DashButton
          variant="ghost"
          onClick={() => {
            setQ("");
            set({ q: null, status: null, service: null }, { resetPage: true });
          }}
        >
          <X aria-hidden />
          {t("common.clear")}
        </DashButton>
      )}

      <div className="ms-auto flex items-center gap-2">
        <DashButton asChild>
          <a href={exportHref} download>
            <Download aria-hidden />
            <span className="hidden sm:inline">{t("common.export")}</span>
          </a>
        </DashButton>
        <Segmented
          label={t("leads.title")}
          value={view}
          onChange={(v) => set({ view: v === "board" ? null : v, page: null })}
          options={[
            {
              value: "board",
              label: (
                <>
                  <KanbanSquare aria-hidden />
                  {t("leads.board")}
                </>
              ),
            },
            {
              value: "table",
              label: (
                <>
                  <Table2 aria-hidden />
                  {t("leads.table")}
                </>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
