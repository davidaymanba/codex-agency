"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, LayoutGrid, Star, Table2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition, useId } from "react";
import { toast } from "sonner";
import { patchProject, reorderProjects } from "@/app/[locale]/dashboard/content/actions";
import { ProjectCover } from "@/components/sections/home/project-cover";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { BrandSwitch } from "../form/fields";
import { useCan } from "../shell/user-context";
import { EmptyState } from "../ui/empty-state";
import { Card } from "../ui/primitives";
import { Segmented } from "../ui/segmented";

export type ProjectListItem = {
  id: string;
  slug: string;
  title: string;
  client: string;
  category: string;
  year: number;
  status: "draft" | "published";
  featured: boolean;
  cover: string | null;
  coverStyle: "grid" | "blocks" | "brackets" | "chart" | "flow";
};

function StatusPill({ status }: { status: ProjectListItem["status"] }) {
  const t = useTranslations("dash.projects");
  return (
    <span
      className={cn(
        "px-1.5 py-0.5 label-mono",
        status === "published" ? "bg-blue-600 text-white" : "bg-surface-2 text-fg-muted",
      )}
    >
      {t(status)}
    </span>
  );
}

function GridCard({
  p,
  canEdit,
  onFeature,
  onPublish,
}: {
  p: ProjectListItem;
  canEdit: boolean;
  onFeature: () => void;
  onPublish: (v: boolean) => void;
}) {
  const t = useTranslations("dash");
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: p.id,
    disabled: !canEdit,
  });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group border border-border bg-surface transition-shadow",
        isDragging && "relative z-10 rotate-1 shadow-2xl",
      )}
    >
      <Link
        href={`/dashboard/projects/${p.id}`}
        tabIndex={-1}
        aria-hidden
        className="relative block aspect-[4/3] overflow-hidden"
      >
        <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105">
          <ProjectCover
            project={{ slug: p.slug, cover: p.cover, coverStyle: p.coverStyle, label: p.client }}
          />
        </div>
      </Link>
      <div className="flex items-start gap-2 p-3">
        {canEdit && (
          <button
            type="button"
            {...attributes}
            {...listeners}
            aria-label={t("form.dragHandle")}
            className="mt-0.5 grid size-7 shrink-0 cursor-grab place-items-center text-fg-muted hover:text-fg active:cursor-grabbing"
          >
            <GripVertical className="size-4" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <Link
            href={`/dashboard/projects/${p.id}`}
            className="block truncate text-sm font-medium hover:text-link"
            dir="auto"
          >
            {p.title}
          </Link>
          <p className="mt-0.5 text-xs text-fg-muted">
            {p.category} · <span dir="ltr">{p.year}</span>
          </p>
          <div className="mt-2 flex items-center gap-2">
            <StatusPill status={p.status} />
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button
            type="button"
            onClick={onFeature}
            disabled={!canEdit}
            aria-pressed={p.featured}
            aria-label={t("projects.featured")}
            className={cn(
              "grid size-7 place-items-center transition-colors",
              p.featured ? "text-yellow-500" : "text-fg-muted hover:text-fg",
            )}
          >
            <Star className={cn("size-4", p.featured && "fill-current")} />
          </button>
          <BrandSwitch
            checked={p.status === "published"}
            onCheckedChange={onPublish}
            disabled={!canEdit}
            aria-label={t("projects.published")}
          />
        </div>
      </div>
    </li>
  );
}

/** Projects: sortable grid (drag = Work page order) or compact table; optimistic toggles. */
export function ProjectsList({
  items: initial,
  view,
}: {
  items: ProjectListItem[];
  view: "grid" | "table";
}) {
  const dndId = useId();
  const t = useTranslations("dash");
  const canEdit = useCan("editor");
  const [items, setItems] = useState(initial);
  const [mode, setMode] = useState(view);
  const [, start] = useTransition();
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(initial);
  }, [initial]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const patch = (
    p: ProjectListItem,
    change: Partial<Pick<ProjectListItem, "featured" | "status">>,
  ) => {
    const before = items;
    setItems((list) => list.map((x) => (x.id === p.id ? { ...x, ...change } : x)));
    start(async () => {
      const r = await patchProject(p.id, change);
      if (!r.ok) {
        setItems(before);
        toast.error(t("common.error"));
      }
    });
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const before = items;
    const next = arrayMove(
      items,
      items.findIndex((i) => i.id === active.id),
      items.findIndex((i) => i.id === over.id),
    );
    setItems(next);
    start(async () => {
      const r = await reorderProjects(next.map((i) => i.id));
      if (r.ok) toast(t("form.reordered"));
      else {
        setItems(before);
        toast.error(t("common.error"));
      }
    });
  };

  if (!items.length)
    return (
      <Card>
        <EmptyState title={t("content.empty")} body={t("content.emptyBody")} />
      </Card>
    );

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-xs text-fg-muted">
          {mode === "grid" && canEdit
            ? t("projects.dragToReorder")
            : t("common.results", { n: items.length })}
        </p>
        <Segmented
          label={t("sections.projects")}
          value={mode}
          onChange={setMode}
          options={[
            {
              value: "grid",
              label: (
                <>
                  <LayoutGrid aria-hidden />
                  {t("projects.grid")}
                </>
              ),
            },
            {
              value: "table",
              label: (
                <>
                  <Table2 aria-hidden />
                  {t("projects.table")}
                </>
              ),
            },
          ]}
        />
      </div>
      {mode === "grid" ? (
        <DndContext
          id={dndId}
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((p) => (
                <GridCard
                  key={p.id}
                  p={p}
                  canEdit={canEdit}
                  onFeature={() => patch(p, { featured: !p.featured })}
                  onPublish={(v) => patch(p, { status: v ? "published" : "draft" })}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="overflow-x-auto border border-border bg-surface">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-xs text-fg-muted">
              <tr>
                <th className="px-4 py-3 text-start font-medium">{t("fields.title")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("fields.category")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("fields.year")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("fields.status")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("projects.featured")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-border last:border-b-0 hover:bg-surface-2"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/projects/${p.id}`}
                      className="font-medium hover:text-link"
                      dir="auto"
                    >
                      {p.title}
                    </Link>
                    <span className="block text-xs text-fg-muted">{p.client}</span>
                  </td>
                  <td className="px-4 py-3">{p.category}</td>
                  <td className="px-4 py-3" dir="ltr">
                    {p.year}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={p.status} />
                  </td>
                  <td className="px-4 py-3">
                    <BrandSwitch
                      checked={p.featured}
                      disabled={!canEdit}
                      onCheckedChange={(v) => patch(p, { featured: v })}
                      aria-label={t("projects.featured")}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
