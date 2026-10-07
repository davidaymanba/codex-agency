import { ArrowUpRight } from "lucide-react";
import { BlockReveal } from "@/components/motion/block-reveal";
import { Link } from "@/i18n/navigation";
import type { ProjectVM } from "@/lib/data/content";
import { ProjectCover } from "./project-cover";

/** Project card: pixel-reveal cover, hover tags, "View" cursor. Used on home, Work and detail pages. */
export function ProjectCard({ project: p }: { project: ProjectVM }) {
  return (
    <Link href={`/work/${p.slug}`} data-cursor="view" className="group block">
      <BlockReveal
        cols={10}
        rows={7}
        className="relative aspect-[4/3] rounded-[var(--radius-brand)]"
      >
        <div className="absolute inset-0 transition-transform duration-700 ease-[var(--ease-expo-out)] group-hover:scale-[1.04]">
          <ProjectCover project={{ ...p, label: p.client }} />
        </div>
        <ul className="absolute inset-x-4 top-4 flex flex-wrap gap-2">
          {p.tags.map((tag, ti) => (
            <li
              key={tag}
              className="translate-y-2 bg-bg/90 px-2 py-1 label-mono text-fg opacity-0 backdrop-blur transition-[opacity,translate] duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100"
              style={{ transitionDelay: `${ti * 40}ms` }}
            >
              {tag}
            </li>
          ))}
        </ul>
      </BlockReveal>
      <div className="mt-5 flex items-start justify-between gap-6">
        <div>
          <p className="label-mono text-fg-muted">
            <span dir="ltr">{p.year}</span> · {p.categoryName}
          </p>
          <h3 className="mt-2 text-title font-medium transition-colors group-hover:text-link">
            {p.title}
          </h3>
          <p className="mt-2 max-w-md text-fg-muted">{p.summary}</p>
        </div>
        <span className="mt-1 grid size-10 shrink-0 place-items-center border border-border transition-colors duration-300 group-hover:border-primary group-hover:bg-primary group-hover:text-white">
          <ArrowUpRight aria-hidden className="size-4 rtl:-scale-x-100" />
        </span>
      </div>
    </Link>
  );
}
