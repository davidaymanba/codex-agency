import { Plus } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";

/**
 * FAQ accordion built on native <details> (keyboard + screen reader friendly, works without JS).
 * Emits FAQPage JSON-LD alongside.
 */
export function FaqList({ items }: { items: { q: string; a: string }[] }) {
  return (
    <Reveal stagger className="divide-y divide-border border-y border-border">
      {items.map((f) => (
        <details key={f.q} className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-title font-medium transition-colors hover:text-link [&::-webkit-details-marker]:hidden">
            {f.q}
            <span className="grid size-10 shrink-0 place-items-center border border-border transition-colors group-open:border-primary group-open:bg-primary group-open:text-white">
              <Plus
                aria-hidden
                className="size-4 transition-transform duration-300 group-open:rotate-45"
              />
            </span>
          </summary>
          <p className="max-w-3xl pb-6 text-lead text-fg-muted">{f.a}</p>
        </details>
      ))}
    </Reveal>
  );
}
