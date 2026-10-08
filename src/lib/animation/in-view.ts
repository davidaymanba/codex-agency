"use client";

/**
 * Viewport watcher for lazily created animations. IntersectionObserver never forces a
 * layout, unlike creating many GSAP tweens / ScrollTriggers at mount (each one reads
 * computed styles between writes → hundreds of ms of style/layout thrash on phones).
 *
 * `rootMargin` uses ScrollTrigger-like insets: "0px 0px -15% 0px" ≈ start "top 85%".
 * Returns a cleanup function.
 */
export function onInView(
  el: Element,
  cb: (entry: IntersectionObserverEntry) => void,
  rootMargin = "0px",
): () => void {
  const io = new IntersectionObserver(([entry]) => cb(entry), { rootMargin });
  io.observe(el);
  return () => io.disconnect();
}

