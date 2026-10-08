"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { Logo } from "@/components/brand/logo";
import { WhatsAppIcon } from "@/components/brand/social-icons";
import { useSmoothScroll } from "@/components/providers/smooth-scroll";
import { mainNav, whatsappHref } from "@/config/site";
import { useSiteContact } from "./site-settings";
import { Link, usePathname } from "@/i18n/navigation";
import { gsap, useGSAP } from "@/lib/animation/gsap";
import { usePrefersReducedMotion } from "@/hooks/use-media";
import { LocaleSwitch } from "./locale-switch";
import { ThemeToggle } from "./theme-toggle";

const COLS = 6;
const ROWS = 10;

/**
 * Full-screen menu. Opens with a block cascade (blocks fill the screen), then links
 * rise in. Accessible dialog: focus moves in, Tab is trapped, Esc closes, focus returns.
 */
export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations("nav");
  const tf = useTranslations("footer");
  const contact = useSiteContact();
  const pathname = usePathname();
  const { lock, unlock } = useSmoothScroll();
  const reduced = usePrefersReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const opener = useRef<Element | null>(null);

  useGSAP(
    () => {
      const blocks = gsap.utils.toArray<HTMLElement>("[data-block]");
      const items = gsap.utils.toArray<HTMLElement>("[data-item]");
      tl.current = gsap
        .timeline({ paused: true })
        // visibility:hidden while closed keeps the dialog out of the a11y tree and tab order.
        .fromTo(
          root.current,
          { visibility: "hidden" },
          { visibility: "visible", duration: 0, immediateRender: false },
        )
        .fromTo(
          blocks,
          { scaleY: 0 },
          {
            scaleY: 1,
            duration: reduced ? 0.01 : 0.5,
            ease: "power3.inOut",
            stagger: reduced ? 0 : { amount: 0.35, grid: [ROWS, COLS], from: "start" },
          },
        )
        .fromTo(
          items,
          { yPercent: reduced ? 0 : 100, opacity: 0 },
          {
            yPercent: 0,
            opacity: 1,
            duration: reduced ? 0.2 : 0.7,
            ease: "expo.out",
            stagger: 0.05,
          },
          "-=0.15",
        );
    },
    { scope: root, dependencies: [reduced], revertOnUpdate: true },
  );

  useEffect(() => {
    if (open) {
      opener.current = document.activeElement;
      lock();
      gsap.set(root.current, { visibility: "visible" }); // so focus can move in immediately
      tl.current?.timeScale(1).play();
      requestAnimationFrame(() =>
        root.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus(),
      );
    } else if (tl.current && tl.current.progress() > 0) {
      unlock();
      // Hide explicitly once reversed: the zero-duration visibility tween at the start of the
      // timeline doesn't reliably re-render backwards, which left an invisible full-screen
      // layer swallowing every tap (header, logo, menu button) after navigating from the menu.
      tl.current
        .timeScale(1.6)
        .eventCallback("onReverseComplete", () => gsap.set(root.current, { visibility: "hidden" }))
        .reverse();
      (opener.current as HTMLElement | null)?.focus?.();
    }
    // lock/unlock are stable for a given Lenis instance
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Close on navigation.
  useEffect(() => {
    if (open) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") return onClose();
    if (e.key !== "Tab" || !root.current) return;
    const focusables = root.current.querySelectorAll<HTMLElement>(
      "a[href], button:not([disabled])",
    );
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      ref={root}
      id="mobile-menu"
      role="dialog"
      aria-modal="true"
      aria-label={t("menu")}
      onKeyDown={onKeyDown}
      className="invisible fixed inset-0 z-[60] lg:hidden"
    >
      <div
        aria-hidden
        className="absolute inset-0 grid"
        style={{
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gridTemplateRows: `repeat(${ROWS}, 1fr)`,
        }}
      >
        {Array.from({ length: COLS * ROWS }, (_, i) => (
          <span key={i} data-block className="origin-top bg-bg [outline:1px_solid_var(--bg)]" />
        ))}
      </div>

      <div className="relative flex h-full flex-col bg-grid [--grid-size:56px]">
        <div className="container-x flex h-[var(--header-h)] items-center justify-between">
          <span data-item className="text-primary dark:text-white">
            <Logo title={null} className="w-[7.5rem]" />
          </span>
          <button
            type="button"
            data-item
            data-autofocus
            onClick={onClose}
            aria-label={t("closeMenu")}
            className="grid size-10 place-items-center text-fg hover:text-link"
          >
            <X className="size-6" aria-hidden />
          </button>
        </div>

        <nav aria-label={t("primary")} className="container-x flex flex-1 flex-col justify-center">
          <ul className="space-y-1">
            {[
              { key: "home", href: "/" } as const,
              ...mainNav,
              { key: "contact", href: "/contact" } as const,
            ].map((item, i) => (
              <li key={item.key} className="overflow-hidden">
                <Link
                  href={item.href}
                  // Same page: no navigation happens, so close the menu ourselves.
                  onClick={() => item.href === pathname && onClose()}
                  data-item
                  className="group flex items-baseline gap-4 py-1 text-headline font-medium text-fg transition-colors hover:text-link"
                >
                  <span dir="ltr" className="w-8 label-mono text-fg-muted">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {t(item.key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="container-x flex flex-wrap items-center justify-between gap-4 border-t border-border py-5">
          <div data-item className="flex flex-col gap-1 text-sm">
            <a href={`mailto:${contact.email}`} className="hover:text-link">
              {contact.email}
            </a>
            <a
              href={whatsappHref(contact.whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 hover:text-link"
            >
              <WhatsAppIcon className="size-4" />
              {tf("whatsapp")}
            </a>
          </div>
          <div data-item className="flex items-center gap-1">
            <LocaleSwitch />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  );
}
