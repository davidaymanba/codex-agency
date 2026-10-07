"use client";

import { ArrowUp } from "lucide-react";
import { useSmoothScroll } from "@/components/providers/smooth-scroll";

export function BackToTop({ label }: { label: string }) {
  const { scrollTo } = useSmoothScroll();
  return (
    <button
      type="button"
      onClick={() => scrollTo(0)}
      className="group inline-flex items-center gap-2 hover:text-link"
    >
      {label}
      <span className="grid size-8 place-items-center border border-border transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-white">
        <ArrowUp aria-hidden className="size-4" />
      </span>
    </button>
  );
}
