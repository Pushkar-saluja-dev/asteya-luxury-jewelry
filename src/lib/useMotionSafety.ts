import { useEffect, useState } from "react";

/**
 * Custom hook that detects:
 *   1. Whether the user has `prefers-reduced-motion: reduce` enabled.
 *   2. Whether the engine exposes a working IntersectionObserver.
 *   3. Whether the current runtime looks like a low-power mobile Safari
 *      (iPhone / iPad / iPod — handled conservatively).
 *
 * When ANY of these fire, we return `true` for `safetyMode`. Story-
 * orchestrating components pass that flag to `motion.*` props to
 * short-circuit `initial={{ opacity: 0 }}` patterns — guaranteeing
 * content cannot get stuck invisible on iOS Safari.
 *
 * Usage:
 *   const safetyMode = useMotionSafety();
 *   <motion.div
 *     initial={safetyMode ? false : { opacity: 0, y: 20 }}
 *     animate={{ opacity: 1, y: 0 }}
 *     transition={{ duration: 0.6 }}
 *   />
 */
export function useMotionSafety(): boolean {
  const [safetyMode, setSafetyMode] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    const update = () => {
      const ua = navigator.userAgent || "";
      // iPhone / iPad / iPod — touch-only WebKit renders animations more
      // conservatively and can skip IntersectionObserver updates inside
      // pull-to-refresh / overscroll banners.
      const isTouchSafari = /iPhone|iPad|iPod/i.test(ua);

      const hasIntersectionObserver =
        typeof IntersectionObserver !== "undefined";

      setSafetyMode(
        reducedMotionQuery.matches || !hasIntersectionObserver || isTouchSafari
      );
    };

    update();

    if (reducedMotionQuery.addEventListener) {
      reducedMotionQuery.addEventListener("change", update);
      return () =>
        reducedMotionQuery.removeEventListener("change", update);
    }
    // Safari < 14 path
    reducedMotionQuery.addListener(update);
    return () => reducedMotionQuery.removeListener(update);
  }, []);

  return safetyMode;
}

/**
 * Lightweight detection helper for components that don't want hook
 * dependency cost. Returns true at render time before mount (SSR-safe
 * default — starts false), then re-resolves on the client.
 */
export function isTouchOnlySafari(): boolean {
  if (typeof navigator === "undefined") return false;
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent || "";
  return (
    /iPhone|iPad|iPod/i.test(ua) &&
    Boolean(window.matchMedia?.("(hover: none)").matches)
  );
}
