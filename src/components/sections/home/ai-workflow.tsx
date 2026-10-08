"use client";

import { Headset, ListChecks, PackageCheck, FileBarChart } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Reveal } from "@/components/motion/reveal";
import { useMedia } from "@/hooks/use-media";
import { cn } from "@/lib/utils";
import { AiWorkflowCanvas, USE_CASES, type NodeId, type UseCaseKey } from "./ai-workflow-canvas";

const CASE_ICONS = {
  support: Headset,
  leads: ListChecks,
  orders: PackageCheck,
  reports: FileBarChart,
} as const;

/** Canvas + use-case cards share one highlight state (hover/focus/click a case to trace its path). */
export function AiWorkflow() {
  const t = useTranslations("home");
  const [hoverNodes, setHoverNodes] = useState<NodeId[] | null>(null);
  const [pinned, setPinned] = useState<UseCaseKey | null>(null);
  const [hoverCase, setHoverCase] = useState<UseCaseKey | null>(null);
  const activeCase = hoverCase ?? pinned;
  const highlight = hoverNodes ?? (activeCase ? USE_CASES[activeCase] : null);
  // Server renders the desktop wording; touch devices switch to "tap" after hydration.
  const fine = useMedia("(hover: hover) and (pointer: fine)", true);

  return (
    <>
      <p className="mb-4 label-mono text-indigo-200">{t(fine ? "aiHint" : "aiHintTouch")}</p>
      <div className="relative rounded-[var(--radius-brand)] border border-indigo-700/60 bg-navy-950 bg-grid p-4 [--grid-size:40px] md:p-8">
        <AiWorkflowCanvas highlight={highlight} onHover={setHoverNodes} />
      </div>

      <Reveal as="ul" stagger className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(Object.keys(USE_CASES) as UseCaseKey[]).map((key, i) => {
          const Icon = CASE_ICONS[key];
          const on = activeCase === key;
          return (
            <li key={key}>
              <button
                type="button"
                aria-pressed={pinned === key}
                onClick={() => setPinned((p) => (p === key ? null : key))}
                // Mouse/keyboard preview only: on touch a tap's emulated hover/focus would stick,
                // so taps just toggle the pinned case.
                onPointerEnter={(e) => e.pointerType === "mouse" && setHoverCase(key)}
                onPointerLeave={(e) => e.pointerType === "mouse" && setHoverCase(null)}
                onFocus={(e) => e.currentTarget.matches(":focus-visible") && setHoverCase(key)}
                onBlur={() => setHoverCase(null)}
                className={cn(
                  "group flex h-full w-full flex-col items-start gap-4 rounded-[var(--radius-brand)] border p-5 text-start transition-colors duration-300",
                  on
                    ? "border-blue-400 bg-blue-600/15"
                    : "border-indigo-700/60 hover:border-indigo-200/50",
                )}
              >
                <span className="flex w-full items-center justify-between">
                  <span
                    className={cn(
                      "grid size-10 place-items-center transition-colors",
                      on ? "bg-blue-600 text-white" : "bg-indigo-700/40 text-blue-300",
                    )}
                  >
                    <Icon aria-hidden className="size-5" />
                  </span>
                  <span className="label-mono text-indigo-200/70" dir="ltr">{`0${i + 1}`}</span>
                </span>
                <span className="font-medium text-white">{t(`aiUseCases.${key}.title`)}</span>
                <span className="text-sm text-indigo-200">{t(`aiUseCases.${key}.body`)}</span>
              </button>
            </li>
          );
        })}
      </Reveal>
    </>
  );
}
