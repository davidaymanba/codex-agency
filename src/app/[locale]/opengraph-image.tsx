import { ImageResponse } from "next/og";
import { LOGO_PARTS, LOGO_VIEWBOX } from "@/components/brand/logo";
import { palette } from "@/config/brand";

export const alt = "CODEX — Software, Branding & Marketing Agency";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Social card (Open Graph + Twitter) for every page. Rendered with the brand palette and
 * the real logo geometry. Text is Latin on purpose: the OG renderer can't shape Arabic.
 */
export default async function OgImage() {
  const paths = [
    ...LOGO_PARTS.c,
    LOGO_PARTS.bracketLeft,
    LOGO_PARTS.bracketRight,
    ...LOGO_PARTS.d,
    ...LOGO_PARTS.e,
    ...LOGO_PARTS.x,
  ];
  const cell = 70;
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: palette.navy950,
        position: "relative",
      }}
    >
      {/* block grid */}
      <div style={{ position: "absolute", inset: 0, display: "flex", flexWrap: "wrap" }}>
        {Array.from({ length: Math.ceil(1200 / cell) * Math.ceil(630 / cell) }, (_, i) => (
          <div
            key={i}
            style={{
              width: cell,
              height: cell,
              border: `1px solid ${palette.indigo700}33`,
              background: [
                2 * 18 + 16,
                3 * 18 + 14,
                3 * 18 + 15,
                4 * 18 + 15,
                5 * 18 + 16,
                6 * 18 + 13,
              ].includes(i)
                ? `${palette.blue600}88`
                : "transparent",
            }}
          />
        ))}
      </div>
      <svg viewBox={LOGO_VIEWBOX} width={560} height={98} style={{ position: "relative" }}>
        {paths.map((d) => (
          <path key={d} d={d} fill={palette.indigo50} />
        ))}
      </svg>
      <div style={{ display: "flex", flexDirection: "column", position: "relative" }}>
        <div
          style={{
            fontSize: 60,
            fontWeight: 700,
            color: palette.indigo50,
            letterSpacing: -1.5,
            lineHeight: 1.05,
          }}
        >
          We build brands, code, and growth.
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontSize: 26,
            color: palette.indigo200,
            gap: 18,
          }}
        >
          <span style={{ color: palette.blue400 }}>{"{"}</span>
          <span>Development · Branding · Marketing · AI</span>
          <span style={{ color: palette.blue400 }}>{"}"}</span>
          <span
            style={{
              marginLeft: "auto",
              background: palette.yellow500,
              color: palette.navy950,
              padding: "4px 14px",
              fontSize: 22,
            }}
          >
            EG · SA · AE · KW · OM
          </span>
        </div>
      </div>
    </div>,
    size,
  );
}
