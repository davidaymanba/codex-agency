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
import { GripVertical, ImagePlus, Plus, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Switch } from "radix-ui";
import { useId, useState, type ReactNode } from "react";
import { Controller, get, useFieldArray, useFormContext, type FieldValues } from "react-hook-form";
import { cn } from "@/lib/utils";
import { MediaPicker } from "../content/media-picker";
import { DashButton } from "../ui/dash-button";
import { FieldError, Input, Label, NativeSelect, Textarea } from "../ui/primitives";

/**
 * Form fields bound to the surrounding react-hook-form context. Error messages from the
 * shared zod schemas are translation keys under `dash.form.errors`.
 */

type ErrKey =
  | "required"
  | "short"
  | "long"
  | "slug"
  | "url"
  | "number"
  | "icon"
  | "duplicate"
  | "date"
  | "invalid";

function useFieldError(name: string) {
  const t = useTranslations("dash.form.errors");
  const { formState } = useFormContext();
  const msg = get(formState.errors, name)?.message as string | undefined;
  if (!msg) return undefined;
  return t.has(msg as ErrKey) ? t(msg as ErrKey) : t("invalid");
}

export function FieldShell({
  label,
  hint,
  error,
  htmlFor,
  children,
  className,
}: {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-fg-muted">{hint}</p>}
      <FieldError>{error}</FieldError>
    </div>
  );
}

export function TextField({
  name,
  label,
  hint,
  type = "text",
  dir,
  className,
  disabled,
}: {
  name: string;
  label: ReactNode;
  hint?: ReactNode;
  type?: string;
  dir?: "ltr" | "rtl";
  className?: string;
  disabled?: boolean;
}) {
  const { register } = useFormContext();
  const id = useId();
  const error = useFieldError(name);
  return (
    <FieldShell label={label} hint={hint} error={error} htmlFor={id} className={className}>
      <Input
        id={id}
        type={type}
        dir={dir}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        {...register(name)}
        className={cn(dir === "ltr" && "rtl:text-end")}
      />
    </FieldShell>
  );
}

export function TextareaField({
  name,
  label,
  rows = 4,
  dir,
}: {
  name: string;
  label: ReactNode;
  rows?: number;
  dir?: "ltr" | "rtl";
}) {
  const { register } = useFormContext();
  const id = useId();
  const error = useFieldError(name);
  return (
    <FieldShell label={label} error={error} htmlFor={id}>
      <Textarea
        id={id}
        rows={rows}
        dir={dir}
        aria-invalid={error ? true : undefined}
        {...register(name)}
      />
    </FieldShell>
  );
}

export function SelectField({
  name,
  label,
  options,
  number,
}: {
  name: string;
  label: ReactNode;
  options: { value: string | number; label: string }[];
  number?: boolean;
}) {
  const { register } = useFormContext();
  const id = useId();
  const error = useFieldError(name);
  return (
    <FieldShell label={label} error={error} htmlFor={id}>
      <NativeSelect
        id={id}
        aria-invalid={error ? true : undefined}
        {...register(name, number ? { valueAsNumber: true } : undefined)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </NativeSelect>
    </FieldShell>
  );
}

export function SwitchField({
  name,
  label,
  description,
}: {
  name: string;
  label: ReactNode;
  description?: ReactNode;
}) {
  const { control } = useFormContext();
  const id = useId();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className="flex items-center justify-between gap-4 border border-border bg-bg px-4 py-3">
          <div>
            <label htmlFor={id} className="text-sm font-medium">
              {label}
            </label>
            {description && <p className="text-xs text-fg-muted">{description}</p>}
          </div>
          <BrandSwitch id={id} checked={!!field.value} onCheckedChange={field.onChange} />
        </div>
      )}
    />
  );
}

export function BrandSwitch({ className, ...props }: React.ComponentProps<typeof Switch.Root>) {
  return (
    <Switch.Root
      className={cn(
        "relative h-6 w-11 shrink-0 cursor-pointer border border-border-strong bg-surface-2 transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary data-[state=checked]:bg-primary",
        className,
      )}
      {...props}
    >
      <Switch.Thumb className="block size-4 translate-x-0.5 bg-fg-muted transition-transform duration-200 ease-[var(--ease-expo-out)] data-[state=checked]:translate-x-[1.375rem] data-[state=checked]:bg-white rtl:-translate-x-0.5 rtl:data-[state=checked]:-translate-x-[1.375rem]" />
    </Switch.Root>
  );
}

/** English + Arabic side by side (stacked on small screens). */
export function LocField({
  name,
  label,
  multiline,
  rows = 3,
}: {
  name: string;
  label: ReactNode;
  multiline?: boolean;
  rows?: number;
}) {
  const t = useTranslations("dash.form");
  const { register } = useFormContext();
  const enErr = useFieldError(`${name}.en`);
  const arErr = useFieldError(`${name}.ar`);
  const idEn = useId();
  const idAr = useId();
  const Comp = multiline ? Textarea : Input;
  return (
    <fieldset>
      <legend className="mb-1.5 text-xs font-medium text-fg-muted">{label}</legend>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label htmlFor={idEn} className="mb-1 block label-mono text-fg-muted">
            EN · {t("english")}
          </label>
          <Comp
            id={idEn}
            dir="ltr"
            rows={multiline ? rows : undefined}
            aria-invalid={enErr ? true : undefined}
            {...register(`${name}.en`)}
            className="text-start"
          />
          <FieldError>{enErr}</FieldError>
        </div>
        <div>
          <label htmlFor={idAr} className="mb-1 block label-mono text-fg-muted">
            AR · {t("arabic")}
          </label>
          <Comp
            id={idAr}
            dir="rtl"
            lang="ar"
            rows={multiline ? rows : undefined}
            aria-invalid={arErr ? true : undefined}
            {...register(`${name}.ar`)}
            className="font-[family-name:var(--font-rubik)]"
          />
          <FieldError>{arErr}</FieldError>
        </div>
      </div>
    </fieldset>
  );
}

/** Repeating list of bilingual strings (sub-services, features, deliverables). */
export function LocListField({ name, label }: { name: string; label: ReactNode }) {
  const t = useTranslations("dash.form");
  const { control, register } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name });
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-medium text-fg-muted">{label}</legend>
      <ul className="space-y-2">
        {fields.map((f, i) => (
          <li key={f.id} className="flex items-start gap-2">
            <div className="grid flex-1 gap-2 md:grid-cols-2">
              <Input
                dir="ltr"
                aria-label={`${t("english")} ${i + 1}`}
                {...register(`${name}.${i}.en`)}
              />
              <Input
                dir="rtl"
                lang="ar"
                aria-label={`${t("arabic")} ${i + 1}`}
                {...register(`${name}.${i}.ar`)}
                className="font-[family-name:var(--font-rubik)]"
              />
            </div>
            <DashButton
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => remove(i)}
              aria-label={t("remove")}
            >
              <Trash2 />
            </DashButton>
          </li>
        ))}
      </ul>
      <DashButton
        type="button"
        size="sm"
        className="mt-2"
        onClick={() => append({ en: "", ar: "" })}
      >
        <Plus />
        {t("add")}
      </DashButton>
      <FieldError>{useFieldError(name)}</FieldError>
    </fieldset>
  );
}

/** Repeating Q&A pairs (service FAQs). */
export function QAListField({ name, label }: { name: string; label: ReactNode }) {
  const t = useTranslations("dash");
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name });
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-medium text-fg-muted">{label}</legend>
      <ol className="space-y-4">
        {fields.map((f, i) => (
          <li key={f.id} className="relative border border-border p-4">
            <DashButton
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute end-2 top-2"
              onClick={() => remove(i)}
              aria-label={t("form.remove")}
            >
              <Trash2 />
            </DashButton>
            <div className="space-y-3">
              <LocField name={`${name}.${i}.q`} label={`${t("fields.question")} ${i + 1}`} />
              <LocField name={`${name}.${i}.a`} label={t("fields.answer")} multiline rows={3} />
            </div>
          </li>
        ))}
      </ol>
      <DashButton
        type="button"
        size="sm"
        className="mt-2"
        onClick={() => append({ q: { en: "", ar: "" }, a: { en: "", ar: "" } })}
      >
        <Plus />
        {t("form.add")}
      </DashButton>
    </fieldset>
  );
}

/** Headline results: value + bilingual label. */
export function ResultsField({
  name,
  label,
  hint,
}: {
  name: string;
  label: ReactNode;
  hint?: ReactNode;
}) {
  const t = useTranslations("dash");
  const { control, register } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name });
  return (
    <fieldset>
      <legend className="mb-1 text-xs font-medium text-fg-muted">{label}</legend>
      {hint && <p className="mb-2 text-xs text-fg-muted">{hint}</p>}
      <ul className="space-y-2">
        {fields.map((f, i) => (
          <li key={f.id} className="flex items-start gap-2">
            <Input
              dir="ltr"
              aria-label={t("fields.value")}
              placeholder="+64%"
              className="w-24 shrink-0"
              {...register(`${name}.${i}.value`)}
            />
            <div className="grid flex-1 gap-2 md:grid-cols-2">
              <Input
                dir="ltr"
                aria-label={t("form.english")}
                {...register(`${name}.${i}.label.en`)}
              />
              <Input
                dir="rtl"
                lang="ar"
                aria-label={t("form.arabic")}
                {...register(`${name}.${i}.label.ar`)}
              />
            </div>
            <DashButton
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => remove(i)}
              aria-label={t("form.remove")}
            >
              <Trash2 />
            </DashButton>
          </li>
        ))}
      </ul>
      {fields.length < 6 && (
        <DashButton
          type="button"
          size="sm"
          className="mt-2"
          onClick={() => append({ value: "", label: { en: "", ar: "" } })}
        >
          <Plus />
          {t("form.add")}
        </DashButton>
      )}
    </fieldset>
  );
}

/** Free tags (Enter / comma to add). */
export function TagsField({ name, label }: { name: string; label: ReactNode }) {
  const t = useTranslations("dash");
  const { control } = useFormContext();
  const [draft, setDraft] = useState("");
  const id = useId();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => {
        const tags: string[] = field.value ?? [];
        const add = () => {
          const v = draft.trim().replace(/,$/, "");
          if (v && !tags.includes(v)) field.onChange([...tags, v]);
          setDraft("");
        };
        return (
          <FieldShell label={label} hint={t("fields.tagsHint")} htmlFor={id}>
            <div className="flex min-h-10 flex-wrap items-center gap-1.5 border border-border bg-bg px-2 py-1.5 focus-within:border-primary">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 bg-surface-2 px-2 py-0.5 text-xs"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => field.onChange(tags.filter((x) => x !== tag))}
                    aria-label={`${t("form.remove")} ${tag}`}
                    className="hover:text-link"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
              <input
                id={id}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    add();
                  } else if (e.key === "Backspace" && !draft && tags.length)
                    field.onChange(tags.slice(0, -1));
                }}
                onBlur={add}
                className="min-w-24 flex-1 bg-transparent text-sm outline-none"
              />
            </div>
          </FieldShell>
        );
      }}
    />
  );
}

/** Multi-select as toggle chips. */
export function ChipsField({
  name,
  label,
  options,
}: {
  name: string;
  label: ReactNode;
  options: { value: string; label: string }[];
}) {
  const { control } = useFormContext();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => {
        const value: string[] = field.value ?? [];
        return (
          <fieldset>
            <legend className="mb-2 text-xs font-medium text-fg-muted">{label}</legend>
            <div className="flex flex-wrap gap-2">
              {options.map((o) => {
                const on = value.includes(o.value);
                return (
                  <button
                    key={o.value}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      field.onChange(on ? value.filter((v) => v !== o.value) : [...value, o.value])
                    }
                    className={cn(
                      "border px-3 py-1.5 text-sm transition-colors",
                      on
                        ? "border-primary bg-primary text-white"
                        : "border-border hover:border-border-strong",
                    )}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        );
      }}
    />
  );
}

/** Single image from the media library (stored as URL; "" = none). */
export function ImageField({ name, label }: { name: string; label: ReactNode }) {
  const t = useTranslations("dash.media");
  const { control } = useFormContext();
  const [open, setOpen] = useState(false);
  const error = useFieldError(name);
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <FieldShell label={label} error={error}>
          <div className="flex items-center gap-3">
            <div className="grid size-20 shrink-0 place-items-center overflow-hidden border border-border bg-surface-2">
              {field.value ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={field.value} alt="" className="size-full object-cover" />
              ) : (
                <ImagePlus aria-hidden className="size-5 text-fg-muted" />
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <DashButton type="button" size="sm" onClick={() => setOpen(true)}>
                {t("choose")}
              </DashButton>
              {field.value && (
                <DashButton
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => field.onChange("")}
                >
                  {t("clear")}
                </DashButton>
              )}
            </div>
          </div>
          <MediaPicker open={open} onOpenChange={setOpen} onPick={([url]) => field.onChange(url)} />
        </FieldShell>
      )}
    />
  );
}

function SortableThumb({
  url,
  onRemove,
  removeLabel,
  handleLabel,
}: {
  url: string;
  onRemove: () => void;
  removeLabel: string;
  handleLabel: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: url,
  });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group relative aspect-square overflow-hidden border border-border bg-surface-2",
        isDragging && "z-10 opacity-80 shadow-xl",
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" className="size-full object-cover" />
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={handleLabel}
        className="absolute start-1 top-1 grid size-7 cursor-grab place-items-center bg-surface/90 active:cursor-grabbing"
      >
        <GripVertical className="size-4" />
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label={removeLabel}
        className="absolute end-1 top-1 grid size-7 place-items-center bg-surface/90 hover:bg-yellow-500 hover:text-navy-950"
      >
        <X className="size-4" />
      </button>
    </li>
  );
}

/** Ordered image list with drag-to-reorder (project gallery). */
export function GalleryField({ name, label }: { name: string; label: ReactNode }) {
  const dndId = useId();
  const t = useTranslations("dash");
  const { control } = useFormContext<FieldValues>();
  const [open, setOpen] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => {
        const urls: string[] = field.value ?? [];
        const onEnd = ({ active, over }: DragEndEvent) => {
          if (!over || active.id === over.id) return;
          field.onChange(
            arrayMove(urls, urls.indexOf(String(active.id)), urls.indexOf(String(over.id))),
          );
        };
        return (
          <fieldset>
            <legend className="mb-2 text-xs font-medium text-fg-muted">{label}</legend>
            <DndContext
              id={dndId}
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={onEnd}
            >
              <SortableContext items={urls} strategy={rectSortingStrategy}>
                <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                  {urls.map((u) => (
                    <SortableThumb
                      key={u}
                      url={u}
                      onRemove={() => field.onChange(urls.filter((x) => x !== u))}
                      removeLabel={t("form.remove")}
                      handleLabel={t("form.dragHandle")}
                    />
                  ))}
                  <li>
                    <button
                      type="button"
                      onClick={() => setOpen(true)}
                      className="grid aspect-square w-full place-items-center border border-dashed border-border-strong text-fg-muted transition-colors hover:border-primary hover:text-link"
                    >
                      <span className="flex flex-col items-center gap-1 text-xs">
                        <Plus className="size-5" />
                        {t("media.chooseMany")}
                      </span>
                    </button>
                  </li>
                </ul>
              </SortableContext>
            </DndContext>
            <MediaPicker
              open={open}
              onOpenChange={setOpen}
              multiple
              onPick={(picked) =>
                field.onChange([...urls, ...picked.filter((p) => !urls.includes(p))])
              }
            />
          </fieldset>
        );
      }}
    />
  );
}
