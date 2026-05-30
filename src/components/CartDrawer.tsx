import { ShoppingBag, X, Trash2, ArrowRight, Clock, ShieldCheck, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { CartItem } from "../types";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onRemoveItem: (index: number) => void;
  onUpdateQuantity: (index: number, qty: number) => void;
  onClearCart: () => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onRemoveItem,
  onUpdateQuantity,
  onClearCart
}: CartDrawerProps) {
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(0);

  const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const secureDelivery = subtotal > 15000 ? 0 : 500; // Complimentary VIP Armored Delivery over ₹15k
  const taxation = subtotal * 0.0825; // Luxury jewelry excise estimation
  const total = subtotal + secureDelivery + taxation;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(price);
  };

  // Luxury high-end checkout simulation stages
  const executeBespokeCheckout = () => {
    setCheckingOut(true);
    setCheckoutStep(1);

    const stages = [
      { delay: 1500, step: 2 }, // Stage 2: Validating physical vault balances
      { delay: 3200, step: 3 }, // Stage 3: Packaging under Master Artisan supervision into luxury velvet liners
      { delay: 5000, step: 4 }, // Stage 4: Locking armored logistics transport courier
      { delay: 6800, step: 5 }  // Stage 5: Finalizing VIP Circle members ledger allocation
    ];

    stages.forEach(({ delay, step }) => {
      setTimeout(() => {
        setCheckoutStep(step);
      }, delay);
    });
  };

  const finalizePurchase = () => {
    setCheckingOut(false);
    setCheckoutStep(0);
    onClearCart();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop overlay */}
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
              <div className="p-6 border-b border-gold-classic/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-gold-classic" />
                  <span className="font-cinzel text-lg tracking-widest text-[#f5f0f5] font-semibold">
                    YOUR VELVET DRAWER
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 rounded-full hover:bg-gold-classic/10 text-gold-pale hover:text-gold-classic transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Central Panel body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {checkingOut ? (
                  /* High-end checkout progress screen */
                  <div className="h-full flex flex-col items-center justify-center text-center px-4">
                    <div className="relative mb-8 w-24 h-24 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full border-2 border-gold-classic/10 border-t-gold-classic animate-spin" />
                      <ShoppingBag className="w-8 h-8 text-gold-classic animate-pulse" />
                    </div>

                    <AnimatePresence mode="wait">
                      {checkoutStep === 1 && (
                        <motion.div
                          key="step1"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="space-y-3"
                        >
                          <h4 className="font-cinzel text-md tracking-wider text-gold-classic font-semibold">
                            AUTHENTICATING TRANSACTION
                          </h4>
                          <p className="font-cormorant text-gray-400 italic text-sm">
                            Atelier Registry databases connection validation in progress...
                          </p>
                        </motion.div>
                      )}

                      {checkoutStep === 2 && (
                        <motion.div
                          key="step2"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="space-y-3"
                        >
                          <h4 className="font-cinzel text-md tracking-wider text-gold-classic font-semibold">
                            VAULT ALLOCATION
                          </h4>
                          <p className="font-cormorant text-gray-400 italic text-sm">
                            Authorizing precise solid carbon and precious metals balances release...
                          </p>
                        </motion.div>
                      )}

                      {checkoutStep === 3 && (
                        <motion.div
                          key="step3"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="space-y-3"
                        >
                          <h4 className="font-cinzel text-md tracking-wider text-gold-classic font-semibold">
                            BESPOKE PACKAGING
                          </h4>
                          <p className="font-cormorant text-gray-400 italic text-sm">
                            Crating your jewels inside micro-sateen and hand-wax-sealed velvet box...
                          </p>
                        </motion.div>
                      )}

                      {checkoutStep === 4 && (
                        <motion.div
                          key="step4"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="space-y-3"
                        >
                          <h4 className="font-cinzel text-md tracking-wider text-gold-classic font-semibold">
                            ARMORED ROUTING
                          </h4>
                          <p className="font-cormorant text-gray-400 italic text-sm">
                            Coordinating highly secure GPS-tracked armed transport for direct doorstep handover...
                          </p>
                        </motion.div>
                      )}

                      {checkoutStep === 5 && (
                        <motion.div
                          key="step5"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="space-y-6"
                        >
                          <ShieldCheck className="w-12 h-12 text-gold-classic mx-auto" />
                          <div>
                            <h4 className="font-cinzel text-lg tracking-widest text-gold-classic font-bold mb-2">
                              ACQUISITION SECURED
                            </h4>
                            <p className="font-cormorant text-gray-300 italic text-base leading-relaxed">
                              "Your premium ASTEYA pieces have been allocated. A master certificate of authenticity is bound. Express delivery details sent to your registered VIP Circle email."
                            </p>
                          </div>
                          <button
                            onClick={finalizePurchase}
                            className="w-full py-3.5 bg-gold-gradient text-plum-950 font-outfit text-xs tracking-widest font-bold uppercase rounded-sm hover:shadow-gold-glow transition-all"
                          >
                            Conclude Atelier Session
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : cartItems.length === 0 ? (
                  /* Empty state */
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 pt-16">
                    <div className="p-4 rounded-full bg-gold-classic/5 border border-gold-classic/10">
                      <ShoppingBag className="w-10 h-10 text-gold-pale/40" />
                    </div>
                    <h4 className="font-cinzel text-sm tracking-wider text-gold-pale uppercase font-semibold">
                      Drawer Is Unassigned
                    </h4>
                    <p className="font-cormorant text-gray-400 text-sm max-w-xs italic">
                      "Select custom rings, necklaces, cuffs, or earrings to begin Atelier allocations."
                    </p>
                  </div>
                ) : (
                  /* Render Cart Items list */
                  <div className="space-y-5">
                    {cartItems.map((item, index) => (
                      <motion.div
                        key={`${item.product.id}-${item.selectedSize || index}`}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-4.5 p-4 border border-gold-classic/5 bg-plum-950/20 rounded-sm relative group"
                      >
                        {/* Image */}
                        <div className="w-20 aspect-square overflow-hidden border border-gold-classic/10 rounded-sm bg-plum-900">
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        {/* Text info and Quantity modifier */}
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start">
                              <h5 className="font-cinzel text-xs sm:text-sm text-f7f3f7 font-medium tracking-wide line-clamp-1">
                                {item.product.name}
                              </h5>
                              <button
                                onClick={() => onRemoveItem(index)}
                                className="text-gray-500 hover:text-red-400 p-1 rounded transition-colors cursor-pointer"
                                aria-label="Remove item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <span className="text-[10px] tracking-wide text-gray-400 font-outfit mt-0.5 block">
                              {item.product.categoryLabel}
                              {item.selectedSize && ` • Size: ${item.selectedSize}`}
                            </span>
                          </div>

                          <div className="flex justify-between items-center mt-3">
                            {/* Quantity stepper selection */}
                            <div className="flex items-center border border-gold-classic/15 rounded-sm overflow-hidden bg-plum-950/40">
                              <button
                                onClick={() => onUpdateQuantity(index, item.quantity - 1)}
                                className="px-2 py-1 text-gray-400 hover:bg-gold-classic/10 text-xs"
                              >
                                —
                              </button>
                              <span className="px-3 py-1 font-mono text-xs text-gold-pale">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                                className="px-2 py-1 text-gray-400 hover:bg-gold-classic/10 text-xs"
                              >
                                +
                              </button>
                            </div>
                            
                            <span className="font-outfit text-gold-classic font-semibold text-sm">
                              {formatPrice(item.product.price * item.quantity)}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Order pricing summary footer summary */}
              {!checkingOut && cartItems.length > 0 && (
                <div className="p-6 border-t border-gold-classic/10 bg-plum-900/95 space-y-4">
                  <div className="space-y-2.5 text-xs text-gray-300 font-outfit">
                    <div className="flex justify-between">
                      <span className="font-light">Boutique Subtotal</span>
                      <span className="text-gold-pale">{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-light">Armored Handover Delivery</span>
                      {secureDelivery === 0 ? (
                        <span className="text-gold-classic tracking-widest text-[10px] uppercase font-bold">
                          COMPLIMENTARY VIP
                        </span>
                      ) : (
                        <span className="text-gold-pale">{formatPrice(secureDelivery)}</span>
                      )}
                    </div>
                    <div className="flex justify-between">
                      <span className="font-light">Estimated Luxury Excise</span>
                      <span className="text-gold-pale">{formatPrice(taxation)}</span>
                    </div>
                    <div className="h-[1px] w-full bg-gold-classic/10 my-1" />
                    <div className="flex justify-between text-sm sm:text-base font-semibold pt-1">
                      <span className="font-cinzel tracking-wider text-[#f5f0f5]">AGGREGATED VALUE</span>
                      <span className="text-gold-classic font-outfit">{formatPrice(total)}</span>
                    </div>
                  </div>

                  <button
                    onClick={executeBespokeCheckout}
                    className="w-full flex items-center justify-center gap-2.5 py-4 bg-gold-gradient text-plum-950 font-outfit text-xs tracking-[0.25em] uppercase font-bold hover:shadow-gold-glow transition-all rounded-sm cursor-pointer mt-2"
                  >
                    Lock Vault & Checkout
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  
                  <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-400 font-mono tracking-widest text-center mt-3 uppercase">
                    <Clock className="w-3.5 h-3.5 text-gold-classic" />
                    Secure Paris Vault Insured Hand-carry logistics
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
