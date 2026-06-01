import { useState, useEffect } from "react";
import { Search, SlidersHorizontal, ArrowUpDown, ShieldCheck, Sparkles, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import Header from "./components/Header";
import Hero from "./components/Hero";
import ProductCard from "./components/ProductCard";
import ProductDetailModal from "./components/ProductDetailModal";
import CartDrawer from "./components/CartDrawer";
import WishlistDrawer from "./components/WishlistDrawer";
import AITryOnStudio from "./components/AITryOnStudio";
import AtelierStacker from "./components/AtelierStacker";
import VIPCircle from "./components/VIPCircle";
import AdminDashboard from "./components/AdminDashboard";
import AIAestheticConcierge from "./components/AIAestheticConcierge";
import { checkIsAdmin } from "./lib/admin";


import { Product, CartItem, User } from "./types";

export default function App() {
  // Navigation tabs: 'catalog', 'tryon', 'vip'
  const [activeTab, setActiveTab] = useState<string>("catalog");

  // Main state managers
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  // Cart & Wishlist state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);

  // Auth User Account state
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Drawers & Modals triggering hooks
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeDetailProduct, setActiveDetailProduct] = useState<Product | null>(null);

  // Filters state criteria
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedCollection, setSelectedCollection] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("default");

  // Load from database endpoints and sync localStorage
  useEffect(() => {
    fetchProducts();
    loadPersistedUser();
  }, []);

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const response = await fetch("/api/products");
      const data = await response.json();
      if (data.products) {
        setProducts(data.products);
      } else {
        throw new Error("Invalid product payload returned.");
      }
    } catch (err) {
      console.warn("ASTEYA Core NOTICE: Offline fallback product dataset engaged.", err);
      // Fallback local products so it builds and displays fine even if dev server is restarting!
      const fallbackProducts: Product[] = [
        {
          id: "prod-1",
          name: "Solitaire Amethyst Crown Ring",
          slug: "solitaire-amethyst-crown-ring",
          category: "rings",
          categoryLabel: "Ring Ateliers",
          price: 3450,
          description: "A breathtaking cushion-cut raw natural violet Amethyst, hand-set on an 18-karat filigree royal crown band with double rows of pavé VVS1 flawless diamonds. Handcrafted inside our Parisian atelier.",
          materials: ["18K Recycled Yellow Gold", "3.4ct Royal Amethyst", "0.42ct Flawless White Diamonds"],
          dimensions: "Amethyst face: 10mm x 10mm. Select band width.",
          caratWeight: 3.82,
          images: [
            "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=1200",
            "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&q=80&w=1200"
          ],
          isNew: true,
          isLimited: false,
          collection: "Imperial Aura",
          specifications: {
            "Reference ID": "AST-RG-00104",
            "Metal Purity": "18K Solid Yellow Gold"
          }
        },
        {
          id: "prod-2",
          name: "Celestial Aura Diamond Necklace",
          slug: "celestial-aura-diamond-necklace",
          category: "necklaces",
          categoryLabel: "Neckwear Ateliers",
          price: 8900,
          description: "Suspended from a fluid 18-karat gold liquid cord, this circular pendant features a mesmerizing diamond galaxy swirl surrounding a singular luminous floating marquis teardrop. Reflects cosmic light brilliantly.",
          materials: ["18K Champagne White Gold", "1.85ct F-Color Marquis Diamond", "1.25ct Pavé Diamond Orbit"],
          dimensions: "Pendant Diameter: 22mm.",
          caratWeight: 3.1,
          images: [
            "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=1200",
            "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&q=80&w=1200"
          ],
          isNew: false,
          isLimited: true,
          collection: "Stellar Orbit",
          specifications: {
            "Reference ID": "AST-NC-00452",
            "Metal Purity": "18K Solid Champagne White Gold"
          }
        },
        {
          id: "prod-3",
          name: "Imperial Lotus Gold Cuff",
          slug: "imperial-lotus-gold-cuff",
          category: "bracelets",
          categoryLabel: "Bracelet & Cuff Ateliers",
          price: 12400,
          description: "A heavily sculpted, massive raw gold architectural cuff designed with delicate origami-inspired Lotus petal slits. Inside detailed with warm-champagne satin brushwork.",
          materials: ["Heavy 18K Yellow Gold", "Selected Satin Brush Polish"],
          dimensions: "Cuff Width: 45mm.",
          caratWeight: 0,
          images: [
            "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&q=80&w=1200",
            "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&q=80&w=1200"
          ],
          isNew: true,
          isLimited: true,
          collection: "Dynasty",
          specifications: {
            "Reference ID": "AST-BC-00088",
            "Metal Weight": "74.8 grams of pure Solid 18K Yellow Gold"
          }
        }
      ];
      setProducts(fallbackProducts);
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadPersistedUser = () => {
    const savedCart = localStorage.getItem("asteya_cart");
    const savedWishlist = localStorage.getItem("asteya_wishlist");
    const savedProfile = localStorage.getItem("asteya_user");

    if (savedCart) setCartItems(JSON.parse(savedCart));
    if (savedWishlist) setWishlistItems(JSON.parse(savedWishlist));
    if (savedProfile) {
      setCurrentUser(JSON.parse(savedProfile));
    } else {
      // Default GUEST VIP entry allocation placeholder
      const guestVIP: User = {
        id: "usr-guest",
        name: "Exclusive Guest Finder",
        email: "guest@asteya.com",
        vipTier: "Amethyst Member",
        points: 400,
        memberSince: "May 2026"
      };
      setCurrentUser(guestVIP);
    }
  };

  // Helper sync states to LocalStorage
  const syncCart = (items: CartItem[]) => {
    setCartItems(items);
    localStorage.setItem("asteya_cart", JSON.stringify(items));
  };

  const syncWishlist = (items: Product[]) => {
    setWishlistItems(items);
    localStorage.setItem("asteya_wishlist", JSON.stringify(items));
  };

  // Cart action controllers
  const handleAddToCart = (product: Product, size?: string) => {
    const isAlready = cartItems.findIndex(
      (item) => item.product.id === product.id && item.selectedSize === size
    );

    let updatedCart = [...cartItems];
    if (isAlready > -1) {
      updatedCart[isAlready].quantity += 1;
    } else {
      updatedCart.push({ product, quantity: 1, selectedSize: size });
    }
    syncCart(updatedCart);
    setIsCartOpen(true); // Open drawer instantly on add!
    
    // Auto-increase user points for loyalty!
    if (currentUser) {
      const updatedUser = { ...currentUser, points: currentUser.points + 100 };
      setCurrentUser(updatedUser);
      localStorage.setItem("asteya_user", JSON.stringify(updatedUser));
    }
  };

  const handleAddPoints = (points: number) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, points: currentUser.points + points };
      setCurrentUser(updatedUser);
      localStorage.setItem("asteya_user", JSON.stringify(updatedUser));
    }
  };

  const handleRemoveCartItem = (index: number) => {
    const updated = cartItems.filter((_, idx) => idx !== index);
    syncCart(updated);
  };

  const handleUpdateCartQuantity = (index: number, qty: number) => {
    if (qty <= 0) {
      handleRemoveCartItem(index);
      return;
    }
    let updated = [...cartItems];
    updated[index].quantity = qty;
    syncCart(updated);
  };

  const handleClearCart = () => {
    syncCart([]);
  };

  // Wishlist controls
  const handleToggleWishlist = (product: Product) => {
    const existIdx = wishlistItems.findIndex((item) => item.id === product.id);
    let updated = [...wishlistItems];
    if (existIdx > -1) {
      updated.splice(existIdx, 1);
    } else {
      updated.push(product);
    }
    syncWishlist(updated);
  };

  const handleLogin = (name: string, email: string, avatarUrl?: string, vipTier?: any, points?: number) => {
    const isAdmin = checkIsAdmin(email);
    const newUser: User = {
      id: "usr-active",
      name,
      email,
      vipTier: vipTier || (isAdmin ? "Imperial Crown VIP" : "Golden Circle"),
      points: points !== undefined ? points : (isAdmin ? 9999 : 400),
      memberSince: "May 2026",
      avatarUrl
    };
    setCurrentUser(newUser);
    localStorage.setItem("asteya_user", JSON.stringify(newUser));
  };


  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("asteya_user");
  };

  // Filter Catalog logic
  const filteredProducts = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.materials.some((m) => m.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.collection.toLowerCase().includes(searchQuery.toLowerCase());

    const matchCat = selectedCategory === "all" || p.category === selectedCategory;
    const matchColl = selectedCollection === "all" || p.collection === selectedCollection;

    return matchSearch && matchCat && matchColl;
  });

  // Sort logic criteria
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "priceAsc") return a.price - b.price;
    if (sortBy === "priceDesc") return b.price - a.price;
    if (sortBy === "alphabetical") return a.name.localeCompare(b.name);
    return 0; // default
  });

  return (
    <div className="min-h-screen bg-plum-950 text-[#f7f2f7] font-sans antialiased overflow-x-hidden selection:bg-gold-classic selection:text-plum-950">
      
      {/* GLOBAL NAVBAR HEADER */}
      <Header
        cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)}
        wishlistCount={wishlistItems.length}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenVIP={() => setActiveTab("vip")}
      />

      {/* RENDER ACTIVE TAB VIEW MODULE (Strict separation of concerns) */}
      <main className="relative z-10">
        <AnimatePresence mode="wait">
          {activeTab === "catalog" && (
            <motion.div
              key="catalogTab"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Cinematic introductory banner */}
              <Hero onExplore={() => {
                const galleryNode = document.getElementById("galleryAtelier");
                if (galleryNode) galleryNode.scrollIntoView({ behavior: "smooth" });
              }} />

              {/* PRODUCT GRID & ATELIER PORTFOLIO */}
              <section id="galleryAtelier" className="max-w-7xl mx-auto px-6 py-24 scroll-mt-20">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-12 gap-6 border-b border-gold-classic/10 pb-8">
                  <div>
                    <span className="text-[10px] tracking-[0.4em] text-gold-classic uppercase font-outfit font-semibold block mb-2">
                      ATELIER GALLERY
                    </span>
                    <h2 className="font-cinzel text-2xl sm:text-4xl tracking-widest text-[#f5f0f5] uppercase font-bold">
                      FINE JOAILLERIE COLLECTIONS
                    </h2>
                  </div>

                  {/* Desktop Category navigation lists */}
                  <div className="flex flex-wrap gap-4 font-outfit uppercase tracking-widest text-[10px]">
                    {["all", "rings", "necklaces", "earrings", "bracelets"].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`py-2 px-5 rounded-full border transition-all cursor-pointer ${
                          selectedCategory === cat
                            ? "border-gold-classic bg-gold-classic/15 text-gold-classic font-bold"
                            : "border-gold-classic/10 text-gray-400 hover:text-gold-pale"
                        }`}
                      >
                        {cat === "all" ? "All Ateliers" : cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filter Controls Row */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center mb-8 bg-plum-950/25 p-4 rounded-sm border border-gold-classic/10">
                  {/* Search query input */}
                  <div className="md:col-span-5 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gold-pale/50" />
                    <input
                      type="text"
                      placeholder="Search diamond purity, gold collection, amethysts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-plum-900 border border-gold-classic/10 focus:border-gold-classic/40 p-3 pl-11 text-xs rounded-sm outline-none text-[#f5f0f5] placeholder-gray-500 font-outfit"
                    />
                  </div>

                  {/* Select Collection */}
                  <div className="md:col-span-4 relative flex items-center gap-2">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-gold-classic" />
                    <select
                      value={selectedCollection}
                      onChange={(e) => setSelectedCollection(e.target.value)}
                      className="w-full bg-plum-900 border border-gold-classic/10 p-3 text-xs text-[#f5f0f5] rounded-sm focus:outline-none font-outfit"
                    >
                      <option value="all">Every Atelier Collection</option>
                      <option value="Imperial Aura">Imperial Aura</option>
                      <option value="Stellar Orbit">Stellar Orbit</option>
                      <option value="Elysian Forest">Elysian Forest</option>
                      <option value="Dynasty">Dynasty Collection</option>
                    </select>
                  </div>

                  {/* Sorter selection */}
                  <div className="md:col-span-3 relative flex items-center gap-2">
                    <ArrowUpDown className="w-3.5 h-3.5 text-gold-classic" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full bg-plum-900 border border-gold-classic/10 p-3 text-xs text-[#f5f0f5] rounded-sm focus:outline-none font-outfit"
                    >
                      <option value="default">Default sorting</option>
                      <option value="priceAsc">Price: Velvet Low to High</option>
                      <option value="priceDesc">Price: Velvet High to Low</option>
                      <option value="alphabetical">Alphanumeric Label</option>
                    </select>
                  </div>
                </div>

                {/* Loader / Content Empty / Product Grid Render */}
                {loadingProducts ? (
                  <div className="py-24 flex justify-center items-center">
                    <div className="relative w-16 h-16 border border-gold-classic/20 border-t-gold-classic rounded-full animate-spin" />
                  </div>
                ) : sortedProducts.length === 0 ? (
                  <div className="py-24 text-center space-y-4">
                    <AlertCircle className="w-10 h-10 text-gold-pale/40 mx-auto" />
                    <h4 className="font-cinzel text-md text-gold-pale tracking-widest">No Ateliers Aligned</h4>
                    <p className="font-cormorant italic text-sm text-gray-400">
                      "Adjust your filter bounds to locate available collections."
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {sortedProducts.map((p) => (
                      <ProductCard
                        key={p.id}
                        product={p}
                        isWishlisted={wishlistItems.some((item) => item.id === p.id)}
                        onToggleWishlist={() => handleToggleWishlist(p)}
                        onSelect={() => {
                          setSelectedProduct(p);
                          setActiveDetailProduct(p);
                        }}
                      />
                    ))}
                  </div>
                )}
              </section>
            </motion.div>
          )}

          {activeTab === "tryon" && (
            <motion.div
              key="tryonTab"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AITryOnStudio
                products={products}
                selectedProduct={selectedProduct}
                onSelectProduct={setSelectedProduct}
                onAddToCart={(p) => handleAddToCart(p)}
                onToggleWishlist={(p) => handleToggleWishlist(p)}
                isWishlisted={(p) => wishlistItems.some((item) => item.id === p.id)}
                currentUser={currentUser}
              />
            </motion.div>
          )}

          {activeTab === "concierge" && (
            <motion.div
              key="conciergeTab"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AIAestheticConcierge
                products={products}
                onAddToCart={(p) => handleAddToCart(p)}
                onViewProduct={(p) => setActiveDetailProduct(p)}
                currentUser={currentUser}
              />
            </motion.div>
          )}

          {activeTab === "stacker" && (
            <motion.div
              key="stackerTab"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AtelierStacker
                products={products}
                onAddToCart={handleAddToCart}
                currentUser={currentUser}
                onAddPoints={handleAddPoints}
              />
            </motion.div>
          )}

          {activeTab === "vip" && (
            <motion.div
              key="vipTab"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <VIPCircle
                currentUser={currentUser}
                onLogin={handleLogin}
                onLogout={handleLogout}
              />
            </motion.div>
          )}

          {activeTab === "admin" && (
            <motion.div
              key="adminTab"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {checkIsAdmin(currentUser?.email) ? (
                <AdminDashboard
                  products={products}
                  onRefreshProducts={fetchProducts}
                />
              ) : (
                <div className="max-w-md mx-auto py-32 text-center space-y-6">
                  <AlertCircle className="w-16 h-16 text-red-400 mx-auto animate-pulse" />
                  <h3 className="font-cinzel text-xl text-white tracking-widest uppercase font-bold">ACCESS DECREE DENIED</h3>
                  <p className="font-cormorant text-gray-300 italic text-md leading-relaxed">
                    "Only registered curators and authorized administrators may enter this directory."
                  </p>
                  <button
                    onClick={() => setActiveTab("catalog")}
                    className="py-2.5 px-6 bg-gold-gradient text-plum-950 font-outfit font-bold uppercase tracking-widest text-[10px] rounded-sm cursor-pointer hover:shadow-gold-glow transition-all"
                  >
                    Excurse to Catalog
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* FOOTER - Humbler and classic */}
      <footer className="border-t border-gold-classic/15 bg-plum-950 py-16 relative z-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 font-outfit text-xs text-gray-400">
          <div className="space-y-4">
            <span className="font-cinzel text-xl text-gold-classic tracking-widest">ASTEYA</span>
            <p className="font-cormorant italic text-sm leading-relaxed text-gray-300">
              "The synthesis of geometric perfection, computer-vision landmark alignments, and premium fashion aesthetics."
            </p>
          </div>
          <div>
            <h5 className="font-cinzel text-gold-classic uppercase tracking-wider mb-4 font-semibold">Atelier House</h5>
            <ul className="space-y-2.5">
              <li>Amritsar, India</li>
            </ul>
          </div>
          <div>
            <h5 className="font-cinzel text-gold-classic uppercase tracking-wider mb-4 font-semibold">Atelier Quality</h5>
            <ul className="space-y-2.5">
              <li>Premium Materials Selection</li>
              <li>Custom Design Registry</li>
              <li>Exquisite Handcrafting</li>
              <li>Express Delivery Logistics</li>
            </ul>
          </div>
          <div>
            <h5 className="font-cinzel text-gold-classic uppercase tracking-wider mb-4 font-semibold">AI Integration Channels</h5>
            <p className="font-cormorant italic text-sm leading-relaxed mb-4 text-gray-300">
              "Sign up inside Asteya Circle to preserve custom try-on coordinates."
            </p>
            <div className="text-[10px] font-mono text-gold-classic bg-gold-classic/5 py-1 px-3 border border-gold-classic/20 rounded-sm h-fit w-fit uppercase tracking-widest">
              ATELIER CLOUD SYNC ACTIVE
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 border-t border-gold-classic/5 mt-12 pt-8 text-center text-[10px] text-gray-500 font-mono tracking-widest uppercase">
          © 2026 ASTEYA Premium Fashion Jewelry Paris Ateliers. Powered securely with Google Gemini. Atelier Quality Registered.
        </div>
      </footer>

      {/* RENDER MODAL LAYERS */}
      
      {/* 3D Details and photo Modal popup */}
      {activeDetailProduct && (
        <ProductDetailModal
          product={activeDetailProduct}
          isOpen={!!activeDetailProduct}
          onClose={() => setActiveDetailProduct(null)}
          isWishlisted={wishlistItems.some((item) => item.id === activeDetailProduct.id)}
          onToggleWishlist={() => handleToggleWishlist(activeDetailProduct)}
          onAddToCart={(product, size) => handleAddToCart(product, size)}
          onTryOn={() => {
            setSelectedProduct(activeDetailProduct);
            setActiveDetailProduct(null);
            setActiveTab("tryon"); // redirect directly to studio tryon
          }}
        />
      )}

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onRemoveItem={handleRemoveCartItem}
        onUpdateQuantity={handleUpdateCartQuantity}
        onClearCart={handleClearCart}
        currentUser={currentUser}
      />

      {/* Wishlist Drawer */}
      <WishlistDrawer
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        wishlistItems={wishlistItems}
        onRemoveItem={handleToggleWishlist}
        onAddToCart={(product) => handleAddToCart(product)}
        onViewProduct={(product) => {
          setActiveDetailProduct(product);
          setIsWishlistOpen(false);
        }}
      />
    </div>
  );
}
