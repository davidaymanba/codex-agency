"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { DashButton } from "../ui/dash-button";
import { Input, Label, NativeSelect } from "../ui/primitives";
import { useQueryState } from "../use-query-state";

const ENTITIES = ["lead", "project", "post", "content", "media", "settings", "user"] as const;

/** Activity log filters, stored in the URL (server-side filtering + pagination). */
export function ActivityFilters({ users }: { users: { id: string; name: string }[] }) {
  const t = useTranslations("dash.activityLog");
  const tc = useTranslations("dash.common");
  const { params, set } = useQueryState();
  const has = ["entity", "actor", "from", "to"].some((k) => params.get(k));
  return (
    <div className="mb-5 flex flex-wrap items-end gap-3">
      <div>
        <Label htmlFor="f-entity">{t("entity")}</Label>
        <NativeSelect
          id="f-entity"
          value={params.get("entity") ?? ""}
          onChange={(e) => set({ entity: e.target.value }, { resetPage: true })}
          className="w-40"
        >
          <option value="">{t("all")}</option>
          {ENTITIES.map((e) => (
            <option key={e} value={e}>
              {t(`entities.${e}`)}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div>
        <Label htmlFor="f-actor">{t("actor")}</Label>
        <NativeSelect
          id="f-actor"
          value={params.get("actor") ?? ""}
          onChange={(e) => set({ actor: e.target.value }, { resetPage: true })}
          className="w-44"
        >
          <option value="">{t("all")}</option>
          <option value="system">{t("system")}</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div>
        <Label htmlFor="f-from">{t("from")}</Label>
        <Input
          id="f-from"
          type="date"
          dir="ltr"
          value={params.get("from") ?? ""}
          onChange={(e) => set({ from: e.target.value }, { resetPage: true })}
          className="w-40"
        />
      </div>
      <div>
        <Label htmlFor="f-to">{t("to")}</Label>
        <Input
          id="f-to"
          type="date"
          dir="ltr"
          value={params.get("to") ?? ""}
          onChange={(e) => set({ to: e.target.value }, { resetPage: true })}
          className="w-40"
        />
      </div>
      {has && (
        <DashButton
          variant="ghost"
          onClick={() =>
            set({ entity: null, actor: null, from: null, to: null }, { resetPage: true })
          }
        >
          <X />
          {tc("clear")}
        </DashButton>
      )}
    </div>
  );
}
