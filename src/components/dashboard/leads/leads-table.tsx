"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useFormatter, useNow, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { bulkDelete, bulkUpdateStatus } from "@/app/[locale]/dashboard/actions";
import { usePrefersReducedMotion } from "@/hooks/use-media";
import { LEAD_STATUSES, type Lead, type Profile } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";
import { useLeadStream } from "../shell/lead-stream";
import { useCan } from "../shell/user-context";
import { DashButton } from "../ui/dash-button";
import { EmptyState } from "../ui/empty-state";
import {
  ConfirmDialog,
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuTrigger,
} from "../ui/overlays";
import { Avatar } from "../ui/primitives";
import { StatusBadge } from "../ui/status-badge";
import { useQueryState } from "../use-query-state";

const money = (n: number | null) =>
  n == null
    ? "—"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(n);
type SortKey = "created_at" | "name" | "estimated_value" | "status";
const SORT_OF: Record<string, SortKey> = {
  name: "name",
  status: "status",
  value: "estimated_value",
  created: "created_at",
};

/**
 * Server-paginated, server-sorted leads table (TanStack Table in manual mode).
 * Row selection → bulk move / delete (confirmed). Column visibility menu.
 * On small screens rows render as cards.
 */
export function LeadsTable({
  rows,
  total,
  page,
  pageSize,
  sort,
  dir,
  users,
}: {
  rows: Lead[];
  total: number;
  page: number;
  pageSize: number;
  sort: SortKey;
  dir: "asc" | "desc";
  users: Profile[];
}) {
  const t = useTranslations("dash");
  const format = useFormatter();
  const now = useNow({ updateInterval: 60_000 });
  const canEdit = useCan("editor");
  const reduced = usePrefersReducedMotion();
  const { fresh } = useLeadStream();
  const { set, pending } = useQueryState();
  const [selection, setSelection] = useState<RowSelectionState>({});
  const [visibility, setVisibility] = useState<VisibilityState>({ country: false, budget: false });
  const [confirm, setConfirm] = useState(false);
  const owner = (id: string | null) => users.find((u) => u.id === id);

  const SortHead = ({ id, label }: { id: SortKey; label: string }) => {
    const on = sort === id;
    const Icon = !on ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown;
    return (
      <button
        type="button"
        onClick={() =>
          set({ sort: id, dir: on && dir === "desc" ? "asc" : "desc" }, { resetPage: true })
        }
        className={cn("inline-flex items-center gap-1 hover:text-fg", on && "text-fg")}
      >
        {label}
        <Icon aria-hidden className="size-3" />
      </button>
    );
  };

  const columns = useMemo<ColumnDef<Lead>[]>(
    () => [
      {
        id: "select",
        enableHiding: false,
        header: ({ table }) => (
          <input
            type="checkbox"
            aria-label="Select all"
            className="size-4 accent-[var(--primary)]"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            disabled={!canEdit}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            aria-label={`Select ${row.original.name}`}
            className="size-4 accent-[var(--primary)]"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            onClick={(e) => e.stopPropagation()}
            disabled={!canEdit}
          />
        ),
      },
      {
        id: "name",
        enableHiding: false,
        header: () => <SortHead id="name" label={t("leads.contact")} />,
        cell: ({ row: { original: l } }) => (
          <span className="flex min-w-0 items-center gap-3">
            <Avatar name={l.name} />
            <span className="min-w-0">
              <span className="block truncate font-medium">{l.name}</span>
              <span className="block truncate text-xs text-fg-muted" dir="ltr">
                {l.email}
              </span>
            </span>
          </span>
        ),
      },
      {
        id: "status",
        header: () => <SortHead id="status" label={t("leads.status")} />,
        cell: ({ row: { original: l } }) => (
          <StatusBadge status={l.status} label={t(`leads.statuses.${l.status}`)} />
        ),
      },
      {
        id: "service",
        header: t("leads.service"),
        cell: ({ row: { original: l } }) => t(`leads.services.${l.service}`),
      },
      {
        id: "budget",
        header: t("leads.budget"),
        cell: ({ row: { original: l } }) => <span dir="ltr">{t(`leads.budgets.${l.budget}`)}</span>,
      },
      {
        id: "value",
        header: () => <SortHead id="estimated_value" label={t("leads.value")} />,
        cell: ({ row: { original: l } }) => (
          <span className="tabular-nums" dir="ltr">
            {money(l.estimated_value)}
          </span>
        ),
      },
      {
        id: "assignee",
        header: t("leads.assignee"),
        cell: ({ row: { original: l } }) => {
          const o = owner(l.assigned_to);
          return o ? (
            <span className="flex items-center gap-2">
              <Avatar name={o.full_name} className="size-6 text-[0.625rem]" />
              <span className="truncate">{o.full_name.split(" ")[0]}</span>
            </span>
          ) : (
            <span className="text-fg-muted">{t("common.unassigned")}</span>
          );
        },
      },
      {
        id: "country",
        header: t("leads.country"),
        cell: ({ row: { original: l } }) => <span className="label-mono">{l.country}</span>,
      },
      {
        id: "created",
        header: () => <SortHead id="created_at" label={t("leads.created")} />,
        cell: ({ row: { original: l } }) => (
          <span className="whitespace-nowrap text-fg-muted">
            {format.relativeTime(new Date(l.created_at), now)}
          </span>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, canEdit, sort, dir, users, now],
  );

  const table = useReactTable({
    data: rows,
    columns,
    getRowId: (r) => r.id,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    state: { rowSelection: selection, columnVisibility: visibility },
    onRowSelectionChange: setSelection,
    onColumnVisibilityChange: setVisibility,
    enableRowSelection: canEdit,
  });

  const selectedIds = Object.keys(selection).filter((k) => selection[k]);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const open = (id: string) => set({ lead: id });

  const bulkMove = async (status: (typeof LEAD_STATUSES)[number]) => {
    const r = await bulkUpdateStatus(selectedIds, status);
    if (r.ok) {
      toast(t("leads.moved", { status: t(`leads.statuses.${status}`) }));
      setSelection({});
    } else toast.error(t("common.forbidden"));
  };
  const doDelete = async () => {
    const r = await bulkDelete(selectedIds);
    if (r.ok) {
      toast(t("leads.deleted", { n: r.data ?? selectedIds.length }));
      setSelection({});
    } else toast.error(t("common.forbidden"));
  };

  if (!rows.length) {
    return (
      <div className="border border-border bg-surface">
        <EmptyState title={t("leads.emptyTitle")} body={t("leads.emptyFiltered")} />
      </div>
    );
  }

  return (
    <div className={cn("transition-opacity duration-150", pending && "opacity-60")}>
      {/* toolbar: selection + columns */}
      <div className="mb-3 flex min-h-10 flex-wrap items-center gap-2">
        <AnimatePresence initial={false}>
          {selectedIds.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="flex items-center gap-2 bg-primary px-3 py-1.5 text-sm text-white"
            >
              <span className="tabular-nums">
                {t("common.selected", { n: selectedIds.length })}
              </span>
              <Menu>
                <MenuTrigger asChild>
                  <button
                    type="button"
                    className="border border-white/30 px-2 py-0.5 text-xs hover:bg-white/10"
                  >
                    {t("leads.bulkStatus")}
                  </button>
                </MenuTrigger>
                <MenuContent align="start">
                  {LEAD_STATUSES.map((s) => (
                    <MenuItem key={s} onSelect={() => bulkMove(s)}>
                      <StatusBadge status={s} label={t(`leads.statuses.${s}`)} />
                    </MenuItem>
                  ))}
                </MenuContent>
              </Menu>
              <button
                type="button"
                onClick={() => setConfirm(true)}
                className="inline-flex items-center gap-1 border border-white/30 px-2 py-0.5 text-xs hover:bg-yellow-500 hover:text-navy-950"
              >
                <Trash2 aria-hidden className="size-3" />
                {t("leads.bulkDelete")}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <p className="text-xs text-fg-muted tabular-nums">{t("common.results", { n: total })}</p>
        <Menu>
          <MenuTrigger asChild>
            <DashButton size="sm" className="ms-auto hidden md:inline-flex">
              <Columns3 aria-hidden />
              {t("common.columns")}
            </DashButton>
          </MenuTrigger>
          <MenuContent>
            <MenuLabel>{t("common.columns")}</MenuLabel>
            {table
              .getAllLeafColumns()
              .filter((c) => c.getCanHide())
              .map((c) => (
                <MenuCheckboxItem
                  key={c.id}
                  checked={c.getIsVisible()}
                  onCheckedChange={(v) => c.toggleVisibility(!!v)}
                  onSelect={(e) => e.preventDefault()}
                >
                  {t(
                    `leads.${c.id === "created" ? "created" : c.id === "value" ? "value" : (c.id as "status")}`,
                  )}
                </MenuCheckboxItem>
              ))}
          </MenuContent>
        </Menu>
      </div>

      {/* desktop table */}
      <div className="hidden overflow-x-auto border border-border bg-surface md:block">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-start text-xs text-fg-muted">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th
                    key={h.id}
                    className="px-4 py-3 text-start font-medium whitespace-nowrap"
                    aria-sort={
                      SORT_OF[h.id] && SORT_OF[h.id] === sort
                        ? dir === "asc"
                          ? "ascending"
                          : "descending"
                        : undefined
                    }
                  >
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, i) => (
              <motion.tr
                key={row.id}
                initial={reduced ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: Math.min(i, 12) * 0.02 }}
                onClick={() => open(row.id)}
                className={cn(
                  "cursor-pointer border-b border-border transition-colors duration-150 last:border-b-0 hover:bg-surface-2",
                  row.getIsSelected() && "bg-blue-100/50 dark:bg-blue-600/10",
                  fresh.has(row.id) && "animate-pulse-ring",
                )}
              >
                {row.getVisibleCells().map((c) => (
                  <td key={c.id} className="max-w-64 px-4 py-3">
                    {flexRender(c.column.columnDef.cell, c.getContext())}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* mobile cards */}
      <ul className="space-y-2 md:hidden">
        {rows.map((l) => (
          <li key={l.id}>
            <button
              type="button"
              onClick={() => open(l.id)}
              className="w-full border border-border bg-surface p-4 text-start"
            >
              <span className="flex items-center justify-between gap-3">
                <span className="truncate font-medium">{l.name}</span>
                <StatusBadge status={l.status} label={t(`leads.statuses.${l.status}`)} />
              </span>
              <span className="mt-1 block truncate text-xs text-fg-muted">
                {t(`leads.services.${l.service}`)} ·{" "}
                {format.relativeTime(new Date(l.created_at), now)}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {/* pagination (server-side) */}
      <nav aria-label="Pagination" className="mt-4 flex items-center justify-between gap-3 text-sm">
        <p className="text-fg-muted tabular-nums">{t("common.page", { page, pages })}</p>
        <div className="flex gap-2">
          <DashButton
            size="sm"
            disabled={page <= 1}
            onClick={() => set({ page: String(page - 1) })}
          >
            <ChevronLeft aria-hidden className="rtl:-scale-x-100" />
            {t("common.prev")}
          </DashButton>
          <DashButton
            size="sm"
            disabled={page >= pages}
            onClick={() => set({ page: String(page + 1) })}
          >
            {t("common.next")}
            <ChevronRight aria-hidden className="rtl:-scale-x-100" />
          </DashButton>
        </div>
      </nav>

      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={t("leads.deleteTitle", { n: selectedIds.length })}
        body={t("leads.deleteBody")}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        onConfirm={doDelete}
      />
    </div>
  );
}
