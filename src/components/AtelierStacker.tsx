import React, { useState, useRef, useEffect } from "react";
import { 
  Plus, Trash2, RotateCw, Layers, Sparkles, RefreshCw, Save, ShoppingBag, 
  ArrowUp, ArrowDown, Check, Info, ZoomIn, Eye 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Product, User } from "../types";
import { useMotionSafety } from "../lib/useMotionSafety";

interface AtelierStackerProps {
  products: Product[];
  onAddToCart: (product: Product, size?: string) => void;
  currentUser: User | null;
  onAddPoints: (points: number) => void;
}

interface StackedItem {
  id: string; // instance unique identifier
  product: Product;
  x: number; // percentage (0 to 100)
  y: number; // percentage (0 to 100)
  scale: number; // multiplier (0.2 to 2.0)
  rotation: number; // degrees (-180 to 180)
  zIndex: number;
}

const calculateProportionalScale = (product: Product, category: string) => {
  const pLength = Number(product.specifications?.["Physical Length (mm)"] || product.specifications?.["physical_length"] || 0);
  const pWidth = Number(product.specifications?.["Physical Width (mm)"] || product.specifications?.["physical_width"] || 0);
  
  if (pLength > 0 || pWidth > 0) {
    if (category === "necklaces") {
      // 55mm height pendant = 0.9 scale
      return (pLength || pWidth) / 55;
    } else if (category === "earrings") {
      // 82mm earring height = 0.55 scale (calibrated for canvas lobe size)
      return pLength / 82;
    } else if (category === "rings") {
      // 57mm ring width = 0.35 scale (calibrated for canvas finger bounds)
      return (pWidth || pLength) / 57;
    } else if (category === "bracelets") {
      // 108mm bracelet width = 0.6 scale (calibrated for wrist)
      return (pWidth || pLength) / 108;
    }
  }
  
  // Standard high-fashion aesthetic overrides if not inputted
  if (category === "necklaces") return product.name.toLowerCase().includes("choker") ? 0.7 : 0.9;
  if (category === "earrings") return 0.55;
  if (category === "rings") return 0.35;
  return 0.6; // bracelets
};

export default function AtelierStacker({
  products,
  onAddToCart,
  currentUser,
  onAddPoints
}: AtelierStackerProps) {
  const safetyMode = useMotionSafety();
  // Mode selection: 'neck', 'ear', 'hand'
  const [canvasMode, setCanvasMode] = useState<"neck" | "ear" | "hand">("neck");

  // Stacked pieces list state (loaded from local storage or empty)
  const [stackedItems, setStackedItems] = useState<StackedItem[]>([]);
  
  // Drag and UI states
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showSilhouette, setShowSilhouette] = useState(true);
  const [saveConfirmation, setSaveConfirmation] = useState(false);
  const [purchaseConfirmation, setPurchaseConfirmation] = useState(false);

  const canvasRef = useRef<HTMLDivElement | null>(null);

  // Sync state with LocalStorage on init
  useEffect(() => {
    const savedStack = localStorage.getItem(`asteya_stack_${canvasMode}`);
    if (savedStack) {
      try {
        setStackedItems(JSON.parse(savedStack));
      } catch (e) {
        console.warn("ASTEYA Stacker: Failed to parse saved layout.", e);
        setStackedItems([]);
      }
    } else {
      setStackedItems([]);
    }
    setSelectedItemId(null);
  }, [canvasMode]);

  // Save current stack to LocalStorage
  const handleSaveStack = () => {
    localStorage.setItem(`asteya_stack_${canvasMode}`, JSON.stringify(stackedItems));
    setSaveConfirmation(true);
    setTimeout(() => setSaveConfirmation(false), 2000);
  };

  // Clear canvas
  const handleClearCanvas = () => {
    setStackedItems([]);
    localStorage.removeItem(`asteya_stack_${canvasMode}`);
    setSelectedItemId(null);
  };

  // Filter products compatible with active tab
  const getFilteredProducts = () => {
    if (canvasMode === "neck") {
      return products.filter(p => p.category === "necklaces");
    } else if (canvasMode === "ear") {
      return products.filter(p => p.category === "earrings");
    } else {
      // Hand stacking fits rings and bracelets
      return products.filter(p => p.category === "rings" || p.category === "bracelets");
    }
  };

  // Add a product to the canvas at a smart initial position
  const handleAddProductToStack = (product: Product) => {
    let initialX = 50;
    let initialY = 50;
    let initialScale = calculateProportionalScale(product, product.category);

    // Category-specific defaults for perfect alignment
    if (product.category === "necklaces") {
      initialX = 50;
      // Stagger necklaces slightly based on how many are already active
      const neckCount = stackedItems.filter(item => item.product.category === "necklaces").length;
      initialY = 35 + (neckCount * 12); 
    } else if (product.category === "earrings") {
      const earCount = stackedItems.filter(item => item.product.category === "earrings").length;
      // Stagger between left and right lobe
      initialX = earCount % 2 === 0 ? 30 : 70;
      initialY = 50 + (Math.floor(earCount / 2) * 8);
    } else if (product.category === "rings") {
      const ringCount = stackedItems.filter(item => item.product.category === "rings").length;
      initialX = 35 + (ringCount * 10);
      initialY = 40 + (ringCount * 4);
    } else if (product.category === "bracelets") {
      const wristCount = stackedItems.filter(item => item.product.category === "bracelets").length;
      initialX = 50;
      initialY = 70 + (wristCount * 5);
    }

    const newItem: StackedItem = {
      id: `${product.id}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      product,
      x: initialX,
      y: initialY,
      scale: initialScale,
      rotation: 0,
      zIndex: stackedItems.length + 1
    };

    const newStack = [...stackedItems, newItem];
    setStackedItems(newStack);
    setSelectedItemId(newItem.id);
    // Auto-save progress
    localStorage.setItem(`asteya_stack_${canvasMode}`, JSON.stringify(newStack));
  };

  // Pointer event handlers for premium fluid dragging
  const handleItemPointerDown = (itemId: string, e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setSelectedItemId(itemId);
    setIsDragging(true);

    const rect = e.currentTarget.getBoundingClientRect();
    // Keep track of pointer relative offset to target center
    setDragOffset({
      x: e.clientX - (rect.left + rect.width / 2),
      y: e.clientY - (rect.top + rect.height / 2)
    });

    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleItemPointerMove = (itemId: string, e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || selectedItemId !== itemId || !canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();

    // Adjusted coordinates using the drag grip offset
    const adjustedX = e.clientX - dragOffset.x;
    const adjustedY = e.clientY - dragOffset.y;

    // Convert coordinates to percentages of parent canvas
    let px = ((adjustedX - canvasRect.left) / canvasRect.width) * 100;
    let py = ((adjustedY - canvasRect.top) / canvasRect.height) * 100;

    // Bounds safety checks (allow bleeding slightly off-screen for styling)
    px = Math.max(-15, Math.min(115, px));
    py = Math.max(-15, Math.min(115, py));

    setStackedItems(prev =>
      prev.map(item =>
        item.id === itemId
          ? { ...item, x: px, y: py }
          : item
      )
    );
  };

  const handleItemPointerUp = (itemId: string, e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
    
    // Auto-save location layout on drop
    localStorage.setItem(`asteya_stack_${canvasMode}`, JSON.stringify(stackedItems));
  };

  // Selected item manipulation handlers
  const handleUpdateActiveProperty = (property: "scale" | "rotation" | "zIndex", value: number) => {
    if (!selectedItemId) return;
    
    const updated = stackedItems.map(item => {
      if (item.id === selectedItemId) {
        return { ...item, [property]: value };
      }
      return item;
    });

    setStackedItems(updated);
    localStorage.setItem(`asteya_stack_${canvasMode}`, JSON.stringify(updated));
  };

  const handleDeleteSelectedItem = () => {
    if (!selectedItemId) return;
    const updated = stackedItems.filter(item => item.id !== selectedItemId);
    setStackedItems(updated);
    setSelectedItemId(null);
    localStorage.setItem(`asteya_stack_${canvasMode}`, JSON.stringify(updated));
  };

  // Bring selected item forward or backward (z-index manipulation)
  const adjustZIndex = (direction: "up" | "down") => {
    if (!selectedItemId) return;
    const activeItem = stackedItems.find(item => item.id === selectedItemId);
    if (!activeItem) return;

    let newZ = direction === "up" ? activeItem.zIndex + 1 : activeItem.zIndex - 1;
    newZ = Math.max(1, Math.min(15, newZ)); // limit between 1 and 15
    handleUpdateActiveProperty("zIndex", newZ);
  };

  // Financial Ledger calculations
  const calculateTotalNormal = () => {
    return stackedItems.reduce((acc, item) => acc + item.product.price, 0);
  };

  // Apply a 10% Stacking incentive discount if 2 or more pieces are arranged together!
  const hasStackDiscount = stackedItems.length >= 2;
  const discountMultiplier = hasStackDiscount ? 0.90 : 1.0;
  const subtotal = Math.round(calculateTotalNormal() * discountMultiplier);
  const discountSaved = calculateTotalNormal() - subtotal;

  // Add the entire stack to shopping cart!
  const handleAddEntireStackToBag = () => {
    if (stackedItems.length === 0) return;

    stackedItems.forEach(item => {
      onAddToCart(item.product);
    });

    // Award major bonus points for co-creation layering stacks!
    const bonusPoints = hasStackDiscount ? 150 : 50;
    onAddPoints(bonusPoints);

    setPurchaseConfirmation(true);
    setTimeout(() => setPurchaseConfirmation(false), 3000);
  };

  // Currently selected active item helper
  const activeSelectedItem = stackedItems.find(item => item.id === selectedItemId);

  return (
    <div className="max-w-7xl mx-auto px-6 pt-32 pb-24 min-h-screen">
      
      {/* Title Header Section */}
      <div className="text-center max-w-2xl mx-auto mb-16">
        <span className="text-[10px] tracking-[0.4em] text-gold-classic uppercase font-outfit font-semibold mb-3 block">
          CREATIVE ATELIER DESIGN
        </span>
        <h1 className="font-cinzel text-3xl sm:text-5xl tracking-widest text-[#f5f0f5] uppercase font-bold mb-4">
          Atelier Layering Stacker
        </h1>
        <p className="font-cormorant text-gray-300 italic text-md sm:text-lg">
          "The ultimate styling vault. Combine our liquid gold chains, solitaire crowns, and drop quartz earrings. Layer, scale, and rotate onto high-fashion vector silhouettes."
        </p>
      </div>

      {/* 3-Column Studio Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ================= LEFT COLUMN: SELECTOR DRAWER (3 Cols) ================= */}
        <div className="lg:col-span-3 space-y-6">
          <div className="glass-panel p-5 rounded-sm">
            <h3 className="font-cinzel text-xs tracking-[0.2em] text-[#f5f0f5] uppercase font-bold mb-5 border-b border-gold-classic/10 pb-3">
              1. Canvas Studio
            </h3>

            {/* Mode selection tabs */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              {[
                { id: "neck", label: "Collar" },
                { id: "ear", label: "Lobes" },
                { id: "hand", label: "Hand" }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setCanvasMode(tab.id as any)}
                  className={`py-2 px-1 text-[10px] uppercase tracking-widest font-outfit border rounded-sm transition-all cursor-pointer ${
                    canvasMode === tab.id
                      ? "border-gold-classic bg-gold-classic/15 text-gold-classic font-bold shadow-gold-soft"
                      : "border-gold-classic/10 text-gray-400 hover:text-gold-pale hover:border-gold-classic/20"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Sub-label instructions */}
            <div className="flex items-start gap-2.5 bg-gold-classic/5 p-3 rounded-sm border border-gold-classic/10 mb-6">
              <Info className="w-4 h-4 text-gold-classic shrink-0 mt-0.5" />
              <p className="text-[10px] text-gold-pale/80 font-outfit leading-relaxed">
                Click pieces below to mount them on your canvas. Drag to position; adjust layers, rotation, and size on the right panel.
              </p>
            </div>

            {/* Available Jewelry Catalog Filter List */}
            <h4 className="font-cinzel text-[10px] uppercase tracking-[0.25em] text-gray-400 font-bold mb-3">
              Available Fine Pieces
            </h4>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {getFilteredProducts().map(product => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-2 rounded-sm border border-gold-classic/10 hover:border-gold-classic/30 bg-plum-950/30 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded-sm border border-gold-classic/5"
                    />
                    <div className="max-w-[120px] sm:max-w-none">
                      <h5 className="font-cinzel text-[10px] font-semibold text-white tracking-wider line-clamp-1">
                        {product.name}
                      </h5>
                      <span className="font-mono text-[9px] text-gold-classic">
                        ₹{product.price.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddProductToStack(product)}
                    className="p-1.5 rounded-full border border-gold-classic/20 hover:border-gold-classic text-gold-classic hover:bg-gold-classic/15 transition-all cursor-pointer"
                    title="Add to Stack"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {getFilteredProducts().length === 0 && (
                <div className="text-center py-8 text-gray-500 font-cormorant italic text-xs">
                  "No pieces available in this atelier catalog."
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================= CENTER COLUMN: MAJESTIC CANVAS BOARD (6 Cols) ================= */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex justify-between items-center px-2">
            <div className="flex gap-4 text-xs font-outfit uppercase tracking-widest text-gray-400">
              <span className="text-gold-classic font-semibold">Active: {canvasMode === "neck" ? "Neck Collarbone" : canvasMode === "ear" ? "Ear Cartilage" : "Fingers & Hands"}</span>
              <span>•</span>
              <span>{stackedItems.length} Piece{stackedItems.length !== 1 && "s"} Stacked</span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSilhouette(!showSilhouette)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm border text-[9px] uppercase tracking-widest font-outfit transition-all cursor-pointer ${
                  showSilhouette 
                    ? "border-gold-classic/30 bg-gold-classic/5 text-gold-classic"
                    : "border-gold-classic/10 text-gray-400 hover:text-gold-classic"
                }`}
              >
                <Eye className="w-3 h-3" />
                {showSilhouette ? "Hide Contour" : "Show Contour"}
              </button>
              
              <button
                onClick={handleClearCanvas}
                disabled={stackedItems.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-red-950/20 hover:border-red-800/40 text-[9px] uppercase tracking-widest font-outfit text-red-400/90 hover:bg-red-950/20 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <RefreshCw className="w-3 h-3" />
                Reset
              </button>
            </div>
          </div>

          {/* Majestic High-End Canvas Area */}
          <div 
            ref={canvasRef}
            className="w-full aspect-[4/5] sm:h-[580px] sm:aspect-auto bg-viewer-radial border border-gold-classic/20 rounded-sm relative overflow-hidden shadow-gold-soft select-none glass-panel"
            style={{ touchAction: "none" }}
          >
            {/* Visual Grid Accents for design studio look */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(197,160,89,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(197,160,89,0.02)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />
            <div className="absolute top-4 left-4 font-mono text-[8px] text-gold-classic/40 tracking-widest uppercase">
              ASTEYA DESIGN CANVAS V1.0 // {canvasMode.toUpperCase()}_STAGE
            </div>

            {/* Rendering the active vector outline silhouettes */}
            <AnimatePresence mode="wait">
              {showSilhouette && canvasMode === "neck" && (
                <motion.div
                  key="neckSilhouette"
                  initial={safetyMode ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <img 
                    src="/neck_silhouette.png" 
                    alt="Neck Silhouette" 
                    className="w-full h-full object-cover pointer-events-none select-none opacity-75"
                  />
                </motion.div>
              )}

              {showSilhouette && canvasMode === "ear" && (
                <motion.div
                  key="earSilhouette"
                  initial={safetyMode ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <img 
                    src="/ear_silhouette.png" 
                    alt="Ear Silhouette" 
                    className="w-full h-full object-cover pointer-events-none select-none opacity-75"
                  />
                </motion.div>
              )}

              {showSilhouette && canvasMode === "hand" && (
                <motion.div
                  key="handSilhouette"
                  initial={safetyMode ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <img 
                    src="/hand_silhouette.png" 
                    alt="Hand Silhouette" 
                    className="w-full h-full object-cover pointer-events-none select-none opacity-75"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* RENDER ACTIVE STACKED ITEMS */}
            {stackedItems.map(item => {
              const isActive = item.id === selectedItemId;
              // If product has a transparent png tryOnImageUrl, use it. Otherwise use primary standard image
              const imageSrc = item.product.tryOnImageUrl || item.product.images[0];

              return (
                <div
                  key={item.id}
                  style={{
                    position: "absolute",
                    left: `${item.x}%`,
                    top: `${item.y}%`,
                    transform: `translate(-50%, -50%) scale(${item.scale}) rotate(${item.rotation}deg)`,
                    zIndex: item.zIndex,
                    cursor: isDragging && isActive ? "grabbing" : "grab"
                  }}
                  onPointerDown={(e) => handleItemPointerDown(item.id, e)}
                  onPointerMove={(e) => handleItemPointerMove(item.id, e)}
                  onPointerUp={(e) => handleItemPointerUp(item.id, e)}
                  className={`group select-none relative ${
                    item.product.tryOnImageUrl ? "" : "bg-plum-900/10 p-1.5 rounded-sm"
                  }`}
                >
                  {/* Subtle active bounding outline box */}
                  {isActive && (
                    <div className="absolute -inset-3 border border-dashed border-gold-classic/75 rounded-sm animate-pulse pointer-events-none" />
                  )}

                  {/* Gold coordinates label for layout tuning */}
                  {isActive && (
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-plum-950/80 border border-gold-classic/30 text-[7px] text-gold-classic font-mono py-0.5 px-1 rounded-sm tracking-widest whitespace-nowrap pointer-events-none">
                      X: {Math.round(item.x)}% | Y: {Math.round(item.y)}%
                    </div>
                  )}

                  {/* Interactive Jewelry Image Render */}
                  <img
                    src={imageSrc}
                    alt={item.product.name}
                    className={`max-w-[160px] h-auto pointer-events-none select-none select-none transition-shadow ${
                      item.product.category === "necklaces" ? "w-[240px]" : "w-[100px]"
                    } ${
                      isActive ? "drop-shadow-[0_0_15px_rgba(197,160,89,0.5)]" : "drop-shadow-[0_4px_10px_rgba(0,0,0,0.4)]"
                    }`}
                    style={{
                      // For flat jpeg images, let's round them to look like luxurious circular medallions if not transparent!
                      borderRadius: item.product.tryOnImageUrl ? "0%" : "50%",
                      border: item.product.tryOnImageUrl ? "none" : "1px solid rgba(197, 160, 89, 0.2)"
                    }}
                    draggable="false"
                  />
                </div>
              );
            })}

            {stackedItems.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-plum-950/10">
                <Sparkles className="w-10 h-10 text-gold-classic/35 mb-4 animate-pulse" />
                <h4 className="font-cinzel text-xs text-gold-pale tracking-widest uppercase mb-1">Canvas is Idle</h4>
                <p className="font-cormorant italic text-[11px] text-gray-400 max-w-[260px] leading-relaxed">
                  "Arrange your fine curation. Choose pieces from the left portfolio to begin laying."
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ================= RIGHT COLUMN: STYLING PANEL & CHECKOUT (3 Cols) ================= */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Transform Tuning Matrix */}
          <div className="glass-panel p-5 rounded-sm">
            <h3 className="font-cinzel text-xs tracking-[0.2em] text-[#f5f0f5] uppercase font-bold mb-5 border-b border-gold-classic/10 pb-3">
              2. Transformer Studio
            </h3>

            {activeSelectedItem ? (
              <div className="space-y-5 font-outfit text-xs text-gray-300">
                <div className="flex items-center gap-3 bg-gold-classic/5 p-2 rounded-sm border border-gold-classic/10">
                  <img
                    src={activeSelectedItem.product.images[0]}
                    alt={activeSelectedItem.product.name}
                    className="w-10 h-10 object-cover rounded-sm border border-gold-classic/10"
                  />
                  <div>
                    <h4 className="font-cinzel text-[10px] text-white tracking-wider line-clamp-1">
                      {activeSelectedItem.product.name}
                    </h4>
                    <span className="text-[8px] font-mono text-gold-classic uppercase tracking-widest">
                      Instance #{activeSelectedItem.id.split("-")[1]}
                    </span>
                  </div>
                </div>

                {/* Scaling slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px]">
                    <span className="uppercase tracking-widest text-gray-400">Scale factor</span>
                    <span className="font-mono text-gold-classic">{Math.round(activeSelectedItem.scale * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.15"
                    max="1.75"
                    step="0.05"
                    value={activeSelectedItem.scale}
                    onChange={(e) => handleUpdateActiveProperty("scale", parseFloat(e.target.value))}
                    className="w-full accent-gold-classic h-1 bg-plum-900 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Rotation slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px]">
                    <span className="uppercase tracking-widest text-gray-400">Rotate Angle</span>
                    <span className="font-mono text-gold-classic">{activeSelectedItem.rotation}°</span>
                  </div>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    step="5"
                    value={activeSelectedItem.rotation}
                    onChange={(e) => handleUpdateActiveProperty("rotation", parseInt(e.target.value))}
                    className="w-full accent-gold-classic h-1 bg-plum-900 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Layer Depth / Z-Index */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px]">
                    <span className="uppercase tracking-widest text-gray-400">Layer Depth (Z-index)</span>
                    <span className="font-mono text-gold-classic">Layer {activeSelectedItem.zIndex}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => adjustZIndex("down")}
                      className="p-1 rounded-sm border border-gold-classic/20 hover:border-gold-classic text-gold-classic bg-plum-950 cursor-pointer text-[10px]"
                      title="Send Backward"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="range"
                      min="1"
                      max="15"
                      step="1"
                      value={activeSelectedItem.zIndex}
                      onChange={(e) => handleUpdateActiveProperty("zIndex", parseInt(e.target.value))}
                      className="w-full accent-gold-classic h-1 bg-plum-900 rounded-lg appearance-none cursor-pointer"
                    />
                    <button
                      onClick={() => adjustZIndex("up")}
                      className="p-1 rounded-sm border border-gold-classic/20 hover:border-gold-classic text-gold-classic bg-plum-950 cursor-pointer text-[10px]"
                      title="Bring Forward"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Action Row */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleDeleteSelectedItem}
                    className="flex-1 py-2 px-3 border border-red-950/20 hover:border-red-900/40 bg-red-950/10 text-red-400 text-[9px] uppercase tracking-widest font-outfit rounded-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    Discard Piece
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 font-cormorant italic text-gray-400 text-xs">
                "Select any arranged piece on the canvas to open coordinate transforms."
              </div>
            )}
          </div>

          {/* Pricing Ledger & Checkouts */}
          <div className="glass-panel p-5 rounded-sm space-y-6">
            <h3 className="font-cinzel text-xs tracking-[0.2em] text-[#f5f0f5] uppercase font-bold border-b border-gold-classic/10 pb-3">
              3. Stack Ledger
            </h3>

            {/* Simple listed items */}
            <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
              {stackedItems.map(item => (
                <div key={item.id} className="flex justify-between text-[10px] font-outfit text-gray-300">
                  <span className="line-clamp-1 max-w-[150px]">{item.product.name}</span>
                  <span className="font-mono text-gold-pale">₹{item.product.price.toLocaleString("en-IN")}</span>
                </div>
              ))}

              {stackedItems.length === 0 && (
                <div className="text-center py-6 font-cormorant italic text-gray-500 text-xs">
                  "No items on ledger."
                </div>
              )}
            </div>

            {/* Calculations summaries */}
            <div className="space-y-2 border-t border-gold-classic/10 pt-4 font-outfit text-xs">
              <div className="flex justify-between text-gray-400 text-[10px]">
                <span>Original Subtotal</span>
                <span className="font-mono">₹{calculateTotalNormal().toLocaleString("en-IN")}</span>
              </div>
              
              {hasStackDiscount && (
                <div className="flex justify-between text-emerald-400/90 text-[10px] bg-emerald-950/20 py-1 px-1.5 rounded-sm border border-emerald-900/10">
                  <span className="uppercase tracking-widest font-semibold">10% Stack Discount</span>
                  <span className="font-mono">-₹{discountSaved.toLocaleString("en-IN")}</span>
                </div>
              )}

              <div className="flex justify-between text-white font-bold border-t border-gold-classic/5 pt-2.5">
                <span className="uppercase tracking-widest text-[10px]">Stylist Total</span>
                <span className="font-mono text-gold-classic">₹{subtotal.toLocaleString("en-IN")}</span>
              </div>

              {/* Bonus Loyalty Point calculation */}
              <div className="flex items-center gap-1.5 text-gold-pale text-[9px] font-mono tracking-wider uppercase mt-3">
                <Sparkles className="w-3.5 h-3.5 text-gold-classic animate-pulse" />
                <span>Rewards: +{hasStackDiscount ? "150" : "50"} VIP Circle Points</span>
              </div>
            </div>

            {/* Buttons control */}
            <div className="space-y-3 pt-2">
              <button
                onClick={handleAddEntireStackToBag}
                disabled={stackedItems.length === 0}
                className="w-full py-3 bg-gold-gradient text-plum-950 font-outfit font-bold uppercase tracking-widest text-[10px] rounded-sm cursor-pointer hover:shadow-gold-glow transition-all flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                Buy Entire Stack
              </button>

              <button
                onClick={handleSaveStack}
                disabled={stackedItems.length === 0}
                className="w-full py-2.5 border border-gold-classic/30 hover:border-gold-classic text-gold-classic hover:bg-gold-classic/5 font-outfit uppercase tracking-widest text-[9px] rounded-sm cursor-pointer transition-all flex items-center justify-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Save className="w-3.5 h-3.5" />
                Save to Vault
              </button>
            </div>

            {/* Flash action confirmations */}
            <AnimatePresence>
              {saveConfirmation && (
                <motion.div
                  initial={safetyMode ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-gold-classic/10 border border-gold-classic/30 text-gold-classic py-2.5 px-3 rounded-sm text-center text-[10px] font-outfit tracking-widest uppercase flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  Saved to Jewelry Vault
                </motion.div>
              )}

              {purchaseConfirmation && (
                <motion.div
                  initial={safetyMode ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 py-3 px-3 rounded-sm text-center text-[10px] font-outfit tracking-widest uppercase flex flex-col gap-1"
                >
                  <div className="flex items-center justify-center gap-1.5 font-bold">
                    <Check className="w-3.5 h-3.5" />
                    Stack Mounted to Bag!
                  </div>
                  <span className="text-[8px] font-mono text-gold-classic mt-0.5">
                    +{hasStackDiscount ? "150" : "50"} VIP loyalty points credited!
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
}
