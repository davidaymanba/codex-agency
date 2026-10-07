import type { SVGProps } from "react";
import { cn } from "@/lib/utils";

/**
 * CODEX wordmark, rebuilt from the brand guideline construction grid.
 * Units: cap height 162, stroke 38, corner radius 38. viewBox 921 × 162.
 *
 * Every piece is its own path so it can be animated individually:
 *   data-part="block"    — rectangular blocks of C / D / E / X
 *   data-part="bracket"  — the `{ }` that form the O (data-side="left" | "right")
 *   data-letter          — c | o | d | e | x
 *
 * Always rendered LTR (the logo never mirrors). Color = currentColor.
 */
export const LOGO_VIEWBOX = "0 0 921 162";

export const LOGO_PARTS = {
  c: ["M38 0H161V38H38Z", "M0 38H38V124H161V162H38A38 38 0 0 1 0 124Z"],
  bracketLeft: "M250 0V38H228V124H250V162H228A38 38 0 0 1 190 124V38A38 38 0 0 1 228 0Z",
  bracketRight: "M290 0H312A38 38 0 0 1 350 38V124A38 38 0 0 1 312 162H290V124H312V38H290Z",
  d: ["M381 0H503A38 38 0 0 1 541 38V124H503V38H381Z", "M381 124H503V162H381Z"],
  e: [
    "M608 0H731V38H608Z",
    "M570 38H608V124H731V162H608A38 38 0 0 1 570 124Z",
    "M608 62H731V100H608Z",
  ],
  x: ["M760 0H786.5L921 134.5V162H894.5L760 27.5Z", "M894.5 0H921V27.5L786.5 162H760V134.5Z"],
} as const;

type LogoProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  /** Accessible name. Pass `null` when the logo is decorative (e.g. next to visible text). */
  title?: string | null;
  showTM?: boolean;
};

export function Logo({ title = "CODEX", showTM = false, className, ...props }: LogoProps) {
  const decorative = title === null;
  return (
    <svg
      viewBox={showTM ? "0 0 960 162" : LOGO_VIEWBOX}
      fill="currentColor"
      direction="ltr"
      role={decorative ? undefined : "img"}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : title}
      className={cn("block h-auto overflow-visible", className)}
      {...props}
    >
      <g data-letter="c">
        {LOGO_PARTS.c.map((d) => (
          <path key={d} d={d} data-part="block" />
        ))}
      </g>
      <g data-letter="o">
        <path d={LOGO_PARTS.bracketLeft} data-part="bracket" data-side="left" />
        <path d={LOGO_PARTS.bracketRight} data-part="bracket" data-side="right" />
      </g>
      <g data-letter="d">
        {LOGO_PARTS.d.map((d) => (
          <path key={d} d={d} data-part="block" />
        ))}
      </g>
      <g data-letter="e">
        {LOGO_PARTS.e.map((d) => (
          <path key={d} d={d} data-part="block" />
        ))}
      </g>
      <g data-letter="x">
        {LOGO_PARTS.x.map((d) => (
          <path key={d} d={d} data-part="block" />
        ))}
      </g>
      {showTM && (
        <text x="934" y="18" fontSize="16" fontFamily="var(--font-montreal), sans-serif">
          TM
        </text>
      )}
    </svg>
  );
}

/** The standalone "C" mark — favicon, loaders, page-transition flash. */
export function CMark({ title = "CODEX", className, ...props }: LogoProps) {
  const decorative = title === null;
  return (
    <svg
      viewBox="0 0 161 162"
      fill="currentColor"
      role={decorative ? undefined : "img"}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : title}
      className={cn("block h-auto", className)}
      {...props}
    >
      {LOGO_PARTS.c.map((d) => (
        <path key={d} d={d} data-part="block" />
      ))}
    </svg>
  );
}

/**
 * A single logo bracket as a glyph. `side` is PHYSICAL (left/right), never logical,
 * so brackets never flip into `} {` in RTL.
 */
export function BracketGlyph({
  side,
  className,
  ...props
}: SVGProps<SVGSVGElement> & { side: "left" | "right" }) {
  return (
    <svg
      viewBox={side === "left" ? "190 0 60 162" : "290 0 60 162"}
      fill="currentColor"
      aria-hidden
      className={cn("inline-block h-[1em] w-auto", className)}
      {...props}
    >
      <path d={side === "left" ? LOGO_PARTS.bracketLeft : LOGO_PARTS.bracketRight} />
    </svg>
  );
}
