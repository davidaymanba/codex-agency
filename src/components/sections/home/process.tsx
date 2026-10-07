"use client";

import { useTranslations } from "next-intl";
import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/animation/gsap";
import { useDirection } from "@/hooks/use-direction";
import { usePrefersReducedMotion } from "@/hooks/use-media";

const STEPS = ["discover", "strategy", "design", "build", "launch", "grow"] as const;

/**
 * Process timeline. A line draws itself with scroll (horizontal on desktop, vertical on
 * mobile) and each step lights up as the line reaches it. Mirrors in RTL.
 */
export function Process() {
  const t = useTranslations("home.processSteps");
  const { isRTL } = useDirection();
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLOListElement>(null);

  useGSAP(
    () => {
      const steps = gsap.utils.toArray<HTMLElement>("[data-step]", ref.current);
      const light = (el: HTMLElement, on: boolean) => el.classList.toggle("is-on", on);
      if (reduced) {
        steps.forEach((s) => light(s, true));
        return;
      }
      const mm = gsap.matchMedia();
      mm.add({ desktop: "(min-width: 1024px)", mobile: "(max-width: 1023px)" }, (ctx) => {
        const desktop = ctx.conditions?.desktop;
        const line = ref.current!.querySelector(desktop ? "[data-line-h]" : "[data-line-v]");
        gsap.fromTo(line, desktop ? { scaleX: 0 } : { scaleY: 0 }, {
          ...(desktop ? { scaleX: 1 } : { scaleY: 1 }),
          ease: "none",
          transformOrigin: desktop ? (isRTL ? "100% 50%" : "0% 50%") : "50% 0%",
          scrollTrigger: { trigger: ref.current, start: "top 70%", end: "bottom 55%", scrub: 0.5 },
        });
        steps.forEach((step) => {
          ScrollTrigger.create({
            trigger: step,
            start: desktop ? "top 70%" : "top 62%",
            // Desktop steps sit in one row, so stagger them along the same scroll range.
            ...(desktop
              ? { trigger: ref.current, start: `top+=${Number(step.dataset.index) * 60} 70%` }
              : {}),
            onToggle: (self) => light(step, self.isActive || self.progress === 1),
            onLeave: () => light(step, true),
            onLeaveBack: () => light(step, false),
          });
        });
      });
      return () => mm.revert();
    },
    { scope: ref, dependencies: [reduced, isRTL], revertOnUpdate: true },
  );

  return (
    <ol ref={ref} className="relative grid gap-10 ps-10 lg:grid-cols-6 lg:gap-6 lg:ps-0 lg:pt-14">
      {/* rails */}
      <span
        aria-hidden
        className="absolute start-[0.6875rem] top-2 bottom-2 w-px bg-border lg:hidden"
      />
      <span
        aria-hidden
        data-line-v
        className="absolute start-[0.6875rem] top-2 bottom-2 w-px origin-top bg-link lg:hidden"
      />
      <span
        aria-hidden
        className="absolute inset-x-0 top-[1.0625rem] hidden h-px bg-border lg:block"
      />
      <span
        aria-hidden
        data-line-h
        className="absolute inset-x-0 top-[1.0625rem] hidden h-0.5 bg-link lg:block"
      />

      {STEPS.map((key, i) => (
        <li key={key} data-step data-index={i} className="group/step relative">
          <span
            aria-hidden
            className="absolute -start-10 top-1 grid size-6 place-items-center border border-border-strong bg-bg transition-colors duration-500 group-[.is-on]/step:border-primary group-[.is-on]/step:bg-primary lg:start-0 lg:-top-14 lg:size-[1.375rem]"
          >
            <span className="size-1.5 bg-fg-muted transition-colors duration-500 group-[.is-on]/step:bg-white" />
          </span>
          <p
            className="label-mono text-fg-muted transition-colors duration-500 group-[.is-on]/step:text-link"
            dir="ltr"
          >
            {`0${i + 1}`}
          </p>
          <h3 className="mt-2 text-title font-medium opacity-50 transition-opacity duration-500 group-[.is-on]/step:opacity-100">
            {t(`${key}.title`)}
          </h3>
          <p className="mt-2 text-[0.9375rem] text-fg-muted">{t(`${key}.body`)}</p>
        </li>
      ))}
    </ol>
  );
}
