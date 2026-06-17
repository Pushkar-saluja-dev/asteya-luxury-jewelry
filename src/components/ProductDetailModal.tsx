import { useState, useRef, MouseEvent, useEffect } from "react";
import { X, ShoppingBag, Sparkles, Heart, ShieldCheck, HelpCircle, Box } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Product } from "../types";
import { useMotionSafety } from "../lib/useMotionSafety";
import ErrorBoundary from "./ErrorBoundary";

interface ProductDetailModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  isWishlisted: boolean;
  onToggleWishlist: () => void;
  onAddToCart: (product: Product, size?: string) => void;
  onTryOn: () => void;
}

interface ThreeDViewerProps {
  url: string;
  name: string;
}

function ThreeDViewer({ url, name }: ThreeDViewerProps) {
  const ModelViewerElement = "model-viewer" as any;
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const viewerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = viewerRef.current;
    if (!el) return;

    // Reset state on url changes
    setLoading(true);
    setProgress(0);
    setError(null);

    const handleLoad = () => {
      setLoading(false);
    };

    const handleError = (e: any) => {
      console.error("Model failed to load:", e);
      const errType = e?.detail?.type || "unknown";
      setError(`Failed to load 3D model (Error: ${errType}).`);
      setLoading(false);
    };

    const handleProgress = (e: any) => {
      const totalProgress = e?.detail?.totalProgress || 0;
      setProgress(Math.round(totalProgress * 100));
    };

    el.addEventListener("load", handleLoad);
    el.addEventListener("error", handleError);
    el.addEventListener("progress", handleProgress);

    // Guard: check if the model is already loaded
    if ((el as any).loaded) {
      setLoading(false);
    }

    return () => {
      el.removeEventListener("load", handleLoad);
      el.removeEventListener("error", handleError);
      el.removeEventListener("progress", handleProgress);
    };
  }, [url]);

  return (
    <div className="w-full h-full relative flex items-center justify-center bg-transparent">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-plum-950/40 z-10 gap-3">
          <div className="w-10 h-10 border border-gold-classic/20 border-t-gold-classic rounded-full animate-spin" />
          <div className="font-outfit text-[10px] tracking-[0.2em] text-gold-pale uppercase font-medium">
            Loading 3D Render: {progress}%
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-plum-950/60 text-red-400 font-outfit text-xs text-center p-4 z-10">
          {error}
        </div>
      )}
      <ModelViewerElement
        ref={viewerRef}
        src={url}
        alt={name}
        auto-rotate
        camera-controls
        shadow-intensity="1.5"
        exposure="1.2"
        shadow-softness="1"
        environment-image="neutral"
        style={{ width: "100%", height: "100%", backgroundColor: "transparent" }}
        className="w-full h-full cursor-grab active:cursor-grabbing block"
      />
    </div>
  );
}

export default function ProductDetailModal({
  product,
  isOpen,
  onClose,
  isWishlisted,
  onToggleWishlist,
  onAddToCart,
  onTryOn
}: ProductDetailModalProps) {
  const safetyMode = useMotionSafety();

  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState("7");
  const [view3D, setView3D] = useState(false);
  const [accordionOpen, setAccordionOpen] = useState(true);
  
  // Hover Magnifier logic
  const [magnifierStyle, setMagnifierStyle] = useState({
    backgroundImage: `url(${product.images[activeImgIndex]})`,
    backgroundPosition: "0% 0%",
    display: "none"
  });
  
  const imgContainerRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.pageX - left - window.scrollX) / width) * 100;
    const y = ((e.pageY - top - window.scrollY) / height) * 100;
    
    setMagnifierStyle({
      backgroundImage: `url(${product.images[activeImgIndex]})`,
      backgroundPosition: `${x}% ${y}%`,
      display: "block"
    });
  };

  const handleMouseLeave = () => {
    setMagnifierStyle((prev) => ({ ...prev, display: "none" }));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={safetyMode ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-plum-950/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={safetyMode ? false : { opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 30 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative w-full max-w-6xl h-[90vh] md:h-auto md:max-h-[92vh] glass-panel-heavy rounded-sm overflow-y-auto flex flex-col md:grid md:grid-cols-12 md:divide-x md:divide-gold-classic/10"
        >
          {/* Close trigger button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 z-40 p-2.5 rounded-full border border-gold-classic/10 bg-plum-950/80 hover:bg-gold-classic text-gold-pale hover:text-plum-950 transition-all duration-300"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Left Side: Art Image & 3D Interactive Viewer Column */}
          <div className="md:col-span-6 p-6 sm:p-8 flex flex-col justify-center">
            {/* View Mode Switcher */}
            <div className="flex gap-4 justify-center mb-6 z-10">
              <button
                onClick={() => setView3D(false)}
                className={`py-1.5 px-4 font-outfit text-[10px] tracking-[0.2em] uppercase rounded-full transition-all duration-300 ${
                  !view3D
                    ? "bg-gold-classic text-plum-950 font-bold"
                    : "border border-gold-classic/20 text-gray-300 hover:bg-gold-classic/5"
                }`}
              >
                Atelier Photography
              </button>
              <button
                onClick={() => setView3D(true)}
                className={`py-1.5 px-4 font-outfit text-[10px] tracking-[0.2em] uppercase rounded-full flex items-center gap-1.5 transition-all duration-300 ${
                  view3D
                    ? "bg-gold-gradient text-plum-950 font-bold"
                    : "border border-gold-classic/20 text-gray-300 hover:bg-gold-classic/5"
                }`}
              >
                <Box className="w-3.5 h-3.5" />
                Interactive 3D Render
              </button>
            </div>

            {/* Display Node: either image gallery with magnifier or <model-viewer> */}
            <div className="relative w-full aspect-square border border-gold-classic/10 rounded-sm bg-plum-900/60 flex items-center justify-center overflow-hidden">
              {!view3D ? (
                /* 2D Magnifiable Display Image */
                <div
                  ref={imgContainerRef}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                  className="relative w-full h-full cursor-zoom-in group select-none flex items-center justify-center"
                >
                  <img
                    src={product.images[activeImgIndex]}
                    alt={product.name}
                    className="max-w-full max-h-full object-contain p-2"
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Magnified zoom lens backdrop overlay */}
                  <div
                    style={{
                      ...magnifierStyle,
                      position: "absolute",
                      width: "100%",
                      height: "100%",
                      pointerEvents: "none",
                      backgroundRepeat: "no-repeat",
                      backgroundSize: "220% 220%",
                      top: 0,
                      left: 0,
                      zIndex: 20
                    }}
                    className="border border-gold-classic/20 bg-plum-950/90 rounded-sm"
                  />
                  
                  {/* Subtle hover instructions */}
                  <div className="absolute bottom-4 left-4 text-[9px] tracking-widest text-gold-pale/40 uppercase font-outfit pointer-events-none group-hover:opacity-0 transition-opacity">
                    HOVER TO MAGNIFY DETAILS
                  </div>
                </div>
              ) : (
                /* Native 3D model-viewer integration */
                <div className="w-full h-full relative">
                  <ErrorBoundary name="3D/model-viewer">
                    {product.modelUrl ? (
                      <ThreeDViewer url={product.modelUrl} name={product.name} />
                    ) : (
                      <ThreeDViewer url="https://modelviewer.dev/shared-assets/models/glTF-Sample-Assets/Models/ToyCar/glTF/ToyCar.gltf" name={product.name} />
                    )}
                  </ErrorBoundary>
                  
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[9px] tracking-widest text-gold-pale/70 uppercase font-outfit pointer-events-none text-center bg-plum-950/80 px-4 py-1 border border-gold-classic/15 rounded-full">
                    ROTATE 3D MODEL WITH MOUSE
                  </div>
                </div>
              )}
            </div>

            {/* Thumbnails list - Only shown under 2D Photography */}
            {!view3D && (
              <div className="flex gap-4.5 justify-center mt-6">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImgIndex(idx)}
                    className={`relative w-22 aspect-square border overflow-hidden rounded-sm transition-all duration-300 ${
                      activeImgIndex === idx
                        ? "border-gold-classic scale-102"
                        : "border-gold-classic/10 hover:border-gold-classic/30"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} angle ${idx}`}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Side: Product Details Column */}
          <div className="md:col-span-6 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto">
            <div>
              {/* Collection, Category & Wishlist */}
              <div className="flex items-center justify-between mb-4 border-b border-gold-classic/5 pb-4">
                <div className="flex flex-col">
                  <span className="text-[10px] tracking-[0.25em] uppercase font-outfit text-gold-classic font-semibold">
                    {product.collection} Collection
                  </span>
                  <span className="text-gray-400 text-[11px] uppercase tracking-widest mt-0.5">
                    {product.categoryLabel}
                  </span>
                </div>
                
                {/* Save item Button */}
                <button
                  onClick={onToggleWishlist}
                  className="flex items-center gap-1.5 text-[10px] uppercase font-outfit tracking-widest text-[#be93be] hover:text-gold-classic transition-colors"
                >
                  <Heart className={`w-4 h-4 ${isWishlisted ? "fill-gold-classic text-gold-classic" : ""}`} />
                  {isWishlisted ? "Saved" : "Save Atelier"}
                </button>
              </div>

              {/* Title & Price */}
              <h2 className="font-cinzel text-2xl lg:text-3xl font-bold tracking-widest text-[#f5f0f5] mb-4">
                {product.name}
              </h2>
              <div className="text-xl lg:text-2xl font-outfit text-gold-classic font-bold tracking-wide mb-6">
                {formatPrice(product.price)}
              </div>

              {/* Description Quote */}
              <p className="font-cormorant text-base lg:text-lg italic text-gray-300 leading-relaxed tracking-wide mb-6 border-l-2 border-gold-classic/20 pl-4">
                {product.description}
              </p>

              {/* Materials grid tags */}
              <div className="mb-6">
                <span className="block text-[10px] tracking-widest uppercase font-outfit text-gold-pale/50 mb-3">
                  Atelier Materials
                </span>
                <div className="flex flex-wrap gap-2.5">
                  {product.materials.map((mat, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-outfit tracking-widest text-gold-pale bg-gold-classic/5 border border-gold-classic/15 py-1 px-3 rounded-sm"
                    >
                      {mat}
                    </span>
                  ))}
                  <span className="text-[10px] font-outfit tracking-widest text-gold-classic bg-plum-900/40 border border-gold-classic/15 py-1 px-3 rounded-sm">
                    {product.caratWeight} ctwt Hand-set Weight
                  </span>
                </div>
              </div>

              {/* Ring Size Selection (If Rings range) */}
              {product.category === "rings" && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2.5">
                    <span className="text-[10px] tracking-widest uppercase font-outfit text-gold-pale/50">
                      Standard Atelier Ring Size
                    </span>
                    <button className="text-[9px] uppercase tracking-widest text-gold-classic underline cursor-pointer hover:text-gold-light">
                      Sizing Atelier Guide
                    </button>
                  </div>
                  <div className="flex gap-2">
                    {["5", "6", "7", "8", "9", "10"].map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`w-10 h-10 border rounded-sm font-outfit text-xs transition-all duration-300 ${
                          selectedSize === size
                            ? "border-gold-classic bg-gold-gradient text-plum-950 font-bold"
                            : "border-gold-classic/15 text-gray-300 hover:border-gold-classic/40"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Atelier Technical Specifications Dropdown Accordion */}
              <div className="border border-gold-classic/10 bg-plum-950/20 rounded-sm mb-8 overflow-hidden">
                <button
                  onClick={() => setAccordionOpen(!accordionOpen)}
                  className="w-full flex justify-between items-center p-4 text-[10px] tracking-[0.2em] font-outfit uppercase text-gold-pale border-b border-gold-classic/5 focus:outline-none cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-gold-classic" />
                    Atelier Certified Spec Sheet
                  </span>
                  <span>{accordionOpen ? "—" : "+"}</span>
                </button>
                
                <AnimatePresence>
                  {accordionOpen && (
                    <motion.div
                      initial={safetyMode ? false : { height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="text-xs font-outfit text-gray-300 p-4 divide-y divide-gold-classic/5"
                    >
                      {Object.entries(product.specifications || {})
                        .filter(([key]) => {
                          const k = key.toLowerCase();
                          // Filter out gemstone and carat related specs since asteya is artificial jewelry
                          if (
                            k.includes("gem") ||
                            k.includes("stone") ||
                            k.includes("cut") ||
                            k.includes("crystal") ||
                            k.includes("emerald") ||
                            k.includes("amethyst") ||
                            k.includes("diamond") ||
                            k.includes("carat")
                          ) {
                            return false;
                          }
                          // Hide technical config URLs
                          if (k.includes("try_on") || k.includes("mtl") || k.includes("model_url")) {
                            return false;
                          }
                          // Only allow clean standard curator fields or valid custom keys
                          return (
                            k.includes("reference") ||
                            k.includes("metal") ||
                            k.includes("purity") ||
                            k.includes("weight") ||
                            k.includes("quality") ||
                            k.includes("length") ||
                            k.includes("width") ||
                            k.includes("breadth") ||
                            // or generic clean custom keys
                            (!k.includes("_url") && !k.startsWith("physical_"))
                          );
                        })
                        .map(([key, val]) => (
                          <div key={key} className="flex justify-between py-2.5">
                            <span className="text-gray-400 font-light tracking-[0.05em]">{key}</span>
                            <span className="text-right text-gold-pale max-w-xs">{val}</span>
                          </div>
                        ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* CTAs Box Row */}
            <div className="flex flex-col sm:flex-row gap-4.5 pt-6 border-t border-gold-classic/10">
              {/* Add to Velvet box (add to cart) */}
              <button
                onClick={() => {
                  onAddToCart(product, product.category === "rings" ? selectedSize : undefined);
                  onClose();
                }}
                className="flex-1 flex items-center justify-center gap-3 py-4 bg-gold-gradient text-plum-950 font-outfit text-xs tracking-[0.25em] uppercase font-bold hover:shadow-gold-glow transition-all duration-300 rounded-sm cursor-pointer border border-transparent"
              >
                <ShoppingBag className="w-4 h-4" />
                Place In Velvet Box
              </button>

              {/* AI Try-on Launch trigger */}
              {product.tryOnImageUrl ? (
                <button
                  onClick={onTryOn}
                  className="flex-1 flex items-center justify-center gap-2 py-4 border border-gold-classic/40 bg-pink-950/20 hover:bg-gold-classic/20 text-gold-classic font-outfit text-xs tracking-[0.25em] uppercase font-bold transition-all duration-300 rounded-sm cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 animate-bounce" />
                  Initiate AI Virtual Try-On
                </button>
              ) : (
                <button
                  disabled
                  className="flex-1 flex items-center justify-center gap-2 py-4 border border-gray-700/30 bg-gray-950/25 text-gray-500 font-outfit text-xs tracking-[0.25em] uppercase font-bold rounded-sm cursor-not-allowed opacity-50"
                  title="Virtual Try-On is only available for products with a dedicated AR template."
                >
                  AR Try-On Unavailable
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
