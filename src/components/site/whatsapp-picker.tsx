"use client";

import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { WhatsAppIcon } from "@/components/brand/social-icons";
import { Button, ButtonLink } from "@/components/ui/button";
import { formatWhatsapp, whatsappHref } from "@/config/site";
import { cn } from "@/lib/utils";
import { useSiteContact } from "./site-settings";

type TriggerProps =
  | { kind: "link"; href: string }
  | { kind: "menu"; onClick: () => void; "aria-expanded": boolean; "aria-controls": string };

/**
 * WhatsApp entry point that handles several numbers: with one number the trigger is a plain
 * link; with more, it opens a small list so the visitor picks one. Closes on outside tap,
 * Esc or after choosing.
 */
export function WhatsAppPicker({
  trigger,
  side = "top",
  align = "end",
  className,
}: {
  trigger: (props: TriggerProps) => ReactNode;
  side?: "top" | "bottom";
  align?: "start" | "end";
  className?: string;
}) {
  const t = useTranslations("whatsapp");
  const { whatsapps } = useSiteContact();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (whatsapps.length <= 1) {
    return <div className={className}>{trigger({ kind: "link", href: whatsappHref(whatsapps[0]) })}</div>;
  }

  return (
    <div ref={root} className={cn("relative", className)}>
      {trigger({
        kind: "menu",
        onClick: () => setOpen((v) => !v),
        "aria-expanded": open,
        "aria-controls": id,
      })}
      <div
        id={id}
        hidden={!open}
        className={cn(
          "absolute z-50 w-max min-w-56 border border-border bg-surface p-2 text-fg shadow-[0_16px_40px_-16px_rgb(0_0_0/0.5)]",
          side === "top" ? "bottom-full mb-3" : "top-full mt-3",
          align === "end" ? "end-0" : "start-0",
        )}
      >
        <p className="px-3 pt-1 pb-2 label-mono text-fg-muted">{t("choose")}</p>
        <ul>
          {whatsapps.map((n) => (
            <li key={n}>
              <a
                href={whatsappHref(n)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 font-medium transition-colors hover:bg-surface-2 hover:text-link"
              >
                <WhatsAppIcon className="size-5 shrink-0 text-link" />
                <span dir="ltr">{formatWhatsapp(n)}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Footer CTA: the secondary brand button, as a link or a number picker. */
export function WhatsAppCta({ children }: { children: ReactNode }) {
  const icon = <WhatsAppIcon className="size-5" />;
  return (
    <WhatsAppPicker
      align="start"
      trigger={(p) =>
        p.kind === "link" ? (
          <ButtonLink href={p.href} variant="secondary" size="lg" icon={icon}>
            {children}
          </ButtonLink>
        ) : (
          <Button
            type="button"
            variant="secondary"
            size="lg"
            icon={icon}
            onClick={p.onClick}
            aria-expanded={p["aria-expanded"]}
            aria-controls={p["aria-controls"]}
          >
            {children}
          </Button>
        )
      }
    />
  );
}
