"use client";

import { Command } from "cmdk";
import { Languages, Moon, Plus, Search, Sparkles, User } from "lucide-react";
import { useTheme } from "next-themes";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Dialog as D } from "radix-ui";
import { useEffect, type ReactNode } from "react";
import { toast } from "sonner";
import { simulateLead } from "@/app/[locale]/dashboard/actions";
import { usePathname } from "@/i18n/navigation";
import { ALL_NAV } from "../nav";
import { useCan, useDashUser } from "./user-context";

const RANK = { viewer: 0, editor: 1, admin: 2 } as const;

type LeadLite = { id: string; name: string; email: string };

/** ⌘K / Ctrl+K command palette: jump anywhere, create anything, find a lead. */
export function CommandPalette({
  open,
  onOpenChange,
  leads,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  leads: LeadLite[];
}) {
  const t = useTranslations("dash");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const user = useDashUser();
  const canEdit = useCan("editor");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const run = (fn: () => void) => {
    onOpenChange(false);
    fn();
  };
  const go = (href: string) => run(() => router.push(`/${locale}${href}`));

  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-[90] bg-navy-950/50 backdrop-blur-[2px] data-[state=open]:animate-[dash-overlay-in_180ms_ease-out]" />
        <D.Content className="fixed top-[14vh] left-1/2 z-[91] w-[min(92vw,38rem)] -translate-x-1/2 border border-border bg-surface shadow-2xl outline-none data-[state=open]:animate-[dash-menu-in_260ms_cubic-bezier(0.34,1.56,0.64,1)]">
          <D.Title className="sr-only">{t("command.placeholder")}</D.Title>
          <D.Description className="sr-only">{t("command.placeholder")}</D.Description>
          <Command
            label={t("command.placeholder")}
            loop
            className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:label-mono [&_[cmdk-group-heading]]:text-fg-muted"
          >
            <div className="flex items-center gap-3 border-b border-border px-4">
              <Search aria-hidden className="size-4 text-fg-muted" />
              <Command.Input
                placeholder={t("command.placeholder")}
                className="h-14 flex-1 bg-transparent text-sm outline-none placeholder:text-fg-muted"
              />
            </div>
            <Command.List className="max-h-[min(60vh,26rem)] overflow-y-auto p-2">
              <Command.Empty className="py-10 text-center text-sm text-fg-muted">
                {t("command.empty")}
              </Command.Empty>

              <Command.Group heading={t("command.pages")}>
                {ALL_NAV.filter((i) => RANK[user.role] >= RANK[i.min]).map((i) => (
                  <Item key={i.key} onSelect={() => go(i.href)} icon={<i.icon aria-hidden />}>
                    {t(`nav.${i.key}`)}
                  </Item>
                ))}
              </Command.Group>

              <Command.Group heading={t("command.actions")}>
                {canEdit && (
                  <>
                    <Item onSelect={() => go("/dashboard/projects")} icon={<Plus aria-hidden />}>
                      {t("command.newProject")}
                    </Item>
                    <Item onSelect={() => go("/dashboard/posts")} icon={<Plus aria-hidden />}>
                      {t("command.newPost")}
                    </Item>
                  </>
                )}
                <Item
                  onSelect={() => run(() => setTheme(resolvedTheme === "dark" ? "light" : "dark"))}
                  icon={<Moon aria-hidden />}
                >
                  {t("command.toggleTheme")}
                </Item>
                <Item
                  onSelect={() =>
                    run(() => router.push(`/${locale === "ar" ? "en" : "ar"}${pathname}`))
                  }
                  icon={<Languages aria-hidden />}
                >
                  {t("command.switchLang")}
                </Item>
                {canEdit && process.env.NODE_ENV !== "production" && (
                  <Item
                    onSelect={() =>
                      run(async () => {
                        const r = await simulateLead();
                        if (r.ok) window.dispatchEvent(new Event("codex:poll-leads"));
                        else toast.error(t("common.forbidden"));
                      })
                    }
                    icon={<Sparkles aria-hidden />}
                  >
                    {t("command.simulateLead")}
                  </Item>
                )}
              </Command.Group>

              {leads.length > 0 && (
                <Command.Group heading={t("command.leads")}>
                  {leads.map((l) => (
                    <Item
                      key={l.id}
                      value={`${l.name} ${l.email}`}
                      onSelect={() => go(`/dashboard/leads?lead=${l.id}`)}
                      icon={<User aria-hidden />}
                    >
                      <span>{l.name}</span>
                      <span className="ms-auto truncate text-xs text-fg-muted" dir="ltr">
                        {l.email}
                      </span>
                    </Item>
                  ))}
                </Command.Group>
              )}
            </Command.List>
          </Command>
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}

function Item({
  children,
  icon,
  onSelect,
  value,
}: {
  children: ReactNode;
  icon: ReactNode;
  onSelect: () => void;
  value?: string;
}) {
  return (
    <Command.Item
      value={value}
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm outline-none data-[selected=true]:bg-primary data-[selected=true]:text-white [&_svg]:size-4 [&_svg]:shrink-0"
    >
      {icon}
      {children}
    </Command.Item>
  );
}
