import { ArrowDown, Flame, Sparkles, Award } from "lucide-react";
import { motion } from "motion/react";

interface HeroProps {
  onExplore: () => void;
}

export default function Hero({ onExplore }: HeroProps) {
  return (
    <div className="relative min-h-screen bg-plum-950 overflow-hidden flex flex-col justify-center items-center px-6 pt-16">
      {/* Background radial gold-purple glow effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] max-w-[800px] h-max-[800px] bg-plum-700/10 rounded-full blur-[160px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[40vw] h-[40vw] bg-gold-classic/5 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute inset-0 bg-radial-gradient from-transparent to-plum-950/90" />
      </div>

      {/* Cinematic Jewelry Model / Aesthetic BG image placeholder - high quality jewelry silhouette */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none mix-blend-lighten">
        <img
          src="https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=1920"
          alt="Fine Jewel Shadow"
          className="w-full h-full object-cover object-center scale-105 filter grayscale contrast-125"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* High-fashion Content Grid */}
      <div className="relative z-10 text-center max-w-4xl mx-auto flex flex-col items-center">
        {/* Couture Tagline */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="flex items-center gap-2 mb-6"
        >
          <div className="h-[1px] w-8 bg-gold-classic/40" />
          <Sparkles className="w-3.5 h-3.5 text-gold-classic" />
          <span className="text-[10px] tracking-[0.4em] text-gold-pale uppercase font-outfit font-medium">
            AI-ENHANCED DIGITAL ATELIER
          </span>
          <div className="h-[1px] w-8 bg-gold-classic/40" />
        </motion.div>

        {/* Brand Headline - Dual Core Pairing */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
          className="font-cinzel text-4xl sm:text-6xl md:text-7xl lg:text-8xl tracking-[0.08em] uppercase text-f7f3f7 leading-tight mb-8"
        >
          Premium Artisan
          <span className="block italic text-shimmer font-cormorant font-normal lowercase tracking-wide mt-2">
            jewellery
          </span>
        </motion.h1>

        {/* Narrative editorial statement */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
          className="font-cormorant text-lg sm:text-2xl font-light text-gray-300 italic max-w-2xl px-4 leading-relaxed tracking-wide mb-14"
        >
          "Crafting absolute geometry and raw cosmic light into custom styling relics. An interface of exquisite design, computer vision, and Parisian master craftsmanship."
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-5 items-center justify-center w-full max-w-md px-4"
        >
          {/* Explore Catalog */}
          <button
            onClick={onExplore}
            className="w-full sm:w-auto px-8 py-4 bg-gold-gradient text-plum-950 font-outfit text-xs tracking-[0.3em] uppercase font-bold hover:shadow-gold-glow transition-all duration-500 rounded-sm cursor-pointer border border-transparent"
          >
            Explore Ateliers
          </button>

          {/* Luxury Brand Quote / Concept */}
          <div className="flex items-center gap-3 text-gold-pale/75 text-xs font-outfit tracking-widest uppercase">
            <Award className="w-4 h-4 text-gold-classic" />
            <span>Atelier Quality Certified</span>
          </div>
        </motion.div>
      </div>

      {/* Parallax scroll decorator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ delay: 1.4, duration: 1 }}
        onClick={onExplore}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center cursor-pointer group"
      >
        <span className="text-[9px] tracking-[0.5em] text-gold-pale/40 uppercase font-outfit mb-3 group-hover:text-gold-classic transition-colors">
          SCROLL TO ATELIERS
        </span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.8 }}
        >
          <ArrowDown className="w-4 h-4 text-gold-classic group-hover:text-gold-pale" />
        </motion.div>
      </motion.div>
    </div>
  );
}
