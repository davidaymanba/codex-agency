"use client";

import { ArrowUpRight, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";

const KEY = "codex-announcement-dismissed";

/**
 * Optional announcement strip above the header (text + link from site settings).
 * Dismissal is remembered per message. While visible, the site wrapper's
 * `data-announce="on"` adds its height to `--header-h` so page content clears it.
 */
export function AnnouncementBar({
  announcement,
}: {
  announcement: { text: string; href: string } | null;
}) {
  const t = useTranslations("nav");
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!announcement) return;
    try {
      // Restore a per-viewer dismissal from browser storage.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (localStorage.getItem(KEY) === announcement.text) setHidden(true);
    } catch {}
  }, [announcement]);

  useEffect(() => {
    document
      .querySelector("[data-announce]")
      ?.setAttribute("data-announce", announcement && !hidden ? "on" : "off");
  }, [announcement, hidden]);

  if (!announcement || hidden) return null;
  const external = /^https?:/.test(announcement.href);
  const content = (
    <>
      <span className="truncate">{announcement.text}</span>
      {announcement.href && (
        <ArrowUpRight aria-hidden className="size-3.5 shrink-0 rtl:-scale-x-100" />
      )}
    </>
  );
  return (
    <div className="relative flex h-9 items-center justify-center bg-primary px-10 text-[0.8125rem] text-white">
      {announcement.href ? (
        external ? (
          <a
            href={announcement.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-w-0 items-center gap-1.5 hover:underline"
          >
            {content}
          </a>
        ) : (
          <Link
            href={announcement.href}
            className="flex min-w-0 items-center gap-1.5 hover:underline"
          >
            {content}
          </Link>
        )
      ) : (
        <span className="flex min-w-0 items-center gap-1.5">{content}</span>
      )}
      <button
        type="button"
        onClick={() => {
          setHidden(true);
          try {
            localStorage.setItem(KEY, announcement.text);
          } catch {}
        }}
        aria-label={t("closeMenu")}
        className="absolute end-2 grid size-7 place-items-center hover:bg-white/10"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
