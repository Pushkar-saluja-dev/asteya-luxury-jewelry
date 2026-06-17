import { ArrowDown, Sparkles, Award, Diamond } from "lucide-react";
import { motion, useScroll, useTransform, useSpring } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useMotionSafety } from "../lib/useMotionSafety";
import { useMountLog } from "../lib/useMountLog";

interface HeroProps {
  onExplore: () => void;
}

export default function Hero({ onExplore }: HeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const safetyMode = useMotionSafety();
  
  useEffect(() => {
    console.log("Hero mounted");
  }, []);

  const { scrollY } = useScroll();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [viewport, setViewport] = useState<{ width: number; height: number }>({
    width: typeof window === "undefined" ? 1024 : window.innerWidth,
    height: typeof window === "undefined" ? 768 : window.innerHeight,
  });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(
        window.innerWidth < 768 ||
        /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      );
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Standard range-based transforms (safest and completely immune to NaN initial states)
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const y2 = useTransform(scrollY, [0, 500], [0, 150]);
  const y3 = useTransform(scrollY, [0, 500], [0, 100]);
  const opacityHero = useTransform(scrollY, [0, 400], [1, 0]);
  const opacityBg = useTransform(scrollY, [0, 400], [0.15, 0]);
  const scaleHero = useTransform(scrollY, [0, 400], [1, 0.95]);

  // Smooth mouse follow for spotlight effect
  const mouseX = useSpring(mousePosition.x, { stiffness: 100, damping: 30 });
  const mouseY = useSpring(mousePosition.y, { stiffness: 100, damping: 30 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Floating particles for hero
  const floatingParticles = [
    { size: "w-1 h-1", delay: 0, duration: 3, left: "15%", top: "20%" },
    { size: "w-1.5 h-1.5", delay: 0.5, duration: 4, left: "75%", top: "30%" },
    { size: "w-1 h-1", delay: 1, duration: 3.5, left: "25%", top: "60%" },
    { size: "w-2 h-2", delay: 1.5, duration: 5, left: "85%", top: "70%" },
    { size: "w-1 h-1", delay: 0.3, duration: 4, left: "45%", top: "40%" },
    { size: "w-1.5 h-1.5", delay: 0.8, duration: 3, left: "60%", top: "80%" },
  ];

  return (
    <div
      ref={containerRef}
      className="relative min-h-[100dvh] bg-plum-950 overflow-hidden flex flex-col justify-start items-center px-6 pt-44 sm:pt-48 md:pt-56 lg:pt-60 luxury-texture bg-radial-luxury"
    >
      {/* Animated background radial glows */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <motion.div
          style={{ y: (isMobile || safetyMode) ? 0 : y1, x: mouseX }}
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] max-w-[800px] h-max-[800px] bg-plum-700/20 rounded-full blur-[160px]"
        />
        <motion.div
          style={{ y: (isMobile || safetyMode) ? 0 : y2 }}
          className="absolute bottom-1/4 right-1/4 w-[40vw] h-[40vw] bg-gold-classic/8 rounded-full blur-[140px] animate-pulse"
        />
        <motion.div
          style={{ y: (isMobile || safetyMode) ? 0 : y3, x: mouseY }}
          className="absolute top-1/3 right-1/3 w-[30vw] h-[30vw] bg-rose-gold/5 rounded-full blur-[120px]"
        />

        {/* Floating sparkle particles */}
        {floatingParticles.map((p, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.5, 1],
              y: [0, -30, 0]
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className={`absolute ${p.size} bg-gold-classic rounded-full blur-[1px]`}
            style={{ left: p.left, top: p.top }}
          />
        ))}
      </div>

      {/* Cinematic background image with parallax */}
      <motion.div
        style={{ y: (isMobile || safetyMode) ? 0 : y1, opacity: (isMobile || safetyMode) ? 0.15 : opacityBg }}
        className="absolute inset-0 z-0 opacity-15 pointer-events-none mix-blend-lighten"
        role="presentation"
        aria-hidden="true"
      >
        <img
          src="https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=1920"
          alt=""
          className="w-full h-full object-cover object-center scale-110 filter grayscale contrast-125"
          referrerPolicy="no-referrer"
        />
      </motion.div>

      {/* Dark overlay for contrast and text readability */}
      <div className="absolute inset-0 bg-[#0b030b]/65 z-0 pointer-events-none" />

      {/* Mouse-following spotlight gradient - very subtle, behind content */}
      <motion.div
        style={{
          x: mouseX,
          y: mouseY,
          background: `radial-gradient(400px circle at ${mousePosition.x + viewport.width / 2}px ${mousePosition.y + viewport.height / 2}px, rgba(197, 160, 89, 0.03), transparent 60%)`
        }}
        className="absolute inset-0 z-0 pointer-events-none"
      />

      {/* High-fashion Content Grid */}
      <motion.div
        style={{ opacity: (isMobile || safetyMode) ? 1 : opacityHero, scale: (isMobile || safetyMode) ? 1 : scaleHero }}
        className="relative z-10 text-center max-w-4xl mx-auto flex flex-col items-center"
      >
        {/* Couture Tagline with animated lines */}
        <motion.div
          initial={safetyMode || isMobile ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="flex items-center gap-3 mb-8"
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "2rem" }}
            transition={{ duration: 1, delay: 0.3 }}
            className="h-[1px] bg-gradient-to-r from-transparent to-gold-classic/60"
          />
          <motion.div
            animate={{ rotate: [0, 180, 360], scale: [1, 1.3, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles className="w-4 h-4 text-gold-classic" />
          </motion.div>
          <span className="text-[11px] tracking-[0.5em] text-gold-pale uppercase font-outfit font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
            AI-ENHANCED DIGITAL ATELIER
          </span>
          <motion.div
            animate={{ rotate: [0, -180, -360], scale: [1, 1.3, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
          >
            <Diamond className="w-4 h-4 text-gold-classic" />
          </motion.div>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "2rem" }}
            transition={{ duration: 1, delay: 0.3 }}
            className="h-[1px] bg-gradient-to-l from-transparent to-gold-classic/60"
          />
        </motion.div>

        {/* Brand Headline - Dual Core Pairing */}
        <motion.h1
          initial={safetyMode || isMobile ? false : { opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.6, delay: 0.3, ease: "easeOut" }}
          style={{ textShadow: '0 4px 16px rgba(0,0,0,0.85)' }}
          className="font-cinzel text-5xl sm:text-7xl md:text-8xl lg:text-9xl tracking-[0.1em] uppercase text-[#f7f3f7] leading-tight mb-6"
        >
          Premium Artisan
          <span className="block italic text-liquid-gold font-cormorant font-normal lowercase tracking-wide mt-3">
            jewellery
          </span>
        </motion.h1>

        {/* Narrative editorial statement with shimmer */}
        <motion.p
          initial={safetyMode || isMobile ? false : { opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.6, delay: 0.6, ease: "easeOut" }}
          className="font-cormorant text-xl sm:text-3xl font-medium text-gold-pale/90 italic max-w-2xl px-4 leading-relaxed tracking-wide mb-16 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
        >
          "Crafting absolute geometry and raw cosmic light into custom styling relics."
          <span className="text-gold-classic not-italic font-outfit text-sm sm:text-base block mt-4 tracking-[0.2em] uppercase drop-shadow-[0_2px_5px_rgba(0,0,0,0.9)]">
            An interface of exquisite design, computer vision, and Parisian master craftsmanship.
          </span>
        </motion.p>

        {/* Action Buttons with enhanced styling */}
        <motion.div
          initial={safetyMode || isMobile ? false : { opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.9 }}
          className="flex flex-col sm:flex-row gap-6 items-center justify-center w-full max-w-lg px-4"
        >
          {/* Explore Catalog - Primary CTA */}
          <motion.button
            onClick={onExplore}
            whileHover={{ scale: 1.05, boxShadow: "0 12px 40px rgba(197, 160, 89, 0.4)" }}
            whileTap={{ scale: 0.98 }}
            className="group relative px-10 py-4 bg-gold-gradient text-plum-950 font-outfit text-xs tracking-[0.35em] uppercase font-bold rounded-sm cursor-pointer overflow-hidden"
          >
            <span className="relative z-10">Explore Ateliers</span>
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full"
              whileHover={{ x: "200%" }}
              transition={{ duration: 0.6 }}
            />
          </motion.button>

          {/* Luxury Brand Badge */}
          <motion.div
            initial={safetyMode || isMobile ? false : { opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.2 }}
            className="flex items-center gap-3 text-gold-pale/80 text-[10px] font-outfit tracking-widest uppercase"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              <Award className="w-5 h-5 text-gold-classic" />
            </motion.div>
            <span>Atelier Quality Certified</span>
          </motion.div>
        </motion.div>

        {/* Decorative divider */}
        <motion.div
          initial={safetyMode || isMobile ? false : { opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="w-px h-24 bg-gradient-to-b from-gold-classic/50 via-gold-classic/20 to-transparent mt-12"
        />
      </motion.div>

      {/* Parallax scroll indicator */}
      <motion.div
        initial={safetyMode || isMobile ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 1 }}
        onClick={onExplore}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center cursor-pointer group"
        style={{ y: (isMobile || safetyMode) ? 0 : y3 }}
      >
        <span className="text-[9px] tracking-[0.6em] text-gold-pale/50 uppercase font-outfit mb-4 group-hover:text-gold-classic transition-colors duration-300">
          Discover
        </span>
        <motion.div
          animate={{ y: [0, 12, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="relative"
        >
          <ArrowDown className="w-5 h-5 text-gold-classic group-hover:text-gold-pale transition-colors" />
          <div className="absolute inset-0 blur-md bg-gold-classic/40 -z-10" />
        </motion.div>

        {/* Animated scroll line */}
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: 40 }}
          transition={{ delay: 2, duration: 1 }}
          className="w-px bg-gradient-to-b from-gold-classic/0 via-gold-classic/30 to-gold-classic/0 mt-2"
        />
      </motion.div>
    </div>
  );
}