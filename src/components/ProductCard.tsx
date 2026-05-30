import React from "react";
import { Heart, Sparkles, Eye, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { Product } from "../types";

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
  // Safe currency symbol formatting
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.8 }}
      className="group relative flex flex-col bg-plum-950/40 border border-gold-classic/10 rounded-sm hover:border-gold-classic/35 transition-all duration-500 overflow-hidden shadow-gold-soft"
    >
      {/* Absolute Badges (New, Limited, etc.) */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        {product.isNew && (
          <span className="flex items-center gap-1 bg-gold-gradient text-plum-950 text-[8px] font-bold tracking-[0.2em] uppercase px-2.5 py-1 rounded-sm">
            <Sparkles className="w-2.5 h-2.5" />
            NEW ATELIER
          </span>
        )}
        {product.isLimited && (
          <span className="flex items-center gap-1 bg-purple-900 border border-gold-classic/25 text-gold-pale text-[8px] font-bold tracking-[0.2em] uppercase px-2.5 py-1 rounded-sm">
            <ShieldCheck className="w-2.5 h-2.5 text-gold-classic" />
            LIMITED EDITION
          </span>
        )}
      </div>

      {/* Heart Wishlist Trigger */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleWishlist();
        }}
        className="absolute top-4 right-4 z-20 p-2 rounded-full glass-panel hover:bg-gold-classic/20 text-gold-pale hover:text-gold-classic transition-all duration-300 group/wish"
        aria-label="Add to Wishlist"
      >
        <Heart
          className={`w-4 h-4 transition-all duration-300 ${
            isWishlisted
              ? "fill-gold-classic text-gold-classic scale-110"
              : "text-gold-pale group-hover/wish:scale-105"
          }`}
        />
      </button>

      {/* Premium Multi-angle Image Display */}
      <div
        onClick={onSelect}
        className="relative aspect-[4/5] overflow-hidden cursor-pointer bg-plum-900"
      >
        {/* Main Angle Image */}
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-1000 ease-out"
          referrerPolicy="no-referrer"
        />

        {/* Cinematic Golden Overlay Accent Line on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-plum-950 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />
        
        {/* Hover Quick View Trigger button wrapper */}
        <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-plum-950/40 backdrop-blur-[2px]">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2 px-5 py-2.5 border border-gold-classic/40 bg-plum-950/80 hover:bg-gold-classic text-gold-classic hover:text-plum-950 font-outfit text-[10px] tracking-[0.25em] uppercase font-bold transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            Enter Atelier Detail
          </motion.div>
        </div>
      </div>

      {/* Product Card Info */}
      <div className="p-6 flex flex-col flex-grow border-t border-gold-classic/5">
        {/* Category Label and Collection */}
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] tracking-[0.2em] text-gold-pale/60 uppercase font-outfit">
            {product.categoryLabel}
          </span>
          <span className="text-[9px] tracking-widest text-[#be93be] uppercase font-mono font-medium">
            {product.collection}
          </span>
        </div>

        {/* Title */}
        <h3
          onClick={onSelect}
          className="font-cinzel text-sm sm:text-base tracking-widest text-f7f3f7 hover:text-gold-classic cursor-pointer transition-colors line-clamp-1 mb-2.5 font-semibold"
        >
          {product.name}
        </h3>

        {/* Materials Summary Text */}
        <p className="font-cormorant text-xs text-gray-400 italic mb-5 leading-relaxed line-clamp-2">
          {product.materials.join(" • ")}
        </p>

        {/* Price and Details trigger row */}
        <div className="mt-auto flex items-center justify-between pt-4 border-t border-gold-classic/5">
          <span className="font-outfit font-semibold text-gold-classic text-sm sm:text-base tracking-[0.1em]">
            {formatPrice(product.price)}
          </span>
          <div className="text-[10px] font-mono text-gray-500 tracking-widest uppercase">
            {product.caratWeight > 0 ? `${product.caratWeight} ctwt` : "Solid Met"}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
