"use client";

import { Bell, ChevronRight, LogOut, Menu as MenuIcon, Search } from "lucide-react";
import { useFormatter, useLocale, useNow, useTranslations } from "next-intl";
import { signOut } from "@/app/[locale]/(auth)/actions";
import { DashButton } from "@/components/dashboard/ui/dash-button";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  MenuTrigger,
} from "@/components/dashboard/ui/overlays";
import { Avatar, Kbd } from "@/components/dashboard/ui/primitives";
import { LocaleSwitch } from "@/components/site/locale-switch";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { ALL_NAV } from "../nav";
import { useLeadStream } from "./lead-stream";
import { isActivePath } from "./sidebar";
import { useDashUser } from "./user-context";

function Breadcrumbs() {
  const t = useTranslations("dash.nav");
  const pathname = usePathname();
  const current = ALL_NAV.filter((i) => i.href !== "/dashboard").find((i) =>
    isActivePath(pathname, i.href),
  );
  const crumbs = [
    { href: "/dashboard", label: t("overview") },
    ...(current ? [{ href: current.href, label: t(current.key) }] : []),
  ];
  return (
    <nav aria-label="Breadcrumb" className="hidden min-w-0 md:block">
      <ol className="flex items-center gap-1.5 text-sm">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={c.href} className="flex items-center gap-1.5">
              {i > 0 && (
                <ChevronRight aria-hidden className="size-3.5 text-fg-muted rtl:-scale-x-100" />
              )}
              {last ? (
                <span aria-current="page" className="truncate font-medium">
                  {c.label}
                </span>
              ) : (
                <Link href={c.href} className="text-fg-muted hover:text-fg">
                  {c.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function Notifications() {
  const t = useTranslations("dash");
  const { items, unread, markAllRead, fresh } = useLeadStream();
  const format = useFormatter();
  const now = useNow({ updateInterval: 60_000 });
  return (
    <Menu onOpenChange={(o) => !o && unread && markAllRead()}>
      <MenuTrigger asChild>
        <DashButton
          variant="ghost"
          size="icon"
          aria-label={`${t("topbar.notifications")}${unread ? ` (${unread})` : ""}`}
          className="relative"
        >
          <Bell />
          {unread > 0 && (
            <span className="absolute end-1 top-1 grid min-w-4 animate-pulse-ring place-items-center bg-yellow-500 px-1 text-[0.625rem] font-bold text-navy-950">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </DashButton>
      </MenuTrigger>
      <MenuContent className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
          <p className="text-sm font-medium">{t("topbar.notifications")}</p>
          {unread > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="text-xs text-link hover:underline"
            >
              {t("topbar.markRead")}
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto p-1">
          {items.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-fg-muted">
              {t("topbar.noNotifications")}
            </p>
          ) : (
            items.slice(0, 12).map((n) => (
              <MenuItem key={n.id} asChild>
                <Link
                  href={`/dashboard/leads?lead=${n.id}`}
                  className={cn(
                    "items-start",
                    fresh.has(n.id) && "bg-blue-100/60 dark:bg-blue-600/15",
                  )}
                >
                  <span aria-hidden className="mt-1.5 size-2 shrink-0 bg-blue-400" />
                  <span className="min-w-0">
                    <span className="block truncate">{t("topbar.newLead", { name: n.name })}</span>
                    <span className="block text-xs text-fg-muted">
                      {t(`leads.services.${n.service as "other"}`)} ·{" "}
                      {format.relativeTime(new Date(n.created_at), now)}
                    </span>
                  </span>
                </Link>
              </MenuItem>
            ))
          )}
        </div>
      </MenuContent>
    </Menu>
  );
}

function ProfileMenu() {
  const t = useTranslations("dash.topbar");
  const user = useDashUser();
  const locale = useLocale();
  return (
    <Menu>
      <MenuTrigger asChild>
        <button
          type="button"
          aria-label={t("profile")}
          className="ms-1 flex items-center gap-2 p-1 hover:bg-surface-2"
        >
          <Avatar name={user.full_name} />
        </button>
      </MenuTrigger>
      <MenuContent>
        <MenuLabel>
          <span className="block text-sm font-medium text-fg">{user.full_name}</span>
          <span className="block" dir="ltr">
            {user.email}
          </span>
          <span className="mt-1 inline-block bg-surface-2 px-1.5 py-0.5 label-mono">
            {user.role}
          </span>
        </MenuLabel>
        <MenuSeparator />
        <MenuItem onSelect={() => signOut(locale)}>
          <LogOut aria-hidden className="rtl:-scale-x-100" />
          {t("signOut")}
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}

export function Topbar({
  onOpenPalette,
  onOpenDrawer,
}: {
  onOpenPalette: () => void;
  onOpenDrawer: () => void;
}) {
  const t = useTranslations("dash");
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border glass px-4 md:px-6">
      <DashButton
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onOpenDrawer}
        aria-label={t("nav.openMenu")}
      >
        <MenuIcon />
      </DashButton>
      <Breadcrumbs />
      <button
        type="button"
        onClick={onOpenPalette}
        aria-label={t("topbar.search")}
        className="ms-auto flex h-9 w-9 shrink-0 items-center justify-center gap-2 border border-border bg-surface text-sm text-fg-muted transition-colors hover:border-border-strong sm:w-full sm:max-w-72 sm:justify-start sm:px-3 md:ms-6 lg:ms-auto"
      >
        <Search aria-hidden className="size-4 shrink-0" />
        <span className="hidden flex-1 truncate text-start sm:block">{t("topbar.search")}</span>
        <span className="hidden sm:block">
          <Kbd>⌘K</Kbd>
        </span>
      </button>
      <div className="flex items-center gap-0.5">
        <Notifications />
        <LocaleSwitch className="hidden sm:grid" />
        <ThemeToggle />
        <ProfileMenu />
      </div>
    </header>
  );
}
