"use client";

import { useTranslations } from "next-intl";
import { Segmented } from "../ui/segmented";
import { useQueryState } from "../use-query-state";

export function ServicesTabs({ value }: { value: "services" | "solutions" }) {
  const t = useTranslations("dash.sections");
  const { set } = useQueryState();
  return (
    <Segmented
      label={t("services")}
      value={value}
      onChange={(v) => set({ tab: v === "services" ? null : v })}
      options={[
        { value: "services", label: t("services") },
        { value: "solutions", label: t("solutions") },
      ]}
    />
  );
}
