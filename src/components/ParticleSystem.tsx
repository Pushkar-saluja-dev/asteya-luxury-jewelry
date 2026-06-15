import { useEffect, useRef, useCallback, useState } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  type: "sparkle" | "dust" | "orb";
  color: string;
}

interface ParticleSystemProps {
  particleCount?: number;
  particleType?: "sparkle" | "dust" | "orb" | "mixed";
  speed?: "slow" | "normal" | "fast";
  direction?: "up" | "down" | "random" | "swirl";
  colorScheme?: "gold" | "plum" | "mixed";
  className?: string;
  interactive?: boolean;
}

export default function ParticleSystem({
  particleCount = 50,
  particleType = "mixed",
  speed = "normal",
  direction = "random",
  colorScheme = "mixed",
  className = "",
  interactive = true,
}: ParticleSystemProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, isActive: false });
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number | undefined>(undefined);

  // iOS Safari + respect user's accessibility wish: bail on motion
  const [reducedMotion, setReducedMotion] = useState(false);

  const getSpeedMultiplier = useCallback(() => {
    switch (speed) {
      case "slow": return 0.5;
      case "normal": return 1;
      case "fast": return 1.5;
    }
  }, [speed]);

  const getParticleColor = useCallback((type: "sparkle" | "dust" | "orb"): string => {
    const goldColors = ["#c5a059", "#e2c992", "#f5efd9", "#907137"];
    const plumColors = ["#49173d", "#5f1f50", "#3a1130"];

    if (colorScheme === "gold") return goldColors[Math.floor(Math.random() * goldColors.length)];
    if (colorScheme === "plum") return plumColors[Math.floor(Math.random() * plumColors.length)];

    const allColors = [...goldColors, ...plumColors];
    return allColors[Math.floor(Math.random() * allColors.length)];
  }, [colorScheme]);

  const createParticle = useCallback((canvasWidth: number, canvasHeight: number): Particle => {
    const typeRoll = Math.random();
    let type: "sparkle" | "dust" | "orb";

    if (particleType === "mixed") {
      if (typeRoll < 0.2) type = "sparkle";
      else if (typeRoll < 0.7) type = "dust";
      else type = "orb";
    } else {
      type = particleType as "sparkle" | "dust" | "orb";
    }

    const baseSpeed = getSpeedMultiplier();
    let speedX = (Math.random() - 0.5) * 0.5 * baseSpeed;
    let speedY = (Math.random() - 0.5) * 0.5 * baseSpeed;

    if (direction === "up") {
      speedY = -Math.random() * 0.8 * baseSpeed;
    } else if (direction === "down") {
      speedY = Math.random() * 0.8 * baseSpeed;
    } else if (direction === "swirl") {
      const angle = Math.random() * Math.PI * 2;
      speedX = Math.cos(angle) * 0.3 * baseSpeed;
      speedY = Math.sin(angle) * 0.3 * baseSpeed;
    }

    return {
      id: Math.random(),
      x: Math.random() * canvasWidth,
      y: Math.random() * canvasHeight,
      size: type === "sparkle" ? Math.random() * 2 + 1 : type === "orb" ? Math.random() * 4 + 2 : Math.random() * 1.5 + 0.5,
      speedX,
      speedY,
      opacity: Math.random() * 0.5 + 0.3,
      type,
      color: getParticleColor(type),
    };
  }, [particleType, direction, getSpeedMultiplier, getParticleColor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // iOS-safe prefers-reduced-motion subscription
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateReducedMotion = () => setReducedMotion(reducedMotionQuery.matches);
    updateReducedMotion();
    if (reducedMotionQuery.addEventListener) {
      reducedMotionQuery.addEventListener("change", updateReducedMotion);
    } else {
      reducedMotionQuery.addListener(updateReducedMotion);
    }

    // iOS Safari shrinks the canvas when fixed canvas is not pulsing,
    // so we size with 100dvh where supported. innerWidth/Height is
    // fine for resize handler but we set CSS height to viewport.
    const sizingVar = typeof window !== "undefined" && "visualViewport" in window ? window.innerHeight : window.innerHeight;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // iOS detection – throttle particle count to keep device fluid.
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent || "");
    const effectiveCount = isIOS ? Math.max(8, Math.min(particleCount, 20)) : particleCount;

    particlesRef.current = Array.from({ length: effectiveCount }, () =>
      createParticle(canvas.width, canvas.height)
    );

    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        isActive: true,
      };
      setTimeout(() => { mouseRef.current.isActive = false; }, 100);
    };
    canvas.addEventListener("mousemove", handleMouseMove);

    let pageVisible = document.visibilityState === "visible";
    const handleVisibilityChange = () => {
      pageVisible = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Skip drawing entirely while canvas is off-screen (saves CPU/GPU
    // on long pages where Hero/atelier is below the fold).
    let inView = true;
    let io: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver(
        ([entry]) => { inView = entry.isIntersecting; },
        { threshold: 0 }
      );
      io.observe(canvas);
    }

    let stopped = false;

    const animate = () => {
      if (stopped || reducedMotion || !pageVisible || !inView) {
        // Even if we skip the rAF, we still tick once more after
        // conditions change so we don't leak timers.
        return;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((particle) => {
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        if (interactive && mouseRef.current.isActive) {
          const dx = particle.x - mouseRef.current.x;
          const dy = particle.y - mouseRef.current.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const maxDistance = 150;

          if (distance < maxDistance) {
            const force = (maxDistance - distance) / maxDistance;
            particle.x += (dx / distance) * force * 3;
            particle.y += (dy / distance) * force * 3;
          }
        }

        if (particle.x < -50) particle.x = canvas.width + 50;
        if (particle.x > canvas.width + 50) particle.x = -50;
        if (particle.y < -50) particle.y = canvas.height + 50;
        if (particle.y > canvas.height + 50) particle.y = -50;

        ctx.beginPath();

        if (particle.type === "sparkle") {
          const sparkleSize = particle.size * 1.5;
          ctx.moveTo(particle.x, particle.y - sparkleSize);
          ctx.lineTo(particle.x + sparkleSize * 0.7, particle.y);
          ctx.lineTo(particle.x, particle.y + sparkleSize);
          ctx.lineTo(particle.x - sparkleSize * 0.7, particle.y);
          ctx.closePath();
          ctx.fillStyle = particle.color;
          ctx.globalAlpha = particle.opacity;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size * 0.3, 0, Math.PI * 2);
          ctx.fillStyle = "#ffffff";
          ctx.globalAlpha = particle.opacity * 0.8;
          ctx.fill();
        } else if (particle.type === "orb") {
          const gradient = ctx.createRadialGradient(
            particle.x, particle.y, 0,
            particle.x, particle.y, particle.size * 3
          );
          gradient.addColorStop(0, particle.color + Math.floor(particle.opacity * 255).toString(16).padStart(2, "0"));
          gradient.addColorStop(0.5, particle.color + "40");
          gradient.addColorStop(1, "transparent");
          ctx.fillStyle = gradient;
          ctx.globalAlpha = 1;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size * 3, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = particle.color;
          ctx.globalAlpha = particle.opacity;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.globalAlpha = 1;
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Seed one frame even if reduced-motion is on, so canvas is
    // not blank if anything reads from it before motion resumes.
    animate();

    // Re-arm the loop whenever any of the gate conditions flip, so
    // we don't leak timers when the page backgrounds or scrolls offscreen.
    let wakeupFrame: number | undefined;
    const tryWake = () => {
      if (
        !stopped &&
        animationFrameRef.current === undefined &&
        !reducedMotion &&
        pageVisible &&
        inView
      ) {
        wakeupFrame = requestAnimationFrame(() => {
          wakeupFrame = undefined;
          animate();
        });
      }
    };
    document.addEventListener("visibilitychange", tryWake);
    if (io) io.observe(canvas);
    if (reducedMotionQuery.addEventListener) {
      reducedMotionQuery.addEventListener("change", tryWake);
    } else {
      reducedMotionQuery.addListener(tryWake);
    }

    return () => {
      stopped = true;
      if (wakeupFrame !== undefined) cancelAnimationFrame(wakeupFrame);
      if (animationFrameRef.current !== undefined) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (io) io.disconnect();
      window.removeEventListener("resize", resizeCanvas);
      canvas.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("visibilitychange", tryWake);
      if (reducedMotionQuery.removeEventListener) {
        reducedMotionQuery.removeEventListener("change", updateReducedMotion);
        reducedMotionQuery.removeEventListener("change", tryWake);
      } else {
        reducedMotionQuery.removeListener(updateReducedMotion);
        reducedMotionQuery.removeListener(tryWake);
      }
    };
  }, [particleCount, particleType, speed, direction, colorScheme, interactive, createParticle]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`fixed inset-0 pointer-events-none z-0 ${className}`}
      style={{
        width: "100%",
        // dvh where supported, vh fallback for older WebViews.
        height: typeof window !== "undefined" && "visualViewport" in window ? "100dvh" : "100vh",
      }}
    />
  );
}