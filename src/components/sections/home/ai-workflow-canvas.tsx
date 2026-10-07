"use client";

import { Bot, Brain, Database, Mail, Split, Users, Wrench, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useRef, useState, type ComponentType, type SVGProps } from "react";
import { WhatsAppIcon } from "@/components/brand/social-icons";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/animation/gsap";
import { useDirection } from "@/hooks/use-direction";
import { usePrefersReducedMotion } from "@/hooks/use-media";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ layout */

const W = 1000;
const H = 470;

export type NodeId =
  "trigger" | "agent" | "model" | "memory" | "tools" | "router" | "crm" | "reply" | "email";

type NodeDef = {
  id: NodeId;
  x: number;
  y: number;
  w: number;
  h: number;
  icon: LucideIcon | ComponentType<SVGProps<SVGSVGElement>>;
  kind: "main" | "sub";
  /** Build order on scroll. */
  step: number;
};

// Authored in LTR; mirrored for RTL at render time.
const NODES: NodeDef[] = [
  { id: "trigger", x: 0, y: 160, w: 205, h: 64, icon: WhatsAppIcon, kind: "main", step: 0 },
  { id: "agent", x: 265, y: 150, w: 200, h: 84, icon: Bot, kind: "main", step: 1 },
  { id: "model", x: 216, y: 350, w: 128, h: 54, icon: Brain, kind: "sub", step: 2 },
  { id: "memory", x: 352, y: 350, w: 128, h: 54, icon: Database, kind: "sub", step: 2 },
  { id: "tools", x: 488, y: 350, w: 128, h: 54, icon: Wrench, kind: "sub", step: 2 },
  { id: "router", x: 560, y: 160, w: 150, h: 64, icon: Split, kind: "main", step: 3 },
  { id: "crm", x: 790, y: 40, w: 190, h: 64, icon: Users, kind: "main", step: 4 },
  { id: "reply", x: 790, y: 160, w: 190, h: 64, icon: WhatsAppIcon, kind: "main", step: 4 },
  { id: "email", x: 790, y: 280, w: 190, h: 64, icon: Mail, kind: "main", step: 4 },
];

type EdgeDef = { id: string; from: NodeId; to: NodeId; kind: "flow" | "sub" };

const EDGES: EdgeDef[] = [
  { id: "e-trigger-agent", from: "trigger", to: "agent", kind: "flow" },
  { id: "e-agent-model", from: "agent", to: "model", kind: "sub" },
  { id: "e-agent-memory", from: "agent", to: "memory", kind: "sub" },
  { id: "e-agent-tools", from: "agent", to: "tools", kind: "sub" },
  { id: "e-agent-router", from: "agent", to: "router", kind: "flow" },
  { id: "e-router-crm", from: "router", to: "crm", kind: "flow" },
  { id: "e-router-reply", from: "router", to: "reply", kind: "flow" },
  { id: "e-router-email", from: "router", to: "email", kind: "flow" },
];

export const USE_CASES = {
  support: ["trigger", "agent", "model", "memory", "tools", "router", "reply"],
  leads: ["trigger", "agent", "model", "memory", "router", "crm", "email"],
  orders: ["trigger", "agent", "tools", "router", "crm", "reply", "email"],
  reports: ["agent", "model", "tools", "router", "email"],
} satisfies Record<string, NodeId[]>;

export type UseCaseKey = keyof typeof USE_CASES;

function useLayout(rtl: boolean) {
  return useMemo(() => {
    const nodes = NODES.map((n) => ({ ...n, x: rtl ? W - n.x - n.w : n.x }));
    const byId = Object.fromEntries(nodes.map((n) => [n.id, n])) as Record<
      NodeId,
      (typeof nodes)[number]
    >;
    const out = rtl ? -1 : 1; // which horizontal side is "output"

    const edges = EDGES.map((e) => {
      const a = byId[e.from];
      const b = byId[e.to];
      let d: string;
      if (e.kind === "sub") {
        // Agent bottom ports → sub-node tops (n8n-style dashed sub-connections).
        const order = ["model", "memory", "tools"].indexOf(e.to);
        const x1 = a.x + a.w / 2 + (order - 1) * 46 * (rtl ? -1 : 1);
        const y1 = a.y + a.h;
        const x2 = b.x + b.w / 2;
        const y2 = b.y;
        const dy = (y2 - y1) / 2;
        d = `M${x1} ${y1} C${x1} ${y1 + dy} ${x2} ${y2 - dy} ${x2} ${y2}`;
      } else {
        const x1 = out > 0 ? a.x + a.w : a.x;
        const y1 = a.y + a.h / 2;
        const x2 = out > 0 ? b.x : b.x + b.w;
        const y2 = b.y + b.h / 2;
        const dx = (x2 - x1) / 2;
        d = `M${x1} ${y1} C${x1 + dx} ${y1} ${x2 - dx} ${y2} ${x2} ${y2}`;
      }
      return { ...e, d, step: Math.max(a.step, b.step) };
    });
    return { nodes, edges, byId };
  }, [rtl]);
}

/* ------------------------------------------------------------------ component */

type Props = { highlight: NodeId[] | null; onHover: (ids: NodeId[] | null) => void };

/**
 * n8n-inspired workflow canvas (SVG + GSAP, no canvas libs).
 * Desktop: pinned, nodes and connections build step by step with scroll; once complete,
 * glowing data packets loop along the wires. Mobile: plays once on enter inside a
 * swipeable frame. Reduced motion: complete, static diagram. Mirrors in RTL.
 */
export function AiWorkflowCanvas({ highlight, onHover }: Props) {
  const t = useTranslations("home.aiNodes");
  const { isRTL } = useDirection();
  const reduced = usePrefersReducedMotion();
  const { nodes, edges } = useLayout(isRTL);
  const root = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<NodeId | null>(null);

  const active = highlight ? new Set(highlight) : null;
  const isOn = (id: NodeId) => !active || active.has(id);

  useGSAP(
    () => {
      if (reduced || !root.current) return;
      const q = gsap.utils.selector(root);
      const packets = gsap.timeline({ paused: true, repeat: -1 });
      // Packets ride each wire in flow order: trigger → agent ⇄ sub-nodes → router → outputs.
      edges.forEach((e) => {
        const path = root.current!.querySelector<SVGPathElement>(`[data-edge="${e.id}"]`);
        const dot = q(`[data-packet="${e.id}"]`)[0];
        if (!path || !dot) return;
        const at = { 0: 0, 1: 0.5, 2: 0.5, 3: 1.1, 4: 1.6 }[e.step] ?? 0;
        packets
          .fromTo(dot, { opacity: 0 }, { opacity: 1, duration: 0.12 }, at)
          .to(
            dot,
            {
              duration: e.kind === "sub" ? 0.5 : 0.7,
              ease: "power1.inOut",
              motionPath: { path, align: path, alignOrigin: [0.5, 0.5] },
            },
            at,
          )
          .to(dot, { opacity: 0, duration: 0.15 }, ">-0.1");
      });
      packets.to({}, { duration: 0.6 }); // breathing gap between cycles

      const build = (tl: gsap.core.Timeline) => {
        for (let step = 0; step <= 4; step++) {
          const stepEdges = edges.filter((e) => e.step === step);
          stepEdges.forEach((e) => {
            const path = root.current!.querySelector<SVGPathElement>(`[data-edge="${e.id}"]`)!;
            const len = path.getTotalLength();
            tl.fromTo(
              path,
              { strokeDasharray: len, strokeDashoffset: len },
              { strokeDashoffset: 0, duration: 0.6, ease: "power2.inOut" },
              step,
            );
          });
          tl.from(
            q(`[data-step="${step}"]`),
            {
              opacity: 0,
              scale: 0.85,
              transformOrigin: "50% 50%",
              duration: 0.5,
              ease: "back.out(1.7)",
              stagger: 0.08,
            },
            step + 0.35,
          );
        }
        // Sub-connections are dashed once drawn.
        tl.set(q('[data-kind="sub"]'), { strokeDasharray: "4 5", strokeDashoffset: 0 });
        return tl;
      };

      const mm = gsap.matchMedia();
      mm.add({ desktop: "(min-width: 1024px)", mobile: "(max-width: 1023px)" }, (ctx) => {
        if (ctx.conditions?.desktop) {
          const tl = build(gsap.timeline({ defaults: { ease: "expo.out" } }));
          ScrollTrigger.create({
            trigger: root.current,
            start: "center center",
            end: "+=1100",
            pin: true,
            scrub: 0.6,
            animation: tl,
            onUpdate: (self) => (self.progress > 0.97 ? packets.play() : packets.pause()),
          });
        } else {
          const tl = build(gsap.timeline({ paused: true }));
          tl.timeScale(1.6).eventCallback("onComplete", () => packets.play());
          ScrollTrigger.create({
            trigger: root.current,
            start: "top 75%",
            once: true,
            onEnter: () => tl.play(),
          });
        }
      });
      // Only burn cycles while the canvas is on screen.
      ScrollTrigger.create({
        trigger: root.current,
        start: "top bottom",
        end: "bottom top",
        onLeave: () => packets.pause(),
        onLeaveBack: () => packets.pause(),
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [reduced, isRTL], revertOnUpdate: true },
  );

  const tipNode = tip ? nodes.find((n) => n.id === tip) : null;

  return (
    <div ref={root} className="relative">
      <div
        className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:overflow-visible lg:px-0"
        data-lenis-prevent
      >
        <div className="relative min-w-[760px] lg:min-w-0">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="block h-auto w-full overflow-visible"
            role="group"
            aria-label="n8n AI agent workflow"
          >
            {/* wires */}
            {edges.map((e) => {
              const on = isOn(e.from) && isOn(e.to);
              return (
                <g
                  key={e.id}
                  className={cn(
                    "transition-opacity duration-300",
                    on ? "opacity-100" : "opacity-15",
                  )}
                >
                  <path
                    d={e.d}
                    fill="none"
                    stroke="var(--color-indigo-700)"
                    strokeWidth={e.kind === "sub" ? 1.5 : 2.5}
                  />
                  <path
                    data-edge={e.id}
                    data-kind={e.kind}
                    d={e.d}
                    fill="none"
                    stroke={e.kind === "sub" ? "var(--color-blue-300)" : "var(--color-blue-400)"}
                    strokeWidth={e.kind === "sub" ? 1.5 : 2.5}
                    strokeDasharray={e.kind === "sub" ? "4 5" : undefined}
                    className="drop-shadow-[0_0_6px_var(--color-blue-400)]"
                  />
                  <rect
                    data-packet={e.id}
                    width={9}
                    height={9}
                    x={-4.5}
                    y={-4.5}
                    opacity={0}
                    fill={
                      e.id === "e-router-reply" ? "var(--color-yellow-500)" : "var(--color-white)"
                    }
                    className="drop-shadow-[0_0_8px_var(--color-blue-400)]"
                  />
                </g>
              );
            })}

            {/* nodes */}
            {nodes.map((n) => {
              const Icon = n.icon;
              const on = isOn(n.id);
              const big = n.id === "agent";
              const iconSize = n.kind === "sub" ? 30 : big ? 44 : 38;
              const pad = n.kind === "sub" ? 12 : 14;
              const iconX = isRTL ? n.x + n.w - pad - iconSize : n.x + pad;
              const textX = isRTL ? iconX - 12 : iconX + iconSize + 12;
              return (
                <g
                  key={n.id}
                  data-step={n.step}
                  tabIndex={0}
                  role="img"
                  aria-label={`${t(`${n.id}.label`)} — ${t(`${n.id}.desc`)}`}
                  onMouseEnter={() => {
                    setTip(n.id);
                    onHover([n.id]);
                  }}
                  onMouseLeave={() => {
                    setTip(null);
                    onHover(null);
                  }}
                  onFocus={() => {
                    setTip(n.id);
                    onHover([n.id]);
                  }}
                  onBlur={() => {
                    setTip(null);
                    onHover(null);
                  }}
                  className={cn(
                    "cursor-pointer transition-opacity duration-300 outline-none [&:focus-visible>rect:first-of-type]:stroke-yellow-500",
                    on ? "opacity-100" : "opacity-30",
                  )}
                >
                  <rect
                    x={n.x}
                    y={n.y}
                    width={n.w}
                    height={n.h}
                    rx={n.kind === "sub" ? n.h / 2 : 10}
                    fill="color-mix(in oklab, var(--color-indigo-700) 30%, var(--color-navy-950))"
                    stroke={
                      big || tip === n.id ? "var(--color-blue-400)" : "var(--color-indigo-700)"
                    }
                    strokeWidth={big ? 2 : 1.5}
                    className="transition-[stroke] duration-200"
                  />
                  <rect
                    x={iconX}
                    y={n.y + (n.h - iconSize) / 2}
                    width={iconSize}
                    height={iconSize}
                    rx={n.kind === "sub" ? iconSize / 2 : 6}
                    fill={big ? "var(--color-blue-600)" : "var(--color-navy-950)"}
                  />
                  <Icon
                    x={iconX + iconSize * 0.22}
                    y={n.y + (n.h - iconSize) / 2 + iconSize * 0.22}
                    width={iconSize * 0.56}
                    height={iconSize * 0.56}
                    color="var(--color-white)"
                    fill={Icon === WhatsAppIcon ? "var(--color-white)" : "none"}
                  />
                  <text
                    x={textX}
                    y={n.y + n.h / 2 + 5}
                    // `start` follows the inherited direction: left edge in LTR, right edge in RTL.
                    textAnchor="start"
                    fill="var(--color-white)"
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: n.kind === "sub" ? 13 : big ? 17 : 15,
                      fontWeight: 500,
                    }}
                  >
                    {t(`${n.id}.label`)}
                  </text>
                  {big && (
                    <text
                      x={textX}
                      y={n.y + n.h / 2 + 24}
                      direction="ltr"
                      textAnchor={isRTL ? "end" : "start"}
                      fill="var(--color-blue-300)"
                      style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}
                    >
                      {"{ tools: 3 }"}
                    </text>
                  )}
                  {/* ports — little blocks */}
                  {n.kind === "main" && n.id !== "trigger" && (
                    <rect
                      x={(isRTL ? n.x + n.w : n.x) - 4}
                      y={n.y + n.h / 2 - 4}
                      width={8}
                      height={8}
                      fill="var(--color-blue-400)"
                    />
                  )}
                  {n.kind === "main" && !["crm", "reply", "email"].includes(n.id) && (
                    <rect
                      x={(isRTL ? n.x : n.x + n.w) - 4}
                      y={n.y + n.h / 2 - 4}
                      width={8}
                      height={8}
                      fill="var(--color-blue-400)"
                    />
                  )}
                </g>
              );
            })}
          </svg>

          {/* Tooltip (HTML for crisp text + RTL) */}
          {tipNode && (
            <div
              role="tooltip"
              className="pointer-events-none absolute z-10 w-56 -translate-x-1/2 -translate-y-full border border-blue-400/40 bg-navy-950/95 px-3 py-2 text-sm text-indigo-200 shadow-[0_12px_40px_-12px_var(--color-blue-600)] backdrop-blur"
              // Physical left: SVG coordinates are physical in both directions.
              style={{
                left: `${((tipNode.x + tipNode.w / 2) / W) * 100}%`,
                top: `calc(${(tipNode.y / H) * 100}% - 10px)`,
              }}
            >
              <p className="font-medium text-white">{t(`${tipNode.id}.label`)}</p>
              <p className="mt-0.5 leading-snug">{t(`${tipNode.id}.desc`)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
