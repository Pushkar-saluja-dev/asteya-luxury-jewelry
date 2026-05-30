import { Heart, X, ShoppingBag, Eye, HeartOff } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Product } from "../types";

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  wishlistItems: Product[];
  onRemoveItem: (product: Product) => void;
  onViewProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export default function WishlistDrawer({
  isOpen,
  onClose,
  wishlistItems,
  onRemoveItem,
  onViewProduct,
  onAddToCart
}: WishlistDrawerProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-plum-950/80 backdrop-blur-sm"
          />

          {/* Drawer Pane */}
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 220 }}
              className="w-screen max-w-md glass-panel-heavy h-full flex flex-col justify-between"
            >
              {/* Header */}
              <div className="p-6 border-b border-gold-classic/10 flex items-center justify-between bg-plum-950/20">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-gold-classic fill-gold-classic" />
                  <span className="font-cinzel text-lg tracking-widest text-[#f5f0f5] font-semibold">
                    SAVED REPRESENTS
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 rounded-full hover:bg-gold-classic/10 text-gold-pale hover:text-gold-classic transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* List Section */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {wishlistItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 pt-16">
                    <HeartOff className="w-10 h-10 text-gold-pale/30" />
                    <h4 className="font-cinzel text-sm tracking-wider text-gold-pale uppercase font-semibold">
                      Wishlist Empty
                    </h4>
                    <p className="font-cormorant text-gray-400 text-sm italic">
                      "Collect stellar rings or sovereign crowns to curate your signature ASTEYA style."
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {wishlistItems.map((product) => (
                      <motion.div
                        key={product.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex gap-4 p-3 border border-gold-classic/5 bg-plum-950/20 rounded-sm relative group"
                      >
                        {/* Image */}
                        <div
                          onClick={() => onViewProduct(product)}
                          className="w-18 aspect-square overflow-hidden border border-gold-classic/10 rounded-sm bg-plum-900 cursor-pointer"
                        >
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        {/* Content */}
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start">
                              <h5
                                onClick={() => onViewProduct(product)}
                                className="font-cinzel text-xs text-f7f3f7 font-semibold tracking-wide cursor-pointer hover:text-gold-classic line-clamp-1"
                              >
                                {product.name}
                              </h5>
                              <button
                                onClick={() => onRemoveItem(product)}
                                className="text-gray-500 hover:text-red-400 p-1 rounded transition-colors"
                                aria-label="Remove from wishlist"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <span className="text-[9px] tracking-wide text-gray-400 font-outfit uppercase mt-0.5 block">
                              {product.collection}
                            </span>
                            <span className="font-outfit text-gold-classic font-semibold text-xs inline-block mt-1">
                              {formatPrice(product.price)}
                            </span>
                          </div>

                          {/* Quick Interactive Actions */}
                          <div className="flex gap-2.5 mt-2">
                            <button
                              onClick={() => {
                                onAddToCart(product);
                                onRemoveItem(product);
                              }}
                              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-gold-classic/10 hover:bg-gold-classic hover:text-plum-950 text-gold-classic font-outfit text-[9px] tracking-widest uppercase rounded-sm transition-all"
                            >
                              <ShoppingBag className="w-3 h-3" />
                              Send to Velvet Box
                            </button>
                            <button
                              onClick={() => onViewProduct(product)}
                              className="px-2.5 py-1.5 border border-gold-classic/20 hover:border-gold-classic/45 text-gold-pale hover:text-gold-classic font-outfit text-[9px] uppercase rounded-sm transition-all"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Close footer button */}
              <div className="p-6 border-t border-gold-classic/5 bg-plum-900/40">
                <button
                  onClick={onClose}
                  className="w-full py-4.5 border border-gold-classic/30 text-gold-pale hover:bg-gold-classic hover:text-plum-950 font-outfit text-xs tracking-widest uppercase font-bold rounded-sm transition-all cursor-pointer text-center"
                >
                  Return to Atelier
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
