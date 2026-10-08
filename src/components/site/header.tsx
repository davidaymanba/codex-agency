"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/brand/logo";
import { BracketFrame } from "@/components/motion/bracket-frame";
import { useSmoothScroll } from "@/components/providers/smooth-scroll";
import { MagneticButton } from "@/components/ui/button";
import { mainNav } from "@/config/site";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { LocaleSwitch } from "./locale-switch";
import { MobileMenu } from "./mobile-menu";
import { ThemeToggle } from "./theme-toggle";
import { AnnouncementBar } from "./announcement-bar";

/**
 * Sticky header: hides on scroll down, returns on scroll up, turns to glass once
 * the page has scrolled. Works with Lenis (it drives native scroll position).
 */
export function Header({ announcement }: { announcement?: { text: string; href: string } | null }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const lastY = useRef(0);
  const { scrollTo } = useSmoothScroll();

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY.current;
      setScrolled(y > 8);
      if (Math.abs(delta) > 4) setHidden(delta > 0 && y > 160);
      lastY.current = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // A new page always starts with the header visible.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHidden(false);
  }, [pathname]);

  // Logo on the home page = back to top (a same-URL link would otherwise do nothing).
  const onLogoClick = (e: React.MouseEvent) => {
    if (pathname !== "/") return;
    e.preventDefault();
    scrollTo(0);
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <a
        href="#main"
        className="fixed start-2 top-2 z-[70] -translate-y-24 bg-accent px-4 py-2 font-medium text-accent-fg focus:translate-y-0"
      >
        {t("skipToContent")}
      </a>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-[translate,background-color,border-color] duration-500 ease-[var(--ease-expo-out)]",
          hidden && !menuOpen ? "-translate-y-full" : "translate-y-0",
          scrolled ? "border-b border-border glass" : "border-b border-transparent",
        )}
      >
        <AnnouncementBar announcement={announcement ?? null} />
        <div className="container-x flex h-[4.5rem] items-center justify-between gap-6">
          <Link
            href="/"
            onClick={onLogoClick}
            aria-label="CODEX — home"
            className="shrink-0 text-primary dark:text-white"
          >
            <Logo title={null} className="w-[7.5rem] md:w-[8.5rem]" />
          </Link>

          <nav aria-label={t("primary")} className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {mainNav.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group inline-flex h-10 items-center px-2 text-[0.9375rem] transition-colors hover:text-link",
                        active ? "text-link" : "text-fg",
                      )}
                    >
                      <BracketFrame
                        mode={active ? "static" : "hover"}
                        variant="mono"
                        className="gap-1"
                        bracketClassName="text-[0.8em]"
                      >
                        {t(item.key)}
                      </BracketFrame>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-1">
            <LocaleSwitch />
            <ThemeToggle />
            <MagneticButton href="/contact" size="sm" className="ms-2 hidden md:inline-flex">
              {t("startProject")}
            </MagneticButton>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label={t("openMenu")}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              className="group ms-1 grid size-10 place-items-center lg:hidden"
            >
              <span aria-hidden className="flex w-6 flex-col items-end gap-[5px] rtl:items-start">
                <span className="h-0.5 w-6 bg-fg" />
                <span className="h-0.5 w-4 bg-fg transition-[width] duration-300 group-hover:w-6" />
              </span>
            </button>
          </div>
        </div>
      </header>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
