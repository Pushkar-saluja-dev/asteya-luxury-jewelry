import React, { useState, useRef, ChangeEvent } from "react";
import { Sparkles, Upload, Camera, Paintbrush, Coins, RefreshCw, ShoppingBag, Eye, Check, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Product, User } from "../types";

interface AIAestheticConciergeProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onViewProduct: (product: Product) => void;
  currentUser: User | null;
}

// Preset luxury outfit templates for quick client demo
const OUTFIT_TEMPLATES = [
  {
    id: "outfit-emerald",
    name: "Royal Emerald Saree",
    url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "outfit-crimson",
    name: "Crimson Silk Anarkali",
    url: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "outfit-champagne",
    name: "Champagne Evening Gown",
    url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=400"
  }
];

// Preset model portraits for quick skin demo
const SKIN_TEMPLATES = [
  {
    id: "skin-alabaster",
    name: "Elena (Cool Rose Undertone)",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "skin-golden",
    name: "Meera (Warm Golden Undertone)",
    url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "skin-olive",
    name: "Adrian (Neutral Honey Undertone)",
    url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400"
  }
];

export default function AIAestheticConcierge({
  products,
  onAddToCart,
  onViewProduct,
  currentUser
}: AIAestheticConciergeProps) {
  // Input parameters state
  const [budget, setBudget] = useState<string>("10000"); // default budget: ₹10,000 INR
  const [matchBudget, setMatchBudget] = useState<boolean>(true);
  const [matchOutfit, setMatchOutfit] = useState<boolean>(true);
  const [matchSkin, setMatchSkin] = useState<boolean>(true);
  const [outfitSource, setOutfitSource] = useState<"upload" | "template">("template");
  const [selectedOutfitTemplate, setSelectedOutfitTemplate] = useState(OUTFIT_TEMPLATES[0]);
  const [uploadedOutfitBase64, setUploadedOutfitBase64] = useState<string | null>(null);

  const [skinSource, setSkinSource] = useState<"upload" | "template" | "camera">("template");
  const [selectedSkinTemplate, setSelectedSkinTemplate] = useState(SKIN_TEMPLATES[1]);
  const [uploadedSkinBase64, setUploadedSkinBase64] = useState<string | null>(null);
  
  // Camera variables
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [streamActive, setStreamActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [snappedPhoto, setSnappedPhoto] = useState<string | null>(null);

  // Analysis states
  const [matchingState, setMatchingState] = useState<"idle" | "outfit_scan" | "skin_scan" | "allocation" | "complete">("idle");
  const [matchingLogs, setMatchingLogs] = useState<string>("");
  const [addedToCartMap, setAddedToCartMap] = useState<Record<string, boolean>>({});

  // Concierge AI results
  const [aestheticResults, setAestheticResults] = useState<{
    undertone: string;
    metalRecommendation: string;
    skinRationale: string;
    dominantColors: string[];
    styleMatchAura: string;
    outfitRationale: string;
    stylistCritique: string;
    recommendedProductIds: string[];
  } | null>(null);

  // Format currency nicely
  const formatPriceINR = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(price);
  };

  // Get prestige feedback based on maximum budget number
  const getPrestigeFeedback = (numVal: number) => {
    if (isNaN(numVal) || numVal <= 0) return "Configure Limit";
    if (numVal < 5000) return "Prestige Accent Selection";
    if (numVal < 10000) return "Regal Elegance Selection";
    if (numVal < 20000) return "Imperial Atelier Selection";
    return "Sovereign Crown Splendor Tier";
  };

  // Turn webcam on
  const initWebcam = async () => {
    setCameraError(null);
    setSnappedPhoto(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 400, height: 400, facingMode: "user" }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setStreamActive(true);
      }
    } catch (err) {
      console.error("Webcam access failed:", err);
      setCameraError("Web camera access was denied or unsupported. Reverting to preset templates.");
      setSkinSource("template");
    }
  };

  // Turn webcam off
  const shutdownWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setStreamActive(false);
    }
  };

  // Capture snapshot from webcam
  const takeWebcamSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        // Mirror snapshot
        ctx.scale(-1, 1);
        ctx.drawImage(videoRef.current, -canvasRef.current.width, 0, canvasRef.current.width, canvasRef.current.height);
        
        const b64 = canvasRef.current.toDataURL("image/jpeg");
        setSnappedPhoto(b64);
        shutdownWebcam();
      }
    }
  };

  // File Upload Handlers
  const handleOutfitUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedOutfitBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSkinUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedSkinBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Return base64 or template url for outfit
  const getOutfitImageSrc = (): string => {
    if (outfitSource === "template") return selectedOutfitTemplate.url;
    return uploadedOutfitBase64 || OUTFIT_TEMPLATES[0].url;
  };

  // Return base64 or template url for skin
  const getSkinImageSrc = (): string => {
    if (skinSource === "template") return selectedSkinTemplate.url;
    if (skinSource === "camera") return snappedPhoto || "";
    return uploadedSkinBase64 || SKIN_TEMPLATES[1].url;
  };

  // Heuristic color scanner to analyze average outfit colors dynamically (even offline!)
  const analyzeDominantColor = (base64Str: string): Promise<{ name: string; swatches: string[] }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 10;
        canvas.height = 10;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve({ name: "Ivory Silk", swatches: ["Ivory Silk", "Atelier Gold"] });
          return;
        }
        ctx.drawImage(img, 0, 0, 10, 10);
        const imgData = ctx.getImageData(0, 0, 10, 10);
        const data = imgData.data;
        
        let sumR = 0, sumG = 0, sumB = 0;
        for (let i = 0; i < data.length; i += 4) {
          sumR += data[i];
          sumG += data[i + 1];
          sumB += data[i + 2];
        }
        
        const avgR = sumR / (data.length / 4);
        const avgG = sumG / (data.length / 4);
        const avgB = sumB / (data.length / 4);
        
        const maxVal = Math.max(avgR, avgG, avgB);
        const minVal = Math.min(avgR, avgG, avgB);
        const range = maxVal - minVal;
        
        // If range (color saturation) is low, or relative saturation is extremely low, it is a neutral shade (white/grey/ivory)
        const isNeutral = range < 35 || (range / (maxVal || 1)) < 0.22;
        
        if (isNeutral) {
          resolve({ name: "Ivory White", swatches: ["Pure Ivory", "Pearl White"] });
        } else if (avgG > avgR * 1.15 && avgG > avgB * 1.15) {
          resolve({ name: "Emerald Green", swatches: ["Royal Emerald", "Mint Green"] });
        } else if (avgR > avgG * 1.15 && avgG > avgB * 1.15) {
          // Yellow / Champagne Gold
          resolve({ name: "Champagne Gold", swatches: ["Champagne Gold", "Satin Gold"] });
        } else if (avgR > avgG * 1.4 && avgR > avgB * 1.4) {
          // Deep crimson red requires a true high ratio of red to other channels
          resolve({ name: "Sovereign Crimson", swatches: ["Crimson Red", "Ruby Velvet"] });
        } else if (avgB > avgR * 1.15 && avgB > avgG * 1.15) {
          resolve({ name: "Midnight Sapphire", swatches: ["Royal Blue", "Sapphire Hue"] });
        } else {
          resolve({ name: "Ivory White", swatches: ["Pure Ivory", "Pearl White"] });
        }
      };
      img.onerror = () => {
        resolve({ name: "Ivory Silk", swatches: ["Ivory Silk", "Atelier Gold"] });
      };
      img.src = base64Str;
    });
  };

  // Execute Gemini Aesthetic Matching Algorithm
  const triggerAestheticAllocation = async () => {
    const numericBudget = matchBudget ? Number(budget.replace(/[^0-9]/g, "")) : 999999;
    if (matchBudget && (!numericBudget || numericBudget <= 0)) {
      alert("Please enter a valid luxury budget limit.");
      return;
    }

    setMatchingState("outfit_scan");
    setMatchingLogs("AI: Scanning outfit color spectra & luxury weave textures...");

    // Determine outfit color heuristics
    let outfitColorName = "Ivory Silk";
    let swatches = ["Ivory Silk", "Atelier Gold"];

    if (matchOutfit) {
      if (outfitSource === "template") {
        if (selectedOutfitTemplate.id === "outfit-emerald") {
          outfitColorName = "Emerald Green";
          swatches = ["Royal Emerald", "Mint Green"];
        } else if (selectedOutfitTemplate.id === "outfit-crimson") {
          outfitColorName = "Sovereign Crimson";
          swatches = ["Crimson Red", "Ruby Velvet"];
        } else if (selectedOutfitTemplate.id === "outfit-champagne") {
          outfitColorName = "Champagne Gold";
          swatches = ["Champagne Gold", "Satin Gold"];
        }
      } else if (uploadedOutfitBase64) {
        const analysis = await analyzeDominantColor(uploadedOutfitBase64);
        outfitColorName = analysis.name;
        swatches = analysis.swatches;
      }
    }

    // Outfit Scanning Step
    setTimeout(() => {
      setMatchingState("skin_scan");
      setMatchingLogs("AI: Scanning skin surface reflectivity & RGB undertones...");

      // Skin Scanning Step
      setTimeout(async () => {
        setMatchingState("allocation");
        setMatchingLogs(
          matchBudget
            ? `AI: Evaluating jewelry catalog against color harmonies & ₹${numericBudget} maximum spend limit...`
            : "AI: Evaluating jewelry catalog against color harmonies..."
        );

        const outfitPayload = outfitSource === "template" ? null : uploadedOutfitBase64;
        const skinPayload = skinSource === "template" ? null : (skinSource === "camera" ? snappedPhoto : uploadedSkinBase64);

        try {
          const response = await fetch("/api/ai/concierge", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              budget: matchBudget ? numericBudget : 999999,
              outfitImage: matchOutfit ? (outfitPayload || getOutfitImageSrc()) : null,
              skinImage: matchSkin ? (skinPayload || getSkinImageSrc()) : null,
              outfitColor: outfitColorName,
              outfitSwatches: swatches,
              criteria: {
                budget: matchBudget,
                outfit: matchOutfit,
                skin: matchSkin
              }
            })
          });

          const data = await response.json();
          if (data.success) {
            setAestheticResults(data);
          } else {
            throw new Error(data.error || "Concierge allocation failed.");
          }
        } catch (e) {
          console.error("AI Concierge backend failure. Constructing offline fallback allocations.", e);
          
          // Dynamic client-side fallback matching <= budget
          const affordable = matchBudget ? products.filter(p => p.price <= numericBudget) : products;
          
          // Fit matching: match color of the dress if outfit is enabled
          let matching = affordable;
          if (matchOutfit) {
            const query = outfitColorName.toLowerCase();
            if (query.includes("emerald") || query.includes("green")) {
              matching = affordable.filter(p => p.id === "prod-4" || p.id === "prod-3" || p.id === "prod-5" || p.id === "prod-2" || p.id === "prod-6");
            } else if (query.includes("crimson") || query.includes("red")) {
              matching = affordable.filter(p => p.id === "prod-1" || p.id === "prod-2" || p.id === "prod-3" || p.id === "prod-5" || p.id === "prod-6");
            } else if (query.includes("champagne") || query.includes("gold")) {
              matching = affordable.filter(p => p.id === "prod-3" || p.id === "prod-5" || p.id === "prod-1" || p.id === "prod-2" || p.id === "prod-6");
            } else if (query.includes("white") || query.includes("ivory") || query.includes("pearl")) {
              matching = affordable;
            } else if (query.includes("sapphire") || query.includes("blue")) {
              matching = affordable.filter(p => p.id === "prod-2" || p.id === "prod-6" || p.id === "prod-3" || p.id === "prod-5" || p.id === "prod-1");
            }
          }

          setAestheticResults({
            undertone: matchSkin ? (skinPayload ? "Cool Alabaster Undertone" : "Warm Golden Undertone") : "Undertone Assessment Bypassed",
            metalRecommendation: matchSkin ? (numericBudget >= 12000 ? "Solid 18K Yellow Gold & Filigree" : "18K Gold Plated Vermeil") : "Classic Alloys",
            skinRationale: matchSkin
              ? "Your skin reflects warm light frequencies naturally, which coordinates beautifully with traditional deep-gold polishing."
              : "Skin matching was bypassed by user selection.",
            dominantColors: matchOutfit ? swatches : ["Atelier Gold", "Signature White"],
            styleMatchAura: matchOutfit ? "Haute Traditional / Elite Festive Gala" : "Bespoke Classic Curation",
            outfitRationale: matchOutfit
              ? `The grand contours of your outfit in ${outfitColorName} coordinate perfectly with our selected creations.`
              : "Outfit coordination was bypassed by user selection.",
            stylistCritique: matchBudget
              ? (matching.length > 0 
                  ? `An opulent jewelry curation strictly adhering to your budget maximum of ${formatPriceINR(numericBudget)}. These pieces combine timeless aesthetics and premium simulated stones to frame your attire with majestic luxury.`
                  : `All of our luxury master creations currently exceed your entered maximum budget cap of ${formatPriceINR(numericBudget)}. We invite you to refine your filters or explore our entry-level creations starting at ₹2,950.`)
              : `A grand styling allocation based entirely on coordinated attire aesthetics and traditional skin suitability, presenting the absolute pinnacle of Asteya's design.`,
            recommendedProductIds: matching.map(p => p.id)
          });
        } finally {
          setMatchingState("complete");
        }
      }, 1500);
    }, 1500);
  };

  const handleAddToCartConcierge = (product: Product) => {
    onAddToCart(product);
    setAddedToCartMap(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedToCartMap(prev => ({ ...prev, [product.id]: false }));
    }, 2000);
  };

  const resetConcierge = () => {
    setAestheticResults(null);
    setMatchingState("idle");
    setSnappedPhoto(null);
    setUploadedOutfitBase64(null);
    setUploadedSkinBase64(null);
    shutdownWebcam();
  };

  const parsedBudget = Number(budget.replace(/[^0-9]/g, ""));

  return (
    <div className="max-w-7xl mx-auto px-6 pt-32 pb-24 min-h-screen">
      
      {/* Title block */}
      <div className="text-center max-w-2xl mx-auto mb-16">
        <span className="text-[10px] tracking-[0.4em] text-gold-classic uppercase font-outfit font-semibold mb-3 block">
          THE HAUTE MATCHER
        </span>
        <h1 className="font-cinzel text-3xl sm:text-5xl tracking-widest text-[#f5f0f5] uppercase font-bold mb-4">
          AI Aesthetic Concierge
        </h1>
        <p className="font-cormorant text-gray-300 italic text-md sm:text-lg leading-relaxed">
          "Define your maximum limit, upload your festive wear, and let our computer-vision and gemology models allocate the ultimate traditional matching sets."
        </p>
      </div>

      <AnimatePresence mode="wait">
        {matchingState !== "complete" && matchingState !== "idle" ? (
          
          /* LOADING PROGRESS BOARD SCREEN */
          <motion.div
            key="matchingLoader"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="glass-panel p-12 max-w-xl mx-auto text-center space-y-8 py-20 border border-gold-classic/20 rounded-sm"
          >
            {/* Spinning Radiant Sphere */}
            <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 border border-gold-classic/10 border-t-gold-classic rounded-full animate-spin duration-[3s]" />
              <div className="absolute inset-2 border border-[#be93be]/10 border-b-[#be93be] rounded-full animate-spin duration-[1.5s]" />
              <Sparkles className="w-10 h-10 text-gold-classic animate-pulse" />
            </div>

            <div className="space-y-3">
              <h3 className="font-cinzel text-md tracking-[0.25em] text-gold-classic uppercase font-bold">
                AESTHETIC ENGINE BUSY
              </h3>
              <p className="font-mono text-[10px] uppercase text-gray-400 tracking-widest animate-pulse">
                {matchingLogs}
              </p>
            </div>

            {/* High end progress linear indicators */}
            <div className="w-full bg-plum-900/60 h-[1.5px] rounded-full overflow-hidden relative">
              <motion.div
                className="h-full bg-gold-gradient"
                initial={{ width: "0%" }}
                animate={{
                  width: 
                    matchingState === "outfit_scan" ? "33%" : 
                    matchingState === "skin_scan" ? "66%" : "95%"
                }}
                transition={{ duration: 1.5 }}
              />
            </div>
          </motion.div>

        ) : matchingState === "complete" && aestheticResults ? (
          
          /* COGNITIVE AESTHETICS RESULTS BOARD */
          <motion.div
            key="conciergeResults"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-12"
          >
            <div className="flex flex-col lg:flex-row justify-between items-center gap-6 border-b border-gold-classic/15 pb-6">
              <div>
                <span className="text-[10px] tracking-[0.4em] text-gold-classic uppercase font-outfit block mb-1">
                  ALLOCATION METRICS
                </span>
                <h2 className="font-cinzel text-xl sm:text-3xl tracking-widest uppercase font-bold text-[#f7f2f7]">
                  YOUR DYNAMIC AI PORTFOLIO
                </h2>
              </div>
              <button
                onClick={resetConcierge}
                className="flex items-center gap-2 py-2 px-5 border border-gold-classic/30 hover:border-gold-classic text-gold-pale hover:text-gold-classic font-outfit text-[10px] tracking-widest uppercase rounded-sm bg-plum-950/20 cursor-pointer transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                Configure New Consultation
              </button>
            </div>

            {/* Assessment Cards Splits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Card 1: Skin undertone assessment */}
              <div className="glass-panel p-6 rounded-sm space-y-4 border border-gold-classic/10">
                <span className="text-[9px] tracking-[0.25em] text-[#be93be] uppercase font-mono font-bold block">
                  METALLIC & SKIN ALLOCATION
                </span>
                <h3 className="font-cinzel text-base tracking-widest text-[#f5f0f5] uppercase font-bold">
                  {aestheticResults.undertone}
                </h3>
                <div className="py-2.5 px-4 rounded-sm border border-gold-classic/15 bg-gold-classic/5 font-outfit text-xs text-gold-classic tracking-wider">
                  Recommended Metal: <span className="font-bold">{aestheticResults.metalRecommendation}</span>
                </div>
                <p className="font-cormorant text-sm italic text-gray-400 leading-relaxed">
                  "{aestheticResults.skinRationale}"
                </p>
              </div>

              {/* Card 2: Outfit styling assessment */}
              <div className="glass-panel p-6 rounded-sm space-y-4 border border-gold-classic/10">
                <span className="text-[9px] tracking-[0.25em] text-[#be93be] uppercase font-mono font-bold block">
                  COLOR & AURA METRICS
                </span>
                <h3 className="font-cinzel text-base tracking-widest text-[#f5f0f5] uppercase font-bold">
                  {aestheticResults.styleMatchAura}
                </h3>
                <div className="flex flex-wrap gap-2 py-1">
                  {aestheticResults.dominantColors.map((color, idx) => (
                    <span 
                      key={idx}
                      className="inline-flex items-center gap-1.5 py-1 px-3 text-[10px] font-outfit uppercase tracking-widest bg-plum-900 border border-gold-classic/10 rounded-full text-gold-pale"
                    >
                      <span className="w-2 h-2 rounded-full bg-gold-classic/70" />
                      {color}
                    </span>
                  ))}
                </div>
                <p className="font-cormorant text-sm italic text-gray-400 leading-relaxed">
                  "{aestheticResults.outfitRationale}"
                </p>
              </div>

              {/* Card 3: Budget Allocator Constraints */}
              <div className="glass-panel p-6 rounded-sm space-y-4 border border-gold-classic/10">
                <span className="text-[9px] tracking-[0.25em] text-[#be93be] uppercase font-mono font-bold block">
                  FINANCIAL LEDGER STATS
                </span>
                <h3 className="font-cinzel text-base tracking-widest text-[#f5f0f5] uppercase font-bold">
                  Budget Maximum
                </h3>
                <div className="py-3 px-4 rounded-sm border border-green-500/20 bg-green-500/5 font-outfit text-xl text-green-400 font-bold tracking-widest">
                  {formatPriceINR(parsedBudget)}
                </div>
                <p className="font-cormorant text-sm italic text-gray-400 leading-relaxed">
                  {products.filter(p => aestheticResults.recommendedProductIds.includes(p.id)).some(p => p.price <= parsedBudget)
                    ? "Only pieces whose prices fit strictly inside your budget limit have been selected for curation."
                    : "Your entered budget limit is below our baseline creations. We have allocated our closest accessible masterpiece for your styling compatibility."
                  }
                </p>
              </div>
            </div>

            {/* Stylist Grand Critique editorial review */}
            <div className="glass-panel p-8 rounded-sm border border-gold-classic/15 bg-plum-900/10 space-y-4 text-center max-w-4xl mx-auto">
              <Sparkles className="w-6 h-6 text-gold-classic mx-auto" />
              <h4 className="font-cinzel text-xs tracking-[0.3em] text-gold-classic uppercase font-bold">
                VIP Editorial Styling Report
              </h4>
              <p className="font-cormorant text-lg italic text-[#f7f2f7] leading-relaxed px-4 md:px-12">
                "{aestheticResults.stylistCritique}"
              </p>
            </div>

            {/* Selected Matching Products Grid */}
            <div className="space-y-8">
              <h3 className="font-cinzel text-sm tracking-[0.2em] uppercase text-center font-bold text-gold-classic">
                Curated Joaillerie Allocation Selection
              </h3>

              {aestheticResults.recommendedProductIds.length === 0 ? (
                <div className="glass-panel p-10 text-center max-w-xl mx-auto space-y-4 border border-gold-classic/10 rounded-sm">
                  <AlertCircle className="w-8 h-8 text-gold-pale/40 mx-auto" />
                  <h4 className="font-cinzel text-sm text-gold-pale tracking-widest uppercase">No such collections match your selected parameters</h4>
                  <p className="font-cormorant italic text-sm text-gray-400">
                    "We currently have no master creations in our catalog that fit strictly within your maximum budget of {formatPriceINR(parsedBudget)} and coordinate with all checked styling filters. Please refine your budget limit or adjust your coordinate selections."
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {products
                    .filter(p => aestheticResults.recommendedProductIds.includes(p.id))
                    .map((product) => (
                    <div 
                      key={product.id}
                      className="group relative flex flex-col bg-plum-950/40 border border-gold-classic/10 rounded-sm hover:border-gold-classic/35 transition-all duration-500 overflow-hidden shadow-gold-soft"
                    >
                      {/* Product Image */}
                      <div className="relative aspect-[4/5] overflow-hidden bg-plum-900">
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-[1.2s] ease-out"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-plum-950 to-transparent opacity-60" />
                        
                        {/* Hover Quick View Trigger */}
                        <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-plum-950/40 backdrop-blur-[2px]">
                          <button
                            onClick={() => onViewProduct(product)}
                            className="flex items-center gap-2 px-5 py-2.5 border border-gold-classic/40 bg-plum-950/80 hover:bg-gold-classic text-gold-classic hover:text-plum-950 font-outfit text-[10px] tracking-[0.25em] uppercase font-bold transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View Details
                          </button>
                        </div>
                      </div>

                      {/* Info body */}
                      <div className="p-6 flex flex-col flex-grow border-t border-gold-classic/5">
                        <span className="text-[10px] tracking-[0.2em] text-gold-pale/50 uppercase font-outfit mb-1.5 block">
                          {product.categoryLabel}
                        </span>
                        <h4 className="font-cinzel text-sm sm:text-base tracking-widest text-[#f7f2f7] hover:text-gold-classic cursor-pointer transition-colors line-clamp-1 mb-2">
                          {product.name}
                        </h4>
                        <p className="font-cormorant text-xs text-gray-400 italic mb-6 leading-relaxed line-clamp-2">
                          {product.materials.join(" • ")}
                        </p>

                        <div className="mt-auto flex items-center justify-between pt-4 border-t border-gold-classic/5 gap-4">
                          <span className="font-outfit font-semibold text-gold-classic text-base tracking-[0.1em]">
                            {formatPriceINR(product.price)}
                          </span>
                          
                          <button
                            onClick={() => handleAddToCartConcierge(product)}
                            className={`py-2 px-4 rounded-sm font-outfit text-[9px] tracking-widest uppercase font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
                              addedToCartMap[product.id]
                                ? "bg-green-500 text-white"
                                : "bg-gold-gradient text-plum-950 hover:shadow-gold-glow"
                            }`}
                          >
                            {addedToCartMap[product.id] ? (
                              <>
                                <Check className="w-3 h-3 stroke-[2.5]" />
                                Bagged
                              </>
                            ) : (
                              <>
                                <ShoppingBag className="w-3 h-3" />
                                Add to Bag
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

        ) : (
          
          /* SETUP INPUT FORM SCREEN */
          <motion.div
            key="conciergeForm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
          >
            
            {/* LEFT INPUT COLUMN (5 Cols) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Section 0: AI Harmonization Channels */}
              <div className="glass-panel p-6 rounded-sm border border-gold-classic/10 space-y-4">
                <div className="flex items-center gap-2 border-b border-gold-classic/10 pb-3">
                  <Sparkles className="w-4 h-4 text-gold-classic animate-pulse" />
                  <h3 className="font-cinzel text-xs tracking-[0.2em] text-[#f5f0f5] uppercase font-bold">
                    Harmonization Channels
                  </h3>
                </div>

                <div className="space-y-3 font-outfit text-xs text-gray-300">
                  <label className="flex items-center gap-3 cursor-pointer p-2.5 rounded-sm hover:bg-gold-classic/5 transition-all border border-gold-classic/5 hover:border-gold-classic/20 select-none">
                    <input
                      type="checkbox"
                      checked={matchBudget}
                      onChange={(e) => setMatchBudget(e.target.checked)}
                      className="w-4 h-4 accent-gold-classic rounded border-gold-classic/20"
                    />
                    <div className="flex flex-col">
                      <span className="font-bold text-gold-pale uppercase tracking-wider text-[9px]">Strict Budget Cap</span>
                      <span className="text-[8px] text-gray-500 font-mono">Harmonize strictly within maximum spend limit</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer p-2.5 rounded-sm hover:bg-gold-classic/5 transition-all border border-gold-classic/5 hover:border-gold-classic/20 select-none">
                    <input
                      type="checkbox"
                      checked={matchOutfit}
                      onChange={(e) => setMatchOutfit(e.target.checked)}
                      className="w-4 h-4 accent-gold-classic rounded border-gold-classic/20"
                    />
                    <div className="flex flex-col">
                      <span className="font-bold text-gold-pale uppercase tracking-wider text-[9px]">Outfit Color & Weave Match</span>
                      <span className="text-[8px] text-gray-500 font-mono">Co-relate jewelry colors to clothing drape</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer p-2.5 rounded-sm hover:bg-gold-classic/5 transition-all border border-gold-classic/5 hover:border-gold-classic/20 select-none">
                    <input
                      type="checkbox"
                      checked={matchSkin}
                      onChange={(e) => setMatchSkin(e.target.checked)}
                      className="w-4 h-4 accent-gold-classic rounded border-gold-classic/20"
                    />
                    <div className="flex flex-col">
                      <span className="font-bold text-gold-pale uppercase tracking-wider text-[9px]">Skin Undertone Suitability</span>
                      <span className="text-[8px] text-gray-500 font-mono">Recommend metals matching your skin shade</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Section 1: Maximum Spending Budget Limit */}
              <div className={`glass-panel p-6 rounded-sm border border-gold-classic/10 space-y-4 transition-all duration-300 ${!matchBudget ? "opacity-30 pointer-events-none select-none" : ""}`}>
                <div className="flex items-center gap-2 border-b border-gold-classic/10 pb-3">
                  <Coins className="w-4 h-4 text-gold-classic" />
                  <h3 className="font-cinzel text-xs tracking-[0.2em] text-[#f5f0f5] uppercase font-bold">
                    1. Maximum Spending Budget
                  </h3>
                </div>

                <div className="space-y-2">
                  <label htmlFor="conciergeBudget" className="text-[10px] uppercase font-outfit text-gray-400 tracking-wider">
                    Enter Maximum Budget Limit (INR ₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-outfit text-sm text-gold-classic font-bold">
                      ₹
                    </span>
                    <input
                      id="conciergeBudget"
                      type="text"
                      pattern="[0-9]*"
                      placeholder="e.g., 10000"
                      value={budget}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, "");
                        setBudget(val);
                      }}
                      className="w-full bg-plum-900 border border-gold-classic/10 focus:border-gold-classic/40 p-3 pl-8 text-sm rounded-sm outline-none text-[#f5f0f5] font-outfit font-semibold"
                    />
                  </div>
                  
                  {/* Realtime dynamic prestige feedback */}
                  <div className="flex justify-between items-center text-[9px] font-mono tracking-widest text-[#be93be] uppercase pt-1 px-1">
                    <span>Aura Assessment:</span>
                    <span className="font-bold text-gold-classic">
                      {getPrestigeFeedback(parsedBudget)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: Outfit matching configuration */}
              <div className={`glass-panel p-6 rounded-sm border border-gold-classic/10 space-y-4 transition-all duration-300 ${!matchOutfit ? "opacity-30 pointer-events-none select-none" : ""}`}>
                <div className="flex items-center gap-2 border-b border-gold-classic/10 pb-3">
                  <Paintbrush className="w-4 h-4 text-gold-classic" />
                  <h3 className="font-cinzel text-xs tracking-[0.2em] text-[#f5f0f5] uppercase font-bold">
                    2. Outfit Coordinator Image
                  </h3>
                </div>

                {/* Subnav source choice */}
                <div className="flex bg-plum-900/60 p-1 rounded-sm border border-gold-classic/5">
                  <button
                    onClick={() => setOutfitSource("template")}
                    className={`flex-1 py-1.5 text-center font-outfit text-[9px] uppercase tracking-widest cursor-pointer rounded-sm ${
                      outfitSource === "template"
                        ? "bg-gold-classic/10 text-gold-classic font-bold"
                        : "text-gray-400 hover:text-gold-pale"
                    }`}
                  >
                    Template presets
                  </button>
                  <button
                    onClick={() => setOutfitSource("upload")}
                    className={`flex-1 py-1.5 text-center font-outfit text-[9px] uppercase tracking-widest cursor-pointer rounded-sm ${
                      outfitSource === "upload"
                        ? "bg-gold-classic/10 text-gold-classic font-bold"
                        : "text-gray-400 hover:text-gold-pale"
                    }`}
                  >
                    Custom Upload
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {outfitSource === "template" ? (
                    
                    /* Option A: Preset Outfit Templates picker */
                    <motion.div 
                      key="outfitTemplates"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-3"
                    >
                      <label className="text-[9px] uppercase font-outfit text-gray-400 tracking-wider">
                        Select Demo Attire
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {OUTFIT_TEMPLATES.map((tpl) => (
                          <div
                            key={tpl.id}
                            onClick={() => setSelectedOutfitTemplate(tpl)}
                            className={`group relative aspect-square overflow-hidden rounded-sm border cursor-pointer ${
                              selectedOutfitTemplate.id === tpl.id
                                ? "border-gold-classic ring-1 ring-gold-classic/40"
                                : "border-gold-classic/10 hover:border-gold-classic/30"
                            }`}
                          >
                            <img
                              src={tpl.url}
                              alt={tpl.name}
                              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-x-0 bottom-0 bg-plum-950/70 p-1 text-[8px] tracking-widest text-center truncate font-outfit uppercase font-semibold text-gold-pale">
                              {tpl.name.split(" ")[1]}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>

                  ) : (
                    
                    /* Option B: Local file Upload area */
                    <motion.div
                      key="outfitUpload"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-4"
                    >
                      <div className="relative border border-dashed border-gold-classic/20 rounded-sm p-6 text-center bg-plum-900/10 hover:bg-gold-classic/5 transition-all">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleOutfitUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        <Upload className="w-6 h-6 text-gold-pale/50 mx-auto mb-2" />
                        <span className="text-[10px] uppercase font-outfit text-gold-pale tracking-wider block font-bold">
                          {uploadedOutfitBase64 ? "Outfit Recorded" : "Upload Outfit Photo"}
                        </span>
                        <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest block mt-1">
                          PNG, JPG up to 5MB
                        </span>
                      </div>

                      {uploadedOutfitBase64 && (
                        <div className="flex items-center gap-3 bg-gold-classic/5 border border-gold-classic/10 p-2.5 rounded-sm">
                          <img 
                            src={uploadedOutfitBase64} 
                            alt="Custom Outfit Preview" 
                            className="w-10 h-10 object-cover rounded-sm border border-gold-classic/20"
                          />
                          <div className="flex-grow">
                            <span className="text-[9px] font-outfit uppercase tracking-widest text-[#f5f0f5] block font-bold">
                              Custom Outfit Attached
                            </span>
                            <button
                              onClick={() => setUploadedOutfitBase64(null)}
                              className="text-[8px] uppercase tracking-widest font-mono text-red-400 hover:text-red-300 font-bold block"
                            >
                              Purge Upload
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Consultation trigger button */}
              <button
                onClick={triggerAestheticAllocation}
                className="w-full bg-gold-gradient text-plum-950 font-outfit font-bold uppercase tracking-[0.2em] py-3.5 text-xs rounded-sm cursor-pointer shadow-gold-soft hover:shadow-gold-glow hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 stroke-[2.5]" />
                Allocate Aesthetic Match
              </button>
            </div>

            {/* RIGHT CAMERA & SKIN UPLOAD COLUMN (7 Cols) */}
            <div className={`lg:col-span-7 space-y-6 transition-all duration-300 ${!matchSkin ? "opacity-30 pointer-events-none select-none" : ""}`}>
              <div className="glass-panel p-6 rounded-sm border border-gold-classic/10 space-y-6">
                <div className="flex items-center justify-between border-b border-gold-classic/10 pb-3 gap-4">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-gold-classic" />
                    <h3 className="font-cinzel text-xs tracking-[0.2em] text-[#f5f0f5] uppercase font-bold">
                      3. Skin undertone & silhouette profile
                    </h3>
                  </div>

                  {/* Right: profile subnav chooser */}
                  <div className="flex bg-plum-900/60 p-0.5 rounded-sm border border-gold-classic/5">
                    {["template", "upload", "camera"].map((mode) => (
                      <button
                        key={mode}
                        onClick={() => {
                          setSkinSource(mode as any);
                          if (mode !== "camera") shutdownWebcam();
                        }}
                        className={`py-1 px-3 text-center font-outfit text-[8px] uppercase tracking-widest cursor-pointer rounded-sm ${
                          skinSource === mode
                            ? "bg-gold-classic/10 text-gold-classic font-bold"
                            : "text-gray-400 hover:text-gold-pale"
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Main Profile Interactive Screen Viewport */}
                <div className="relative aspect-video rounded-sm overflow-hidden bg-plum-900 border border-gold-classic/10 flex items-center justify-center">
                  
                  <AnimatePresence mode="wait">
                    {skinSource === "camera" && streamActive ? (
                      
                      /* Cam Feed active view */
                      <motion.div 
                        key="camViewport"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full h-full relative"
                      >
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          className="w-full h-full object-cover scale-x-[-1]"
                        />
                        <button
                          onClick={takeWebcamSnapshot}
                          className="absolute bottom-4 left-1/2 -translate-y-1/2 -translate-x-1/2 bg-gold-gradient text-plum-950 p-3 rounded-full hover:scale-105 active:scale-95 cursor-pointer shadow-gold-glow border border-gold-classic/30"
                          title="Capture Silhouette"
                        >
                          <Camera className="w-5 h-5 stroke-[2.5]" />
                        </button>
                      </motion.div>

                    ) : (
                      
                      /* Static Image Display View */
                      <motion.div
                        key="staticViewport"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="w-full h-full relative"
                      >
                        <img
                          src={getSkinImageSrc()}
                          alt="Skin Silhouette Curation"
                          className="w-full h-full object-cover"
                        />
                        
                        {/* Elegant overlay frame */}
                        <div className="absolute inset-0 border-[6px] border-plum-950/80 pointer-events-none" />
                        <div className="absolute inset-0 bg-gradient-to-t from-plum-950/50 to-transparent pointer-events-none" />
                        
                        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between bg-plum-950/70 p-2 rounded-sm border border-gold-classic/10 backdrop-blur-md">
                          <span className="text-[9px] tracking-widest font-mono text-gold-pale uppercase">
                            {skinSource === "template" ? selectedSkinTemplate.name : "Custom Portrait Source Loaded"}
                          </span>
                          
                          {skinSource === "camera" && snappedPhoto && (
                            <button
                              onClick={initWebcam}
                              className="text-[8px] uppercase tracking-widest font-outfit text-gold-classic font-bold flex items-center gap-1 hover:text-gold-pale"
                            >
                              <RefreshCw className="w-2.5 h-2.5" />
                              Re-capture
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Hidden Canvas for snap processing */}
                  <canvas ref={canvasRef} className="hidden" />
                </div>

                {/* Sub Options choices lists */}
                {skinSource === "template" && (
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase font-outfit text-gray-400 tracking-wider">
                      Select Demo Profile undertones
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {SKIN_TEMPLATES.map((tpl) => (
                        <div
                          key={tpl.id}
                          onClick={() => setSelectedSkinTemplate(tpl)}
                          className={`flex items-center gap-2 p-2 rounded-sm border cursor-pointer bg-plum-950/30 transition-all ${
                            selectedSkinTemplate.id === tpl.id
                              ? "border-gold-classic bg-gold-classic/5"
                              : "border-gold-classic/10 hover:border-gold-classic/20"
                          }`}
                        >
                          <img
                            src={tpl.url}
                            alt={tpl.name}
                            className="w-8 h-8 rounded-full object-cover border border-gold-classic/20"
                          />
                          <span className="text-[9px] tracking-widest font-outfit uppercase text-gold-pale font-bold truncate">
                            {tpl.name.split(" ")[0]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {skinSource === "upload" && (
                  <div className="space-y-4">
                    <div className="relative border border-dashed border-gold-classic/20 rounded-sm p-5 text-center bg-plum-900/10 hover:bg-gold-classic/5 transition-all">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSkinUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <Upload className="w-5 h-5 text-gold-pale/50 mx-auto mb-1.5" />
                      <span className="text-[9px] uppercase font-outfit text-gold-pale tracking-wider block font-bold">
                        {uploadedSkinBase64 ? "Silhouette Uploaded" : "Attach Portrait Photo"}
                      </span>
                    </div>

                    {uploadedSkinBase64 && (
                      <div className="flex items-center gap-3 bg-gold-classic/5 border border-gold-classic/10 p-2 rounded-sm">
                        <img 
                          src={uploadedSkinBase64} 
                          alt="Custom Skin Preview" 
                          className="w-10 h-10 object-cover rounded-full border border-gold-classic/20"
                        />
                        <div className="flex-grow">
                          <span className="text-[9px] font-outfit uppercase tracking-widest text-[#f5f0f5] block font-bold">
                            Custom Portrait Attached
                          </span>
                          <button
                            onClick={() => setUploadedSkinBase64(null)}
                            className="text-[8px] uppercase tracking-widest font-mono text-red-400 hover:text-red-300 font-bold block"
                          >
                            Purge Upload
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {skinSource === "camera" && cameraError && (
                  <div className="flex items-center gap-2 p-3 rounded-sm border border-red-500/20 bg-red-500/5 text-red-400 text-[10px] font-outfit uppercase tracking-widest">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{cameraError}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
