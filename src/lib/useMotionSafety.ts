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
  // iOS-SAFARI FIRST-PAINT FIX:
  //
  // The previous version started `safetyMode = false` and flipped it on in a
  // `useEffect` after the first paint. Every motion sub-tree that gates its
  // `initial` prop on `safetyMode` (e.g. `initial={safetyMode ? false : { opacity: 0, y: 40 }}`)
  // therefore rendered the FIRST FRAME with `initial = { opacity: 0, y: 40 }`.
  // iOS Safari routinely pauses/throttles scripts during initial load — a
  // `motion.h1` that should fade to opacity:1 over 1.6s sometimes never
  // reaches opacity:1 before being frozen, leaving the brand headline, the
  // hero buttons, every `<motion.* withInView>` and every gallery card
  // invisible. The subsequent `useEffect` flipping `safetyMode` to `true`
  // re-rendered with `initial = false`, but framer-motion's behaviour when
  // `initial` mutates mid-flight is implementation-defined and in the v12
  // series it pins the already-committed opacity-0 frame in place. Hence:
  // Header renders (no initial-opacity elements); Hero content, Gallery
  // Atelier, AI Try-On promo, Footer motion descendants all stay invisible.
  //
  // The audit-defensive `<motion.div initial={safetyMode ? false : { opacity: 0}}>`
  // pattern only works when the iOS branch is the value seen on FIRST PAINT,
  // not the second render. Initialise `safetyMode` from a synchronous probe
  // of UA + IntersectionObserver + reduced-motion so iOS users no longer
  // commit an `opacity:0` frame at all.
  const [safetyMode, setSafetyMode] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const ua = navigator.userAgent || "";

    // iPhone / iPad / iPod — touch-only WebKit is the documented source of
    //                              the page-shell-but-empty-content symptom.
    if (/iPhone|iPad|iPod/i.test(ua)) return true;

    // No IO at all — fall back to safety even on second render.
    if (typeof IntersectionObserver === "undefined") return true;

    // Reduced-motion is a user-stated preference. Honour immediately, not on
    // the next paint.
    if (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return true;
    }
    return false;
  });

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

      // We re-probe IntersectionObserver too — some embedded WebViews only
      // expose it after the first user interaction. If it appeared AFTER
      // mount, we can leave safetyMode at true without harm (every gate
      // treats both values the same on subsequent re-renders).
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
