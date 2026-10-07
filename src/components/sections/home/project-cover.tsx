import Image from "next/image";
import { BracketGlyph } from "@/components/brand/logo";
import type { ProjectVM } from "@/lib/data/content";
import { cn } from "@/lib/utils";

/** Deterministic pseudo-random sequence from a string (stable SSR/CSR). */
function seeded(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

/**
 * Project cover. Uses the uploaded image when present; otherwise renders on-brand
 * placeholder art (blocks / grid / brackets / chart / flow) seeded by the slug.
 */
export type CoverSource = Pick<ProjectVM, "slug" | "cover" | "coverStyle"> & { label?: string };

export function ProjectCover({
  project,
  className,
  priority,
}: {
  project: CoverSource;
  className?: string;
  priority?: boolean;
}) {
  if (project.cover) {
    return (
      <Image
        src={project.cover}
        alt=""
        fill
        priority={priority}
        sizes="(min-width: 1024px) 50vw, 100vw"
        className={cn("object-cover", className)}
      />
    );
  }
  const rnd = seeded(project.slug);
  const style = project.coverStyle;

  return (
    <div
      aria-hidden
      dir="ltr"
      className={cn("absolute inset-0 overflow-hidden", COVER_BG[style], className)}
    >
      {style === "grid" && (
        <div className="absolute inset-0 bg-grid [--grid-line:color-mix(in_oklab,var(--color-white)_16%,transparent)] [--grid-size:48px]">
          <div className="absolute inset-[18%] grid grid-cols-6 grid-rows-4 gap-2">
            {Array.from({ length: 24 }, (_, i) => (
              <span
                key={i}
                className={cn(
                  rnd() > 0.55 ? "bg-white/90" : rnd() > 0.5 ? "bg-blue-400/60" : "bg-transparent",
                )}
              />
            ))}
          </div>
        </div>
      )}
      {style === "blocks" && (
        <div className="absolute inset-0 grid grid-cols-10 grid-rows-7">
          {Array.from({ length: 70 }, (_, i) => {
            const r = rnd();
            return (
              <span
                key={i}
                className={cn(
                  r > 0.86
                    ? "bg-blue-600"
                    : r > 0.74
                      ? "bg-blue-400"
                      : r > 0.7
                        ? "bg-yellow-500"
                        : r > 0.55
                          ? "bg-blue-300/50"
                          : "",
                )}
              />
            );
          })}
        </div>
      )}
      {style === "brackets" && (
        <div className="absolute inset-0 grid place-items-center">
          <span className="flex gap-[0.3em] text-[clamp(8rem,18vw,16rem)] leading-none text-blue-600">
            <BracketGlyph side="left" />
            <span className="w-[0.5em] self-center border-t-[0.12em] border-yellow-500" />
            <BracketGlyph side="right" />
          </span>
        </div>
      )}
      {style === "chart" && (
        <div className="absolute inset-x-[12%] top-[22%] bottom-[14%] flex items-end gap-[3%]">
          {[3, 4, 3, 6, 5, 8, 7, 10].map((h, i, arr) => (
            <span
              key={i}
              className={cn(
                "flex-1",
                i === arr.length - 1
                  ? "bg-yellow-500"
                  : i > arr.length - 4
                    ? "bg-blue-600"
                    : "bg-blue-300",
              )}
              style={{ height: `${h * 10}%` }}
            />
          ))}
        </div>
      )}
      {style === "flow" && (
        <svg
          viewBox="0 0 400 250"
          className="absolute inset-0 size-full"
          preserveAspectRatio="xMidYMid slice"
        >
          <g stroke="var(--color-blue-400)" strokeWidth="2" fill="none">
            <path d="M90 125 C130 125 130 125 170 125" />
            <path d="M250 125 C280 125 280 70 310 70" />
            <path d="M250 125 C280 125 280 180 310 180" />
            <path d="M210 150 C210 175 180 185 180 200" strokeDasharray="4 5" />
            <path d="M210 150 C210 175 240 185 240 200" strokeDasharray="4 5" />
          </g>
          {[
            [30, 105, 60, 40],
            [170, 100, 80, 50],
            [310, 50, 60, 40],
            [310, 160, 60, 40],
          ].map(([x, y, w, h], i) => (
            <rect
              key={i}
              x={x}
              y={y}
              width={w}
              height={h}
              rx={6}
              fill="var(--color-navy-950)"
              stroke={i === 1 ? "var(--color-blue-400)" : "var(--color-indigo-700)"}
              strokeWidth="2"
            />
          ))}
          <rect x={160} y={196} width={40} height={18} rx={9} fill="var(--color-indigo-700)" />
          <rect x={220} y={196} width={40} height={18} rx={9} fill="var(--color-indigo-700)" />
          <rect x={180} y={112} width={24} height={24} rx={4} fill="var(--color-blue-600)" />
          <rect x={286} y={121} width={8} height={8} fill="var(--color-yellow-500)" />
        </svg>
      )}
      {project.label && (
        <span className="absolute start-4 bottom-4 label-mono text-current opacity-70">{`{ ${project.label} }`}</span>
      )}
    </div>
  );
}

const COVER_BG: Record<ProjectVM["coverStyle"], string> = {
  grid: "bg-blue-600 text-white",
  blocks: "bg-indigo-50 text-navy-950",
  brackets: "bg-navy-950 text-indigo-200",
  chart: "bg-blue-100 text-navy-950",
  flow: "bg-navy-950 bg-grid text-indigo-200 [--grid-line:color-mix(in_oklab,var(--color-indigo-700)_45%,transparent)] [--grid-size:32px]",
};
