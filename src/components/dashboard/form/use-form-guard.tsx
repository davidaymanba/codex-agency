"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { ConfirmDialog } from "../ui/overlays";

/**
 * Form ergonomics: Ctrl/⌘+S saves, the browser warns before closing a tab with unsaved
 * changes, and `confirmLeave(fn)` asks before discarding in-app (closing a sheet, navigating).
 */
export function useFormGuard({ dirty, onSave }: { dirty: boolean; onSave: () => void }) {
  const t = useTranslations("dash.form");
  const [pending, setPending] = useState<(() => void) | null>(null);
  const save = useRef(onSave);
  useEffect(() => {
    save.current = onSave;
  }, [onSave]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        save.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const confirmLeave = useCallback(
    (fn: () => void) => (dirty ? setPending(() => fn) : fn()),
    [dirty],
  );

  const dialog = (
    <ConfirmDialog
      open={!!pending}
      onOpenChange={(o) => !o && setPending(null)}
      title={t("unsavedTitle")}
      body={t("unsavedBody")}
      confirmLabel={t("discard")}
      cancelLabel={t("keepEditing")}
      onConfirm={() => {
        pending?.();
        setPending(null);
      }}
    />
  );

  return { confirmLeave, dialog };
}
