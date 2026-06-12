import { useState, useEffect } from "react";
import { ShoppingBag, Heart, User, Sparkles, Menu, X, ShieldCheck, Diamond } from "lucide-react";
import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";
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
  const { scrollY } = useScroll();

  const headerOpacity = useTransform(scrollY, [0, 100], [0.35, 0.95]);
  const headerBlur = useTransform(scrollY, [0, 100], [8, 20]);
  const headerY = useTransform(scrollY, [0, 100], [0, -10]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
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
    ...(isAdmin ? [{ id: "admin", label: "Curator Panel", admin: true }] : [])
  ];

  return (
    <>
      <motion.div
        style={{ opacity: headerOpacity, backdropFilter: `blur(${headerBlur}px)` }}
        className="fixed top-0 left-0 right-0 h-24 z-40 bg-plum-950 pointer-events-none"
      />

      <motion.header
        style={{ y: headerY }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${
          scrolled
            ? "bg-plum-950/85 backdrop-blur-xl py-3 border-b border-gold-classic/15 shadow-lg shadow-plum-950/50"
            : "bg-transparent py-6"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="md:hidden text-gold-pale hover:text-gold-classic transition-colors"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu className="w-6 h-6" />
          </motion.button>

          <motion.button
            onClick={() => setActiveTab("catalog")}
            whileHover={{ scale: 1.02 }}
            className="cursor-pointer flex flex-col items-center justify-center select-none bg-transparent border-none p-0"
            aria-label="Asteya Home"
          >
            <motion.span
              className="font-cinzel text-2xl tracking-[0.3em] font-medium text-gold-classic bg-clip-text text-transparent bg-gradient-to-r from-gold-classic via-gold-light to-gold-dim"
              animate={{ backgroundPosition: scrolled ? ["0%", "100%"] : "0%" }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              style={{ backgroundSize: "200%" }}
            >
              ASTEYA
            </motion.span>
            <motion.span
              className="text-[7px] tracking-[0.6em] text-gold-pale/60 uppercase font-outfit mt-0.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Haute Joaillerie • Paris
            </motion.span>
          </motion.button>

          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <motion.button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                whileHover={{ y: -2 }}
                className={`relative font-outfit text-xs tracking-[0.2em] uppercase transition-all duration-300 py-1 cursor-pointer flex items-center gap-1.5 ${
                  activeTab === item.id
                    ? "text-gold-classic font-semibold"
                    : "text-gray-300 hover:text-gold-pale"
                }`}
              >
                {item.icon && (
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  >
                    <Sparkles className="w-3 h-3 text-gold-classic" />
                  </motion.div>
                )}
                {item.admin && <ShieldCheck className="w-3 h-3 text-gold-classic" />}
                {item.label}
                {activeTab === item.id && (
                  <motion.div
                    layoutId="activeTabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-gold-classic to-transparent"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </motion.button>
            ))}
          </nav>

          <div className="flex items-center space-x-4 lg:space-x-6">
            <motion.button
              onClick={onOpenVIP}
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 py-1.5 px-4 rounded-full border border-gold-classic/20 bg-gold-classic/5 hover:bg-gold-classic/15 hover:border-gold-classic/40 transition-all duration-300 text-gold-pale group shadow-gold-soft"
              aria-label={currentUser ? "Open my profile" : "Sign in"}
            >
              <motion.div
                animate={currentUser ? { rotate: 360 } : {}}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <User className="w-4 h-4 text-gold-classic group-hover:scale-110 transition-transform" />
              </motion.div>
              <span className="hidden lg:inline text-[9px] uppercase tracking-widest font-outfit text-gold-pale">
                {currentUser ? "My Profile" : "Sign In"}
              </span>
            </motion.button>

            <motion.button
              onClick={onOpenWishlist}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="relative p-1.5 text-gray-300 hover:text-gold-classic transition-colors"
              aria-label="Wishlist"
            >
              <motion.div
                animate={wishlistCount > 0 ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                <Heart className="w-5 h-5 stroke-[1.5]" />
              </motion.div>
              <AnimatePresence>
                {wishlistCount > 0 && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute -top-1 -right-1 bg-gradient-to-tr from-gold-dim to-gold-light text-[#120313] text-[9px] font-bold font-outfit w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-gold-glow"
                  >
                    {wishlistCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            <motion.button
              onClick={onOpenCart}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="relative p-1.5 text-gray-300 hover:text-gold-classic transition-colors"
              aria-label="Cart"
            >
              <ShoppingBag className="w-5 h-5 stroke-[1.5]" />
              <AnimatePresence>
                {cartCount > 0 && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute -top-1 -right-1 bg-gradient-to-tr from-gold-dim to-gold-light text-[#120313] text-[9px] font-bold font-outfit w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-gold-glow"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 bg-plum-950/98 backdrop-blur-2xl flex flex-col p-8 justify-between"
          >
            <div>
              <div className="flex justify-between items-center mb-16">
                <motion.span
                  className="font-cinzel text-2xl tracking-widest text-gold-classic"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  ASTEYA
                </motion.span>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  className="text-gold-pale hover:text-gold-classic"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <X className="w-6 h-6" />
                </motion.button>
              </div>

              <div className="flex flex-col space-y-6">
                {navItems.map((item, index) => (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`text-left font-cinzel text-lg tracking-widest uppercase pb-3 border-b border-gold-classic/5 flex items-center gap-3 transition-all duration-300 ${
                      activeTab === item.id ? "text-gold-classic pl-4" : "text-gray-300"
                    }`}
                  >
                    {item.icon && <Sparkles className="w-4 h-4 text-gold-classic" />}
                    {item.admin && <ShieldCheck className="w-4 h-4 text-gold-classic" />}
                    {item.label}
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="border-t border-gold-classic/10 pt-8 flex flex-col items-center">
              <span className="text-[10px] tracking-widest uppercase font-outfit text-gold-pale/50 mb-4">
                Exclusive Paris Collection
              </span>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onOpenVIP();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-center py-3 border border-gold-classic/30 rounded-sm text-xs tracking-[0.2em] font-outfit text-gold-pale uppercase hover:bg-gold-classic/10 hover:border-gold-classic/50 transition-all duration-300"
              >
                View My Profile
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}