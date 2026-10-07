"use client";

/**
 * Tiny signal between the preloader and intro animations (e.g. the hero).
 * `html.preload` is set by the head script on the first visit of a session.
 */
let done = false;
const listeners = new Set<() => void>();

export const PRELOAD_KEY = "codex-preloaded";

export function markPreloaded() {
  if (done) return;
  done = true;
  listeners.forEach((cb) => cb());
  listeners.clear();
}

/** Runs `cb` once the preloader has started revealing the page (immediately if none). */
export function onPreloaded(cb: () => void) {
  if (done || !document.documentElement.classList.contains("preload")) {
    cb();
    return () => {};
  }
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
