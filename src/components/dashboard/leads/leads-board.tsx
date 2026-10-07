"use client";

import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslations } from "next-intl";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { moveLead } from "@/app/[locale]/dashboard/actions";
import { LEAD_STATUSES, type Lead, type LeadStatus, type Profile } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";
import { useLeadStream } from "../shell/lead-stream";
import { useCan } from "../shell/user-context";
import { STATUS_STYLE } from "../ui/status-badge";
import { useQueryState } from "../use-query-state";
import { LeadCardView } from "./lead-card";

type Columns = Record<LeadStatus, Lead[]>;

const group = (leads: Lead[]): Columns =>
  Object.fromEntries(
    LEAD_STATUSES.map((s) => [
      s,
      leads.filter((l) => l.status === s).sort((a, b) => a.position - b.position),
    ]),
  ) as Columns;

function SortableCard({
  lead,
  users,
  disabled,
  fresh,
  onOpen,
}: {
  lead: Lead;
  users: Profile[];
  disabled: boolean;
  fresh: boolean;
  onOpen: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
    disabled,
  });
  return (
    <li className="list-none">
      <div
        ref={setNodeRef}
        style={{ transform: CSS.Transform.toString(transform), transition }}
        className={cn("touch-manipulation", isDragging && "opacity-30")}
        {...attributes}
        {...listeners}
        onClick={onOpen}
        onKeyDown={(e) => {
          listeners?.onKeyDown?.(e);
          if (e.key === "Enter") onOpen();
        }}
      >
        <LeadCardView lead={lead} users={users} fresh={fresh} />
      </div>
    </li>
  );
}

function Column({
  status,
  children,
  count,
  total,
}: {
  status: LeadStatus;
  children: React.ReactNode;
  count: number;
  total: number;
}) {
  const t = useTranslations("dash.leads");
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <section
      aria-label={t(`statuses.${status}`)}
      className="flex w-72 shrink-0 snap-start flex-col bg-surface-2/50 md:w-auto md:min-w-0 md:flex-1"
    >
      <header className="flex items-center gap-2 px-3 py-3">
        <span aria-hidden className={cn("size-2", STATUS_STYLE[status].dot)} />
        <h2 className="text-sm font-medium">{t(`statuses.${status}`)}</h2>
        <span className="ms-auto text-xs text-fg-muted tabular-nums">{count}</span>
      </header>
      {total > 0 && (
        <p className="-mt-2 px-3 pb-2 text-xs text-fg-muted tabular-nums" dir="ltr">
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            notation: "compact",
          }).format(total)}
        </p>
      )}
      <ul
        ref={setNodeRef}
        className={cn(
          "flex min-h-32 flex-1 flex-col gap-2 p-2 transition-colors duration-150",
          isOver && "bg-blue-100/60 dark:bg-blue-600/10",
        )}
      >
        {children}
      </ul>
    </section>
  );
}

/**
 * Kanban pipeline. Drag between statuses (pointer + keyboard), other cards make room,
 * the dragged card lifts with a tilt. Optimistic: UI updates instantly, rolls back + toasts
 * if the server rejects. Viewers get a read-only board.
 */
export function LeadsBoard({ leads, users }: { leads: Lead[]; users: Profile[] }) {
  const dndId = useId();
  const t = useTranslations("dash.leads");
  const canEdit = useCan("editor");
  const { fresh } = useLeadStream();
  const { set } = useQueryState();
  const [cols, setCols] = useState<Columns>(() => group(leads));
  const [activeId, setActiveId] = useState<string | null>(null);
  const snapshot = useRef<Columns | null>(null);

  // Server data changed (refresh / new lead) → resync when not mid-drag.
  useEffect(() => {
    // Mirror fresh server rows into local optimistic state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!activeId) setCols(group(leads));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leads]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const byId = useMemo(
    () =>
      new Map(
        Object.values(cols)
          .flat()
          .map((l) => [l.id, l]),
      ),
    [cols],
  );
  const findCol = (id: string): LeadStatus | undefined =>
    (LEAD_STATUSES as readonly string[]).includes(id)
      ? (id as LeadStatus)
      : LEAD_STATUSES.find((s) => cols[s].some((l) => l.id === id));

  const onStart = (e: DragStartEvent) => {
    snapshot.current = cols;
    setActiveId(String(e.active.id));
  };

  const onOver = ({ active, over }: DragOverEvent) => {
    if (!over) return;
    const from = findCol(String(active.id));
    const to = findCol(String(over.id));
    if (!from || !to || from === to) return;
    setCols((prev) => {
      const moving = prev[from].find((l) => l.id === active.id)!;
      const overIndex = prev[to].findIndex((l) => l.id === over.id);
      const index = overIndex >= 0 ? overIndex : prev[to].length;
      return {
        ...prev,
        [from]: prev[from].filter((l) => l.id !== active.id),
        [to]: [...prev[to].slice(0, index), { ...moving, status: to }, ...prev[to].slice(index)],
      };
    });
  };

  const onEnd = async ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    const id = String(active.id);
    const col = findCol(id);
    if (!over || !col) {
      if (snapshot.current) setCols(snapshot.current);
      return;
    }
    let next = cols;
    const overCol = findCol(String(over.id));
    if (overCol === col) {
      const oldI = cols[col].findIndex((l) => l.id === id);
      const newI = cols[col].findIndex((l) => l.id === over.id);
      if (newI >= 0 && oldI !== newI) {
        next = { ...cols, [col]: arrayMove(cols[col], oldI, newI) };
        setCols(next);
      }
    }
    const before = snapshot.current;
    const prevStatus = before && LEAD_STATUSES.find((s) => before[s].some((l) => l.id === id));
    const res = await moveLead(
      id,
      col,
      next[col].map((l) => l.id),
    );
    if (!res.ok) {
      if (before) setCols(before);
      toast.error(t("moveFailed"));
    } else if (prevStatus !== col) {
      toast(t("moved", { status: t(`statuses.${col}`) }));
    }
  };

  const active = activeId ? byId.get(activeId) : null;

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onStart}
      onDragOver={onOver}
      onDragEnd={onEnd}
      onDragCancel={() => {
        setActiveId(null);
        if (snapshot.current) setCols(snapshot.current);
      }}
    >
      <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-4 md:mx-0 md:px-0">
        {LEAD_STATUSES.map((status) => (
          <Column
            key={status}
            status={status}
            count={cols[status].length}
            total={cols[status].reduce((s, l) => s + (l.estimated_value ?? 0), 0)}
          >
            <SortableContext
              items={cols[status].map((l) => l.id)}
              strategy={verticalListSortingStrategy}
            >
              {cols[status].map((lead) => (
                <SortableCard
                  key={lead.id}
                  lead={lead}
                  users={users}
                  disabled={!canEdit}
                  fresh={fresh.has(lead.id)}
                  onOpen={() => set({ lead: lead.id })}
                />
              ))}
            </SortableContext>
          </Column>
        ))}
      </div>
      <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.16,1,0.3,1)" }}>
        {active ? <LeadCardView lead={active} users={users} lifted /> : null}
      </DragOverlay>
    </DndContext>
  );
}
