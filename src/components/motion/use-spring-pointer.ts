"use client";

import { useEffect, useRef } from "react";

/**
 * Tiny rAF spring for pointer-driven effects (magnetic, tilt) — no animation library.
 * Call `setTarget(x, y)`; `apply(x, y)` runs each frame until the value settles.
 */
export function useSpringPointer(apply: (x: number, y: number) => void, stiffness = 0.18) {
  const cur = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  const raf = useRef(0);
  const applyRef = useRef(apply);
  useEffect(() => {
    applyRef.current = apply;
  }, [apply]);

  const tick = () => {
    const c = cur.current;
    const t = target.current;
    c.x += (t.x - c.x) * stiffness;
    c.y += (t.y - c.y) * stiffness;
    const done = Math.abs(t.x - c.x) < 0.05 && Math.abs(t.y - c.y) < 0.05;
    if (done) {
      c.x = t.x;
      c.y = t.y;
    }
    applyRef.current(c.x, c.y);
    raf.current = done ? 0 : requestAnimationFrame(tick);
  };

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  return (x: number, y: number) => {
    target.current = { x, y };
    if (!raf.current) raf.current = requestAnimationFrame(tick);
  };
}
