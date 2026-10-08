"use client";

import { ArrowDown } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRef } from "react";
import { BracketGlyph } from "@/components/brand/logo";
import { ParallaxLayer } from "@/components/motion/parallax-layer";
import { ButtonLink, MagneticButton } from "@/components/ui/button";
import { CodeLabel } from "@/components/ui/code-label";
import { gsap, SplitText, useGSAP } from "@/lib/animation/gsap";
import { onPreloaded } from "@/lib/animation/preloader";
import { useFinePointer, usePrefersReducedMotion } from "@/hooks/use-media";
import { HeroGrid } from "./hero-grid";

const CODE_CHARS = "{}[]<>/\\_=+*#01";

/**
 * Home hero. Intro waits for the preloader to start opening, then:
 * EN headline scrambles like code and settles; AR headline rises line by line (no glyph split).
 * Background: interactive block grid + a soft blue glow that follows the cursor,
 * and floating `{ }` with scroll + pointer parallax.
 */
export function Hero() {
  const t = useTranslations("home");
  const locale = useLocale();
  const reduced = usePrefersReducedMotion();
  const fine = useFinePointer();
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      const title = el.querySelector<HTMLElement>("[data-hero-title]")!;
      const fades = el.querySelectorAll<HTMLElement>("[data-hero-fade]");
      const tl = gsap.timeline({ paused: true, defaults: { ease: "expo.out" } });
      // Hero content is NEVER hidden (it is the LCP): intros move/blur/scramble visible text.
      // Phones/tablets: SplitText/scramble swap the headline's nodes after hydration, which
      // re-paints the LCP seconds late — there the headline only moves (transform, same node).
      const rich = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 768px)").matches;
      if (!reduced) {
        if (!rich) {
          tl.from(title, { y: 24, duration: 1 }, 0);
        } else if (locale === "ar") {
          // Arabic: line-level blur-to-sharp (no glyph splitting, no masking).
          const split = SplitText.create(title, { type: "lines", aria: "auto" });
          tl.from(split.lines, { y: 28, filter: "blur(10px)", duration: 1.1, stagger: 0.12 }, 0);
        } else {
          const lines = SplitText.create(title, { type: "lines", aria: "auto" }).lines;
          lines.forEach((line, i) => {
            tl.to(
              line,
              {
                duration: 1.1,
                ease: "none",
                scrambleText: {
                  text: line.textContent ?? "",
                  chars: CODE_CHARS,
                  revealDelay: 0.25,
                  speed: 0.6,
                },
              },
              i * 0.12,
            );
          });
        }
        tl.from(fades, { y: 24, duration: 0.9, stagger: 0.08 }, 0.25).from(
          "[data-hero-bracket]",
          { opacity: 0, scale: 0.85, duration: 1.4 },
          0.2,
        );
      }

      const off = onPreloaded(() => tl.play());

      // Cursor glow + pointer parallax on the brackets (desktop only).
      if (fine && !reduced) {
        const glow = el.querySelector<HTMLElement>("[data-hero-glow]")!;
        const brackets = el.querySelector<HTMLElement>("[data-hero-brackets]")!;
        const gx = gsap.quickTo(glow, "x", { duration: 0.8, ease: "power3.out" });
        const gy = gsap.quickTo(glow, "y", { duration: 0.8, ease: "power3.out" });
        const bx = gsap.quickTo(brackets, "x", { duration: 1.2, ease: "power3.out" });
        const by = gsap.quickTo(brackets, "y", { duration: 1.2, ease: "power3.out" });
        let shown = false;
        const onMove = (e: PointerEvent) => {
          const r = el.getBoundingClientRect();
          if (!shown) {
            shown = true;
            gsap.to(glow, { opacity: 0.8, duration: 0.8 });
          }
          gx(e.clientX - r.left);
          gy(e.clientY - r.top);
          bx((e.clientX / window.innerWidth - 0.5) * -30);
          by((e.clientY / window.innerHeight - 0.5) * -30);
        };
        el.addEventListener("pointermove", onMove);
        return () => {
          off();
          el.removeEventListener("pointermove", onMove);
        };
      }
      return off;
    },
    { scope: root, dependencies: [locale, reduced, fine], revertOnUpdate: true },
  );

  return (
    <section
      ref={root}
      aria-labelledby="hero-title"
      className="relative isolate flex min-h-svh flex-col overflow-hidden pt-[var(--header-h)]"
    >
      <HeroGrid />
      {/* Radial fade so the grid dissolves toward the edges. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_40%,transparent_20%,var(--bg)_78%)]"
      />
      <div
        aria-hidden
        data-hero-glow
        // Physical left/top: positioned from pointer coordinates. The CSS translate centres it,
        // GSAP's transform moves it — they are separate properties and compose.
        className="pointer-events-none absolute top-0 left-0 -z-10 size-[44rem] -translate-x-1/2 -translate-y-1/2 opacity-0 glow-blue"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute end-[-15%] -top-1/3 -z-10 size-[70vmax] opacity-60 glow-blue"
      />

      <ParallaxLayer
        speed={0.35}
        className="pointer-events-none absolute end-[6%] top-[16%] -z-10 hidden md:block"
      >
        <div data-hero-brackets>
          <span
            data-hero-bracket
            dir="ltr"
            className="flex gap-[0.18em] text-[clamp(10rem,22vw,22rem)] leading-none text-blue-300/50 dark:text-indigo-700/60"
          >
            <BracketGlyph side="left" />
            <BracketGlyph side="right" />
          </span>
        </div>
      </ParallaxLayer>

      <div className="container-x flex flex-1 flex-col pt-10 pb-10 md:pt-16">
        <div
          data-hero-fade

          className="flex flex-wrap items-center justify-between gap-4"
        >
          <CodeLabel index="00">{t("heroLabel")}</CodeLabel>
          <p className="label-mono text-fg-muted">{t("disciplines")}</p>
        </div>

        <div className="mt-auto pt-16">
          <h1
            id="hero-title"
            data-hero-title

            className="max-w-[16ch] font-display text-display-xl font-bold uppercase rtl:max-w-[18ch] rtl:normal-case"
          >
            {t("heroTitle")}
          </h1>

          <div className="mt-10 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <p data-hero-fade className="max-w-xl text-lead text-fg-muted">
              {t("heroBody")}
            </p>
            <div data-hero-fade className="flex flex-wrap gap-3">
              <MagneticButton href="/contact" size="lg" cursor="open">
                {t("primaryCta")}
              </MagneticButton>
              <ButtonLink href="/work" variant="secondary" size="lg" cursor="view">
                {t("secondaryCta")}
              </ButtonLink>
            </div>
          </div>

          <div
            data-hero-fade

            className="mt-14 flex items-center justify-between border-t border-border pt-5"
          >
            <a
              href="#services"
              className="group inline-flex items-center gap-2 label-mono text-fg-muted hover:text-link"
            >
              <ArrowDown
                aria-hidden
                className="size-3.5 transition-transform group-hover:translate-y-0.5"
              />
              {t("scroll")}
              <span aria-hidden className="inline-block h-3.5 w-2 caret bg-link" />
            </a>
            <p className="hidden label-mono text-fg-muted sm:block" dir="ltr">
              EG · SA · AE · KW · OM
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
