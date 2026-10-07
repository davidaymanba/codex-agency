"use client";

import { useEffect, useRef } from "react";
import { useFinePointer, usePrefersReducedMotion } from "@/hooks/use-media";

/**
 * Interactive block grid behind the hero. Cells near the cursor light up in blue and
 * fade out; on touch devices a few cells twinkle ambiently instead. Canvas 2D, DPR-aware,
 * and the RAF loop sleeps whenever nothing is lit. Static under reduced motion.
 * Colors are read from CSS tokens (`--primary`, `--glow`) so both themes stay in palette.
 */
export function HeroGrid({ cell = 64 }: { cell?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fine = useFinePointer();
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || reduced) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = fine ? cell : Math.round(cell * 0.75);
    let cols = 0;
    let rows = 0;
    let heat = new Float32Array(0);
    let raf = 0;
    let running = false;
    let colors = { low: "", high: "" };

    const readColors = () => {
      const s = getComputedStyle(document.documentElement);
      colors = {
        low: s.getPropertyValue("--primary").trim(),
        high: s.getPropertyValue("--glow").trim(),
      };
    };

    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(width / size);
      rows = Math.ceil(height / size);
      heat = new Float32Array(cols * rows);
    };

    const draw = () => {
      const { width, height } = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, width, height);
      let alive = false;
      for (let i = 0; i < heat.length; i++) {
        const h = heat[i];
        if (h < 0.01) {
          heat[i] = 0;
          continue;
        }
        alive = true;
        const x = (i % cols) * size;
        const y = Math.floor(i / cols) * size;
        ctx.globalAlpha = h * (h > 0.6 ? 0.55 : 0.4);
        ctx.fillStyle = h > 0.6 ? colors.high : colors.low;
        ctx.fillRect(x + 1, y + 1, size - 1, size - 1);
        heat[i] = h * 0.93;
      }
      ctx.globalAlpha = 1;
      if (alive) raf = requestAnimationFrame(draw);
      else running = false;
    };

    const wake = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(draw);
    };

    const light = (cx: number, cy: number, radius: number, strength = 1) => {
      const c0 = Math.floor(cx / size);
      const r0 = Math.floor(cy / size);
      const span = Math.ceil(radius);
      for (let r = r0 - span; r <= r0 + span; r++) {
        for (let c = c0 - span; c <= c0 + span; c++) {
          if (r < 0 || c < 0 || r >= rows || c >= cols) continue;
          const d = Math.hypot(c - c0, r - r0);
          if (d > radius) continue;
          const i = r * cols + c;
          heat[i] = Math.max(heat[i], strength * (1 - d / (radius + 0.5)));
        }
      }
      wake();
    };

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;
      light(x, y, 1.6);
    };

    readColors();
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const mo = new MutationObserver(readColors);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    let twinkle: ReturnType<typeof setInterval> | undefined;
    if (fine) {
      window.addEventListener("pointermove", onMove, { passive: true });
    } else {
      twinkle = setInterval(() => {
        if (document.hidden) return;
        light(Math.random() * cols * size, Math.random() * rows * size, 0.6, 0.9);
      }, 700);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      mo.disconnect();
      clearInterval(twinkle);
      window.removeEventListener("pointermove", onMove);
    };
  }, [cell, fine, reduced]);

  return (
    <div
      aria-hidden
      className="absolute inset-0 -z-20"
      style={{ ["--grid-size" as string]: `${fine ? cell : Math.round(cell * 0.75)}px` }}
    >
      <div className="absolute inset-0 bg-grid [background-position:0_0]" />
      <canvas ref={canvasRef} className="absolute inset-0 size-full" />
    </div>
  );
}
