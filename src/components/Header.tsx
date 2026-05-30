import { useState, useEffect } from "react";
import { ShoppingBag, Heart, User, Sparkles, Menu, X, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User as UserType } from "../types";
import { checkIsAdmin } from "../lib/admin";

interface HeaderProps {
  cartCount: number;
  wishlistCount: number;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: UserType | null;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenVIP: () => void;
}

export default function Header({
  cartCount,
  wishlistCount,
  activeTab,
  setActiveTab,
  currentUser,
  onOpenCart,
  onOpenWishlist,
  onOpenVIP
}: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isAdmin = checkIsAdmin(currentUser?.email);
  const navItems = [
    { id: "catalog", label: "Haute Ateliers" },
    { id: "tryon", label: "AI Virtual Try-On", icon: true },
    { id: "concierge", label: "AI Concierge", icon: true },
    { id: "stacker", label: "Atelier Stacker", icon: true },
    { id: "vip", label: "My Profile" },
    ...(isAdmin ? [{ id: "admin", label: "Curator Panel", admin: true }] : [])
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-plum-950/90 backdrop-blur-md py-4 border-b border-gold-classic/10"
          : "bg-transparent py-6"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Mobile menu trigger */}
        <button
          className="md:hidden text-gold-pale hover:text-gold-classic transition-colors"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Brand Logo - Sculpted and majestic */}
        <div
          onClick={() => setActiveTab("catalog")}
          className="cursor-pointer flex flex-col items-center justify-center select-none"
        >
          <span className="font-cinzel text-2xl tracking-[0.3em] font-medium text-gold-classic bg-clip-text text-transparent bg-gradient-to-r from-gold-classic via-gold-light to-gold-dim">
            ASTEYA
          </span>
          <span className="text-[7px] tracking-[0.6em] text-gold-pale/60 uppercase font-outfit mt-0.5">
            Haute Joaillerie • Paris
          </span>
        </div>

        {/* Desktop Navigation - High contrast custom spacing */}
        <nav className="hidden md:flex items-center space-x-10">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative font-outfit text-xs tracking-[0.2em] uppercase transition-all duration-300 py-1 cursor-pointer flex items-center gap-1.5 ${
                activeTab === item.id
                  ? "text-gold-classic font-semibold"
                  : "text-gray-300 hover:text-gold-pale"
              }`}
            >
              {item.icon && <Sparkles className="w-3 h-3 text-gold-classic animate-pulse" />}
              {item.admin && <ShieldCheck className="w-3 h-3 text-gold-classic" />}
              {item.label}
              {activeTab === item.id && (
                <motion.div
                  layoutId="activeTabUnderline"
                  className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-gold-classic"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>

          ))}
        </nav>

        {/* Action Tray */}
        <div className="flex items-center space-x-5 lg:space-x-8">
          {/* Profile Status Icon indicators */}
          <button
            onClick={onOpenVIP}
            className="flex items-center gap-1.5 py-1 px-3.5 rounded-full border border-gold-classic/20 bg-gold-classic/5 hover:bg-gold-classic/15 transition-all duration-300 text-gold-pale group"
          >
            <User className="w-3.5 h-3.5 text-gold-classic group-hover:scale-110 transition-transform" />
            <span className="hidden lg:inline text-[9px] uppercase tracking-widest font-outfit text-gold-pale">
              {currentUser ? "My Profile" : "Sign In"}
            </span>
          </button>

          {/* Saved Items / Wishlist */}
          <button
            onClick={onOpenWishlist}
            className="relative p-1 text-gray-300 hover:text-gold-classic transition-colors"
            aria-label="Wishlist"
          >
            <Heart className="w-5 h-5 stroke-[1.5]" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-gradient-to-tr from-gold-dim to-gold-light text-[#120313] text-[9px] font-bold font-outfit w-4 h-4 rounded-full flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Bag / Cart */}
          <button
            onClick={onOpenCart}
            className="relative p-1 text-gray-300 hover:text-gold-classic transition-colors"
            aria-label="Cart"
          >
            <ShoppingBag className="w-5 h-5 stroke-[1.5]" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-gradient-to-tr from-gold-dim to-gold-light text-[#120313] text-[9px] font-bold font-outfit w-4 h-4 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-plum-950/95 backdrop-blur-lg flex flex-col p-8 justify-between"
          >
            <div>
              <div className="flex justify-between items-center mb-16">
                <span className="font-cinzel text-xl tracking-widest text-gold-classic">
                  ASTEYA
                </span>
                <button
                  className="text-gold-pale hover:text-gold-classic"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex flex-col space-y-8">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`text-left font-cinzel text-lg tracking-widest uppercase pb-2 border-b border-gold-classic/5 flex items-center gap-3 ${
                      activeTab === item.id ? "text-gold-classic" : "text-gray-300"
                    }`}
                  >
                    {item.icon && <Sparkles className="w-4 h-4 text-gold-classic" />}
                    {item.admin && <ShieldCheck className="w-4 h-4 text-gold-classic" />}
                    {item.label}
                  </button>

                ))}
              </div>
            </div>

            <div className="border-t border-gold-classic/10 pt-8 flex flex-col items-center">
              <span className="text-[10px] tracking-widest uppercase font-outfit text-gold-pale/50 mb-4">
                Exclusive Paris Collection
              </span>
              <button
                onClick={() => {
                  onOpenVIP();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-center py-3 border border-gold-classic/30 rounded-md text-xs tracking-[0.2em] font-outfit text-gold-pale uppercase hover:bg-gold-classic/10 transition-colors"
              >
                View My Profile
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
