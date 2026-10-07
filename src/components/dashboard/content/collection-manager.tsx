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
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { zodResolver } from "@hookform/resolvers/zod";
import { GripVertical, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Dialog as D } from "radix-ui";
import { useEffect, useState, useTransition, useId } from "react";
import { FormProvider, useForm, type FieldValues } from "react-hook-form";
import { toast } from "sonner";
import {
  deleteCollectionItem,
  reorderCollection,
  saveCollectionItem,
  setCollectionPublished,
} from "@/app/[locale]/dashboard/content/actions";
import { usePrefersReducedMotion } from "@/hooks/use-media";
import { cn } from "@/lib/utils";
import { BrandSwitch, SwitchField } from "../form/fields";
import { useFormGuard } from "../form/use-form-guard";
import { useCan } from "../shell/user-context";
import { DashButton } from "../ui/dash-button";
import { EmptyState } from "../ui/empty-state";
import { ConfirmDialog, SheetContent, SheetTitle } from "../ui/overlays";
import { Avatar, Card } from "../ui/primitives";
import { COLLECTION_FORMS, type CollectionKey } from "./collection-forms";

export type Item = {
  id: string;
  title: string;
  subtitle: string;
  image: string | null;
  published: boolean;
  values: Record<string, unknown>;
};

function Row({
  item,
  canEdit,
  onEdit,
  onDelete,
  onToggle,
}: {
  item: Item;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: (v: boolean) => void;
}) {
  const t = useTranslations("dash.form");
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: !canEdit,
  });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-3 bg-surface px-3 py-3",
        isDragging && "relative z-10 shadow-xl",
      )}
    >
      {canEdit && (
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={t("dragHandle")}
          className="grid size-8 shrink-0 cursor-grab place-items-center text-fg-muted hover:text-fg active:cursor-grabbing"
        >
          <GripVertical className="size-4" />
        </button>
      )}
      {item.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.image} alt="" className="size-10 shrink-0 object-cover" />
      ) : (
        <Avatar name={item.title.replace(/[^\p{L}\s]/gu, "") || "•"} className="size-10" />
      )}
      <button type="button" onClick={onEdit} className="min-w-0 flex-1 text-start">
        <span className="block truncate text-sm font-medium" dir="auto">
          {item.title}
        </span>
        <span className="block truncate text-xs text-fg-muted" dir="auto">
          {item.subtitle}
        </span>
      </button>
      <span
        className={cn("hidden text-xs sm:inline", item.published ? "text-link" : "text-fg-muted")}
      >
        {item.published ? t("published") : t("hidden")}
      </span>
      <BrandSwitch
        checked={item.published}
        onCheckedChange={onToggle}
        disabled={!canEdit}
        aria-label={t("published")}
      />
      {canEdit && (
        <>
          <DashButton variant="ghost" size="icon" onClick={onEdit} aria-label={t("edit")}>
            <Pencil />
          </DashButton>
          <DashButton variant="ghost" size="icon" onClick={onDelete} aria-label={t("delete")}>
            <Trash2 />
          </DashButton>
        </>
      )}
    </div>
  );
}

/**
 * Generic manager for simple collections: drag ordering, optimistic publish toggles,
 * create/edit in a side sheet (bilingual fields side by side), confirmed deletes.
 */
export function CollectionManager({
  collection,
  items: initial,
}: {
  collection: CollectionKey;
  items: Item[];
}) {
  const dndId = useId();
  const t = useTranslations("dash");
  const router = useRouter();
  const canEdit = useCan("editor");
  const reduced = usePrefersReducedMotion();
  const cfg = COLLECTION_FORMS[collection];
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState<Item | "new" | null>(null);
  const [toDelete, setToDelete] = useState<Item | null>(null);
  const [, start] = useTransition();

  useEffect(() => {
    // Mirror fresh server rows after router.refresh().
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(initial);
  }, [initial]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

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
      const r = await reorderCollection(
        collection,
        next.map((i) => i.id),
      );
      if (r.ok) toast(t("form.reordered"));
      else {
        setItems(before);
        toast.error(t("common.error"));
      }
    });
  };

  const toggle = (item: Item, v: boolean) => {
    setItems((list) => list.map((i) => (i.id === item.id ? { ...i, published: v } : i)));
    start(async () => {
      const r = await setCollectionPublished(collection, item.id, v);
      if (!r.ok) {
        setItems((list) => list.map((i) => (i.id === item.id ? { ...i, published: !v } : i)));
        toast.error(t("common.error"));
      }
    });
  };

  const remove = async (item: Item) => {
    const before = items;
    setItems((list) => list.filter((i) => i.id !== item.id));
    const r = await deleteCollectionItem(collection, item.id);
    if (r.ok) toast(t("form.deleted"));
    else {
      setItems(before);
      toast.error(t("common.error"));
    }
  };

  return (
    <div>
      {!canEdit && (
        <p className="mb-4 border-s-2 border-yellow-500 bg-surface px-3 py-2 text-sm text-fg-muted">
          {t("content.readOnly")}
        </p>
      )}
      {canEdit && cfg.canCreate && (
        <div className="mb-4 flex justify-end">
          <DashButton variant="primary" onClick={() => setEditing("new")}>
            <Plus />
            {t("form.new")}
          </DashButton>
        </div>
      )}
      <Card className="overflow-hidden">
        {items.length === 0 ? (
          <EmptyState title={t("content.empty")} body={t("content.emptyBody")} />
        ) : (
          <DndContext
            id={dndId}
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
          >
            <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              <ul>
                <AnimatePresence initial={false}>
                  {items.map((item, i) => (
                    <motion.li
                      key={item.id}
                      className="border-b border-border last:border-b-0"
                      initial={reduced ? false : { opacity: 0, y: 6 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        transition: { delay: Math.min(i, 10) * 0.02, duration: 0.2 },
                      }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <Row
                        item={item}
                        canEdit={canEdit}
                        onEdit={() => canEdit && setEditing(item)}
                        onDelete={() => setToDelete(item)}
                        onToggle={(v) => toggle(item, v)}
                      />
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </Card>

      {editing && (
        <EditSheet
          key={editing === "new" ? "new" : editing.id}
          collection={collection}
          item={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      )}

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={t("form.deleteTitle", { name: toDelete?.title ?? "" })}
        body={t("form.deleteBody")}
        confirmLabel={t("form.delete")}
        cancelLabel={t("common.cancel")}
        onConfirm={() => toDelete && remove(toDelete)}
      />
    </div>
  );
}

function EditSheet({
  collection,
  item,
  onClose,
  onSaved,
}: {
  collection: CollectionKey;
  item: Item | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations("dash");
  const cfg = COLLECTION_FORMS[collection];
  const form = useForm<FieldValues>({
    resolver: zodResolver(cfg.schema as never),
    defaultValues: item?.values ?? cfg.empty,
    mode: "onTouched",
  });
  const { Fields } = cfg;

  const save = form.handleSubmit(
    async (values) => {
      const r = await saveCollectionItem(collection, item?.id ?? null, values);
      if (r.ok) {
        toast(t("form.saved"));
        form.reset(values);
        onSaved();
      } else if (r.issues) {
        r.issues.forEach((i) => form.setError(i.path as never, { message: i.message }));
        toast.error(t("form.fixErrors"));
      } else toast.error(r.error === "forbidden" ? t("common.forbidden") : t("common.error"));
    },
    () => toast.error(t("form.fixErrors")),
  );

  const { confirmLeave, dialog } = useFormGuard({ dirty: form.formState.isDirty, onSave: save });

  return (
    <D.Root open onOpenChange={(o) => !o && confirmLeave(onClose)}>
      <SheetContent title={item ? t("form.edit") : t("form.new")} className="w-[min(100vw,46rem)]">
        <FormProvider {...form}>
          <form onSubmit={save} noValidate className="flex h-full flex-col">
            <header className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
              <div className="min-w-0">
                <p className="label-mono text-fg-muted">{t(`sections.${collection}`)}</p>
                <SheetTitle className="truncate text-lg font-medium" dir="auto">
                  {item ? item.title : t("form.new")}
                </SheetTitle>
              </div>
              {form.formState.isDirty && (
                <span className="shrink-0 bg-yellow-200 px-2 py-1 label-mono text-navy-950">
                  {t("form.unsaved")}
                </span>
              )}
            </header>
            <div className="flex-1 space-y-5 overflow-y-auto p-5" data-lenis-prevent>
              <Fields />
              <SwitchField name="published" label={t("fields.published")} />
            </div>
            <footer className="flex items-center justify-between gap-3 border-t border-border px-5 py-3">
              <p className="hidden text-xs text-fg-muted sm:block">{t("form.shortcut")}</p>
              <div className="flex gap-2">
                <DashButton type="button" onClick={() => confirmLeave(onClose)}>
                  {t("common.cancel")}
                </DashButton>
                <DashButton type="submit" variant="primary" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && <Loader2 className="animate-spin" />}
                  {form.formState.isSubmitting
                    ? t("form.saving")
                    : item
                      ? t("form.save")
                      : t("form.create")}
                </DashButton>
              </div>
            </footer>
          </form>
        </FormProvider>
        {dialog}
      </SheetContent>
    </D.Root>
  );
}
