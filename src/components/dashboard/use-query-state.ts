"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";

/** Read/write URL search params (server-driven filters, pagination, panels). */
export function useQueryState() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();

  const set = useCallback(
    (patch: Record<string, string | null | undefined>, opts: { resetPage?: boolean } = {}) => {
      const next = new URLSearchParams(params);
      Object.entries(patch).forEach(([k, v]) =>
        v === null || v === undefined || v === "" ? next.delete(k) : next.set(k, v),
      );
      if (opts.resetPage) next.delete("page");
      const qs = next.toString();
      start(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
    },
    [params, pathname, router],
  );

  return { params, set, pending };
}
