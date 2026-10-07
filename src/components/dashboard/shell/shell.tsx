"use client";

import { useTranslations } from "next-intl";
import { Dialog as D } from "radix-ui";
import { useEffect, useState, type ReactNode } from "react";
import { Toaster } from "sonner";
import { Logo } from "@/components/brand/logo";
import { SheetContent, TooltipProvider } from "@/components/dashboard/ui/overlays";
import { useDirection } from "@/hooks/use-direction";
import type { Profile } from "@/lib/dashboard/types";
import { CommandPalette } from "./command-palette";
import { LeadStreamProvider, type LeadPing } from "./lead-stream";
import { Sidebar, SidebarNav } from "./sidebar";
import { Topbar } from "./topbar";
import { DashUserProvider } from "./user-context";

const COLLAPSE_KEY = "codex-dash-collapsed";

/** Dashboard chrome: sidebar (rail on desktop, drawer on mobile), top bar, ⌘K, toasts, lead stream. */
export function DashboardShell({
  user,
  initialLeads,
  searchLeads,
  children,
}: {
  user: Profile;
  initialLeads: LeadPing[];
  searchLeads: { id: string; name: string; email: string }[];
  children: ReactNode;
}) {
  const t = useTranslations("dash.nav");
  const { isRTL } = useDirection();
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [palette, setPalette] = useState(false);

  useEffect(() => {
    try {
      // Restoring a per-viewer UI preference from browser storage.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {}
  }, []);

  const toggle = () =>
    setCollapsed((c) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, c ? "0" : "1");
      } catch {}
      return !c;
    });

  return (
    <DashUserProvider user={user}>
      <TooltipProvider>
        <LeadStreamProvider initial={initialLeads}>
          <div className="flex min-h-dvh bg-bg">
            <Sidebar collapsed={collapsed} onToggle={toggle} />
            <div className="flex min-w-0 flex-1 flex-col">
              <Topbar onOpenPalette={() => setPalette(true)} onOpenDrawer={() => setDrawer(true)} />
              <main id="main" className="flex-1 px-4 py-6 md:px-8 md:py-8">
                {children}
              </main>
            </div>
          </div>

          {/* Mobile drawer (slides from the inline-start edge). */}
          <D.Root open={drawer} onOpenChange={setDrawer}>
            <SheetContent
              title={t("openMenu")}
              className="start-0 end-auto w-72 border-s-0 border-e [--sheet-from:-100%] rtl:[--sheet-from:100%]"
            >
              <div className="flex h-16 items-center border-b border-border px-5 text-primary dark:text-white">
                <Logo title={null} className="w-28" />
              </div>
              <SidebarNav onNavigate={() => setDrawer(false)} />
            </SheetContent>
          </D.Root>

          <CommandPalette open={palette} onOpenChange={setPalette} leads={searchLeads} />
          <Toaster
            position={isRTL ? "bottom-left" : "bottom-right"}
            dir={isRTL ? "rtl" : "ltr"}
            toastOptions={{
              unstyled: true,
              classNames: {
                toast:
                  "flex w-[22rem] items-start gap-3 border border-border bg-surface p-4 text-sm text-fg shadow-[0_16px_48px_-16px_color-mix(in_oklab,var(--color-navy-950)_45%,transparent)] border-s-4 border-s-primary",
                title: "font-medium",
                description: "text-xs text-fg-muted mt-0.5",
                actionButton:
                  "ms-auto shrink-0 bg-primary px-2.5 py-1 text-xs font-medium text-white",
                error: "border-s-yellow-500",
              },
            }}
          />
        </LeadStreamProvider>
      </TooltipProvider>
    </DashUserProvider>
  );
}
