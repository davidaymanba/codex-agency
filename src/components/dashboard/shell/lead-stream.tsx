"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { pollLeads } from "@/app/[locale]/dashboard/actions";
import { supabaseBrowser } from "@/lib/supabase/browser";

export type LeadPing = { id: string; name: string; service: string; created_at: string };

type Stream = {
  items: LeadPing[];
  unread: number;
  fresh: Set<string>;
  markAllRead: () => void;
};

const Ctx = createContext<Stream | null>(null);
const READ_KEY = "codex-dash-last-read";
const POLL_MS = 60_000; // safety net; Supabase Realtime delivers new leads instantly

/**
 * Realtime new-lead feed: a Supabase Realtime channel on `leads` INSERTs (RLS-filtered, so only
 * staff receive rows) triggers `check()`, which fetches the new rows and shows toasts. A slow
 * poll remains as a safety net if the socket drops.
 */
export function LeadStreamProvider({
  initial,
  children,
}: {
  initial: LeadPing[];
  children: ReactNode;
}) {
  const t = useTranslations("dash.topbar");
  const tl = useTranslations("dash.leads");
  const locale = useLocale();
  const router = useRouter();
  const [items, setItems] = useState(initial);
  // Empty on the server and first client render (no hydration mismatch); filled after mount.
  const [lastRead, setLastRead] = useState<string | null>(null);
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const latest = useRef(initial[0]?.created_at ?? new Date().toISOString());

  const check = useCallback(async () => {
    const incoming = await pollLeads(latest.current).catch(() => []);
    if (!incoming.length) return;
    latest.current = incoming[0].created_at;
    setItems((prev) => [...incoming, ...prev].slice(0, 30));
    setFresh((prev) => new Set([...prev, ...incoming.map((l) => l.id)]));
    incoming.forEach((l) =>
      toast(t("newLead", { name: l.name }), {
        description: tl(`services.${l.service as "other"}`),
        action: {
          label: tl("details"),
          onClick: () => router.push(`/${locale}/dashboard/leads?lead=${l.id}`),
        },
      }),
    );
    router.refresh();
  }, [locale, router, t, tl]);

  useEffect(() => {
    try {
      // Reading browser storage is a sync-from-external-system effect.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLastRead(localStorage.getItem(READ_KEY) ?? "");
    } catch {
      setLastRead("");
    }
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const loop = async () => {
      if (!document.hidden) await check();
      timer = setTimeout(loop, POLL_MS);
    };
    timer = setTimeout(loop, POLL_MS);
    const now = () => void check();
    window.addEventListener("codex:poll-leads", now);
    // Realtime must join with the user's JWT (not the anon key) or RLS filters every row out.
    const sb = supabaseBrowser();
    const channel = sb.channel("dashboard-leads").on("postgres_changes", { event: "INSERT", schema: "public", table: "leads" }, () => void check());
    let cancelled = false;
    void sb.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (data.session) sb.realtime.setAuth(data.session.access_token);
      channel.subscribe();
    });
    const { data: authSub } = sb.auth.onAuthStateChange((_e, session) => {
      if (session) sb.realtime.setAuth(session.access_token);
    });
    return () => {
      cancelled = true;
      clearTimeout(timer);
      window.removeEventListener("codex:poll-leads", now);
      authSub.subscription.unsubscribe();
      void sb.removeChannel(channel);
    };
  }, [check]);

  const markAllRead = useCallback(() => {
    const now = new Date().toISOString();
    setLastRead(now);
    try {
      localStorage.setItem(READ_KEY, now);
    } catch {}
  }, []);

  const value = useMemo(
    () => ({
      items,
      unread: lastRead === null ? 0 : items.filter((i) => i.created_at > lastRead).length,
      fresh,
      markAllRead,
    }),
    [items, lastRead, fresh, markAllRead],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLeadStream() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useLeadStream outside provider");
  return c;
}
