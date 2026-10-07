"use client";

import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { useRef, useSyncExternalStore } from "react";
import { usePrefersReducedMotion } from "@/hooks/use-media";
import { cn } from "@/lib/utils";

const noop = () => () => {};
const useMounted = () =>
  useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );

const RAYS = [
  [11, 1],
  [11, 21],
  [1, 11],
  [21, 11],
  [4, 4],
  [18, 4],
  [4, 18],
  [18, 18],
] as const;

/**
 * Theme toggle. The switch itself is a "block wipe": the new theme is revealed as a
 * square expanding from the button (View Transitions API, instant fallback).
 * Icon: a block sun whose rays retract while a square "bite" notches it into a moon.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const t = useTranslations("theme");
  const { resolvedTheme, setTheme } = useTheme();
  const reduced = usePrefersReducedMotion();
  const mounted = useMounted();
  const ref = useRef<HTMLButtonElement>(null);
  const isDark = mounted && resolvedTheme === "dark";

  const toggle = () => {
    const next = isDark ? "light" : "dark";
    const apply = () => {
      const root = document.documentElement;
      root.classList.toggle("dark", next === "dark");
      root.style.colorScheme = next;
      setTheme(next);
    };

    if (!document.startViewTransition || reduced || !ref.current) {
      apply();
      return;
    }
    const r = ref.current.getBoundingClientRect();
    const transition = document.startViewTransition(apply);
    transition.ready.then(() => {
      const { innerWidth: w, innerHeight: h } = window;
      document.documentElement.animate(
        {
          clipPath: [
            `inset(${r.top}px ${w - r.right}px ${h - r.bottom}px ${r.left}px)`,
            "inset(0px 0px 0px 0px)",
          ],
        },
        {
          duration: 750,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          pseudoElement: "::view-transition-new(root)",
        },
      );
    });
  };

  // CSS transitions on SVG transforms (no animation library on the critical path).
  const ease = reduced
    ? "none"
    : "transform 450ms cubic-bezier(0.34,1.56,0.64,1), opacity 300ms ease";
  const box = { transformBox: "fill-box", transformOrigin: "center", transition: ease } as const;

  return (
    <button
      ref={ref}
      type="button"
      onClick={toggle}
      aria-label={t("toggle")}
      title={isDark ? t("light") : t("dark")}
      className={cn(
        "grid size-10 place-items-center text-fg transition-colors hover:text-link",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
        <defs>
          <mask id="codex-moon-bite">
            <rect width="24" height="24" fill="white" />
            {/* the "bite" slides in from the corner — the logo's square notch */}
            <rect
              x={13}
              y={3}
              width="9"
              height="9"
              fill="black"
              style={{ transition: ease, transform: isDark ? "none" : "translate(11px, -13px)" }}
            />
          </mask>
        </defs>
        <rect
          x={4}
          y={4}
          width={16}
          height={16}
          fill="currentColor"
          mask="url(#codex-moon-bite)"
          style={{ ...box, transform: isDark ? "scale(1)" : "scale(0.625)" }}
        />
        {RAYS.map(([x, y], i) => (
          <rect
            key={i}
            x={x}
            y={y}
            width="2"
            height="2"
            fill="currentColor"
            style={{
              transformBox: "fill-box",
              transformOrigin: "center",
              // One transition shorthand (delay included) — never mix with transitionDelay.
              transition: reduced
                ? "none"
                : `transform 450ms cubic-bezier(0.34,1.56,0.64,1) ${isDark ? 0 : i * 30}ms, opacity 300ms ease ${isDark ? 0 : i * 30}ms`,
              transform: isDark ? "scale(0)" : "scale(1)",
              opacity: isDark ? 0 : 1,
            }}
          />
        ))}
      </svg>
    </button>
  );
}
