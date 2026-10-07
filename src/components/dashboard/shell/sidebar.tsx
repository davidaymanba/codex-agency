"use client";

import { ExternalLink, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { CMark, Logo } from "@/components/brand/logo";
import { Tip } from "@/components/dashboard/ui/overlays";
import { Link, usePathname } from "@/i18n/navigation";
import { usePrefersReducedMotion } from "@/hooks/use-media";
import { cn } from "@/lib/utils";
import { DASH_NAV } from "../nav";
import { useCan, useDashUser } from "./user-context";

const RANK = { viewer: 0, editor: 1, admin: 2 } as const;

export function isActivePath(pathname: string, href: string) {
  return href === "/dashboard"
    ? pathname === "/dashboard"
    : pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Grouped navigation with a shared-layout active indicator that slides between items.
 * Collapsed: icons only + tooltips. Used both in the desktop rail and the mobile drawer.
 */
export function SidebarNav({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const t = useTranslations("dash.nav");
  const pathname = usePathname();
  const user = useDashUser();
  const reduced = usePrefersReducedMotion();

  return (
    <nav aria-label={t("groups.main")} className="flex-1 overflow-y-auto px-3 py-4">
      {DASH_NAV.map((group) => {
        const items = group.items.filter((i) => RANK[user.role] >= RANK[i.min]);
        if (!items.length) return null;
        return (
          <div key={group.key} className="mb-5">
            <p
              className={cn(
                "mb-2 px-3 label-mono text-fg-muted transition-opacity",
                collapsed && "sr-only",
              )}
            >
              {t(`groups.${group.key}`)}
            </p>
            <ul className="space-y-0.5">
              {items.map((item) => {
                const active = isActivePath(pathname, item.href);
                const Icon = item.icon;
                return (
                  <li key={item.key}>
                    <Tip label={t(item.key)} side="right" disabled={!collapsed}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "group relative flex h-10 items-center gap-3 px-3 text-sm transition-colors duration-150",
                          active ? "text-white" : "text-fg-muted hover:bg-surface-2 hover:text-fg",
                          collapsed && "justify-center px-0",
                        )}
                      >
                        {active && (
                          <motion.span
                            layoutId="dash-nav-active"
                            transition={
                              reduced
                                ? { duration: 0 }
                                : { type: "spring", stiffness: 520, damping: 40 }
                            }
                            className="absolute inset-0 bg-primary"
                          />
                        )}
                        <Icon aria-hidden className="relative size-[1.125rem] shrink-0" />
                        <span className={cn("relative truncate", collapsed && "sr-only")}>
                          {t(item.key)}
                        </span>
                        {active && !collapsed && (
                          <span aria-hidden className="relative ms-auto size-1.5 bg-yellow-500" />
                        )}
                      </Link>
                    </Tip>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const t = useTranslations("dash.nav");
  const canEdit = useCan("editor");
  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-dvh shrink-0 flex-col border-e border-border bg-surface transition-[width] duration-300 ease-[var(--ease-expo-out)] lg:flex",
        collapsed ? "w-[4.5rem]" : "w-64",
      )}
    >
      <div
        className={cn(
          "flex h-16 items-center border-b border-border px-5",
          collapsed && "justify-center px-0",
        )}
      >
        <Link
          href="/dashboard"
          aria-label="CODEX dashboard"
          className="text-primary dark:text-white"
        >
          {collapsed ? (
            <CMark title={null} className="w-7" />
          ) : (
            <Logo title={null} className="w-28" />
          )}
        </Link>
      </div>
      <SidebarNav collapsed={collapsed} />
      <div
        className={cn(
          "space-y-1 border-t border-border p-3",
          collapsed && "flex flex-col items-center",
        )}
      >
        <Tip label={t("viewSite")} side="right" disabled={!collapsed}>
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex h-9 items-center gap-3 px-3 text-sm text-fg-muted hover:text-fg",
              collapsed && "justify-center px-0",
            )}
          >
            <ExternalLink aria-hidden className="size-4 shrink-0" />
            <span className={cn(collapsed && "sr-only")}>{t("viewSite")}</span>
          </Link>
        </Tip>
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? t("expand") : t("collapse")}
          className={cn(
            "flex h-9 w-full items-center gap-3 px-3 text-sm text-fg-muted hover:text-fg",
            collapsed && "justify-center px-0",
          )}
        >
          {collapsed ? (
            <PanelLeftOpen aria-hidden className="size-4 rtl:-scale-x-100" />
          ) : (
            <PanelLeftClose aria-hidden className="size-4 rtl:-scale-x-100" />
          )}
          <span className={cn(collapsed && "sr-only")}>
            {collapsed ? t("expand") : t("collapse")}
          </span>
        </button>
        {!canEdit && !collapsed && <p className="px-3 pt-2 label-mono text-fg-muted">viewer</p>}
      </div>
    </aside>
  );
}
