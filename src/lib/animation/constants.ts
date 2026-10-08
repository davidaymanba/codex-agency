/** Shared motion language. Reveals 0.6–1.2s, hovers 0.2–0.3s. */
export const EASE = {
  out: "expo.out",
  strong: "power4.out",
  inOut: "expo.inOut",
  // CSS / Motion equivalents
  outBezier: [0.16, 1, 0.3, 1] as const,
  strongBezier: [0.165, 0.84, 0.44, 1] as const,
};

export const DURATION = {
  hover: 0.25,
  fast: 0.6,
  reveal: 1,
  slow: 1.2,
};

export const STAGGER = {
  chars: 0.02,
  words: 0.05,
  lines: 0.1,
  items: 0.08,
};

/** Default ScrollTrigger start for entrance animations. */
export const REVEAL_START = "top 85%";
/**
 * Same line as REVEAL_START, as an IntersectionObserver rootMargin (see `onInView`).
 * The top is extended far up so "reached" also covers blocks already scrolled past:
 * a jump (anchor link, scroll restore) that skips over a block still reveals it.
 */
export const REVEAL_MARGIN = "100000px 0px -15% 0px";
