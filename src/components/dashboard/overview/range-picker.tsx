"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Segmented } from "@/components/dashboard/ui/segmented";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { DateRange } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

/** Date-range presets stored in the URL (?range=), so the server renders the right data. */
export function RangePicker({ value }: { value: DateRange }) {
  const t = useTranslations("dash.ranges");
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  return (
    <Segmented
      label="Date range"
      value={value}
      className={cn(pending && "opacity-70")}
      onChange={(v) =>
        start(() => {
          const next = new URLSearchParams(params);
          next.set("range", v);
          router.replace(`${pathname}?${next}`, { scroll: false });
        })
      }
      options={(["7d", "30d", "90d"] as const).map((r) => ({ value: r, label: t(r) }))}
    />
  );
}
