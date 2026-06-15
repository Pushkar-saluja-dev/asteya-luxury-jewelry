import { Heart, Sparkles, Eye, ShieldCheck, Diamond } from "lucide-react";
import { motion } from "motion/react";
import { Product } from "../types";
import { useMotionSafety } from "../lib/useMotionSafety";

interface ProductCardProps {
  key?: string | number;
  product: Product;
  isWishlisted: boolean;
  onToggleWishlist: () => void;
  onSelect: () => void;
}

export default function ProductCard({
  product,
  isWishlisted,
  onToggleWishlist,
  onSelect
}: ProductCardProps) {
  const safetyMode = useMotionSafety();
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <motion.div
      initial={safetyMode ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="group relative flex flex-col glass-card-luxe overflow-hidden"
    >
      {/* Shine effect on hover */}
      <div className="absolute inset-0 z-30 pointer-events-none">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full"
          initial={{ x: "-100%" }}
          whileHover={{ x: "100%" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>

      {/* Absolute Badges */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        {product.isNew && (
          <motion.div
            initial={safetyMode ? false : { opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-1.5 bg-gold-gradient text-plum-950 text-[8px] font-bold tracking-[0.2em] uppercase px-3 py-1.5 rounded-sm shadow-gold-glow"
          >
            <Sparkles className="w-3 h-3" />
            NEW ATELIER
          </motion.div>
        )}
        {product.isLimited && (
          <motion.div
            initial={safetyMode ? false : { opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-1.5 bg-purple-900/90 backdrop-blur-sm border border-gold-classic/30 text-gold-pale text-[8px] font-bold tracking-[0.2em] uppercase px-3 py-1.5 rounded-sm"
          >
            <ShieldCheck className="w-3 h-3 text-gold-classic" />
            LIMITED
          </motion.div>
        )}
      </div>

      {/* Heart Wishlist Button */}
      <motion.button
        onClick={(e) => {
          e.stopPropagation();
          onToggleWishlist();
        }}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
        className="absolute top-4 right-4 z-20 p-2.5 rounded-full glass-panel hover:bg-gold-classic/20 text-gold-pale hover:text-gold-classic transition-all duration-300 shadow-lg"
        aria-label="Add to Wishlist"
      >
        <motion.div
          animate={isWishlisted ? { scale: [1, 1.3, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          <Heart
            className={`w-4 h-4 transition-all duration-300 ${
              isWishlisted
                ? "fill-gold-classic text-gold-classic"
                : ""
            }`}
          />
        </motion.div>
      </motion.button>

      {/* Premium Image Display */}
      <div
        onClick={onSelect}
        className="relative aspect-[4/5] overflow-hidden cursor-pointer bg-plum-900"
      >
        {/* Main Image */}
        <motion.img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover object-center"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1.1 }}
          whileHover={{ scale: 1.15 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          referrerPolicy="no-referrer"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-plum-950 via-plum-950/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />

        {/* Sparkle decorations */}
        <div className="absolute top-1/4 right-1/4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
          <Diamond className="w-6 h-6 text-gold-classic/60" />
        </div>
        <div className="absolute bottom-1/4 left-1/4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-200">
          <Sparkles className="w-4 h-4 text-gold-pale/40" />
        </div>

        {/* Quick View Button */}
        <motion.div
          initial={false}
          whileHover={{ opacity: 1 }}
          className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 bg-plum-950/50 backdrop-blur-[4px]"
        >
          <motion.div
            whileHover={{ scale: 1.05, y: -2 }}
            className="flex items-center gap-2.5 px-6 py-3 border border-gold-classic/50 bg-plum-950/90 text-gold-classic font-outfit text-[9px] tracking-[0.25em] uppercase font-bold shadow-gold-glow"
          >
            <Eye className="w-4 h-4" />
            View Atelier
          </motion.div>
        </motion.div>
      </div>

      {/* Product Info */}
      <div className="p-6 flex flex-col flex-grow border-t border-gold-classic/5">
        {/* Category & Collection */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] tracking-[0.2em] text-gold-pale/50 uppercase font-outfit">
            {product.categoryLabel}
          </span>
          <span className="text-[9px] tracking-widest text-gold-classic/70 uppercase font-mono font-medium bg-gold-classic/5 px-2 py-0.5 rounded-sm">
            {product.collection}
          </span>
        </div>

        {/* Product Name */}
        <h3
          onClick={onSelect}
          className="font-cinzel text-sm sm:text-base tracking-widest text-[#f7f3f7] hover:text-gold-classic cursor-pointer transition-colors duration-300 line-clamp-1 mb-3 font-semibold"
        >
          {product.name}
        </h3>

        {/* Materials */}
        <p className="font-cormorant text-xs text-gray-400 italic mb-5 leading-relaxed line-clamp-2">
          {product.materials.join(" • ")}
        </p>

        {/* Price Row */}
        <div className="mt-auto flex items-center justify-between pt-4 border-t border-gold-classic/5">
          <motion.span
            initial={safetyMode ? false : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="font-outfit font-semibold text-gold-classic text-sm sm:text-base tracking-[0.1em]"
          >
            {formatPrice(product.price)}
          </motion.span>
          <div className="text-[10px] font-mono text-gray-500 tracking-widest uppercase flex items-center gap-1.5">
            {product.caratWeight > 0 ? (
              <>
                <Diamond className="w-3 h-3 text-gold-classic/50" />
                {product.caratWeight} ct
              </>
            ) : (
              <>
                <ShieldCheck className="w-3 h-3 text-gold-classic/50" />
                SOLID METAL
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}