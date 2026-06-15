import { useEffect, useRef, useState } from "react";

interface UseScrollRevealOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  /**
   * Hard upper bound (ms) before we force-reveal even if
   * IntersectionObserver never fires (Safari pull-to-refresh,
   * iframe embedding, very old WebView). Must be > 0 to guarantee
   * opacity never stays at 0.
   */
  fallbackDelayMs?: number;
}

export function useScrollReveal({
  threshold = 0.1,
  rootMargin = "-50px",
  triggerOnce = true,
  fallbackDelayMs = 1500
}: UseScrollRevealOptions = {}) {
  const ref = useRef<HTMLElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const hasIO = typeof IntersectionObserver !== "undefined";

    // iOS Safari can drop IntersectionObserver callbacks inside
    // pull-to-refresh / overscroll regions, and some embedded
    // WebViews ship without it entirely. We MUST eventually reveal
    // — opacity must not stay at 0 forever.
    const safetyTimer = window.setTimeout(() => {
      setIsRevealed(true);
    }, fallbackDelayMs);

    if (!hasIO) {
      setIsRevealed(true);
      return () => window.clearTimeout(safetyTimer);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsRevealed(true);
          window.clearTimeout(safetyTimer);
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsRevealed(false);
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    observer.observe(element);
    return () => {
      window.clearTimeout(safetyTimer);
      observer.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce, fallbackDelayMs]);

  return { ref, isRevealed };
}

export function useParallax(speed: number = 0.5) {
  const ref = useRef<HTMLElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        const scrollPosition = window.scrollY;
        const elementTop = rect.top + scrollPosition;
        const elementVisible = elementTop < scrollPosition + window.innerHeight;

        if (elementVisible) {
          setOffset((scrollPosition - elementTop) * speed);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [speed]);

  return { ref, offset };
}