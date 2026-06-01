import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
import { PNG } from "pngjs";
import nodemailer from "nodemailer";

dotenv.config();

// Startup sequence to extract and refine the heart earring try-on image
try {
  const originalPath = path.join(process.cwd(), "ear_original.png");
  const heartPath = path.join(process.cwd(), "ear_tryon_heart.png");
  
  if (fs.existsSync(originalPath)) {
    console.log("ASTEYA Startup: Extracting flawless transparent heart earring try-on asset...");
    const buffer = fs.readFileSync(originalPath);
    const png = PNG.sync.read(buffer);
    
    const xmin = 535;
    const xmax = 845;
    const ymin = 435;
    const ymax = 745;
    
    const cropW = xmax - xmin;
    const cropH = ymax - ymin;
    
    const outPng = new PNG({
      width: cropW,
      height: cropH,
      colorType: 6
    });
    
    for (let y = 0; y < cropH; y++) {
      for (let x = 0; x < cropW; x++) {
        const srcX = xmin + x;
        const srcY = ymin + y;
        const srcIdx = (png.width * srcY + srcX) << 2;
        
        const r = png.data[srcIdx];
        const g = png.data[srcIdx + 1];
        const b = png.data[srcIdx + 2];
        const a = png.data[srcIdx + 3];
        
        const outIdx = (cropW * y + x) << 2;
        
        const distToBg = Math.sqrt((r - 22) ** 2 + (g - 9) ** 2 + (b - 25) ** 2);
        const isVeryDarkBg = r < 35 && g < 20 && b < 35;
        
        let isBg = false;
        if (distToBg < 45 || isVeryDarkBg) {
          isBg = true;
        }
        
        if (r > 80 || g > 65 || b > 65) {
          isBg = false;
        }
        
        // Clean up branch in the very top-left corner (x < 110, y < 15)
        // This removes the branch but keeps the heart (which starts lower down)
        if (x < 110 && y < 15) {
          isBg = true;
        }
        
        if (isBg) {
          outPng.data[outIdx] = 0;
          outPng.data[outIdx + 1] = 0;
          outPng.data[outIdx + 2] = 0;
          outPng.data[outIdx + 3] = 0;
        } else {
          outPng.data[outIdx] = r;
          outPng.data[outIdx + 1] = g;
          outPng.data[outIdx + 2] = b;
          outPng.data[outIdx + 3] = a;
        }
      }
    }
    
    const outBuffer = PNG.sync.write(outPng);
    fs.writeFileSync(heartPath, outBuffer);
    console.log("ASTEYA Startup: Transparent heart earring try-on asset compiled perfectly.");
  }
} catch (e) {
  console.error("ASTEYA Startup: Heart earring extraction failed:", e);
}


// Create the GoogleGenAI instance with the server-side server-safe KEY
let ai: GoogleGenAI | null = null;
const API_KEY = process.env.GEMINI_API_KEY;

if (API_KEY && API_KEY !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey: API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    console.log("ASTEYA Core: Gemini ai system successfully bound.");
  } catch (error) {
    console.error("ASTEYA Core: Unexpected error initializing Gemini:", error);
  }
}

// ----------------- Dual AI Orchestration Engine (Gemini & Nvidia NIM) -----------------
const callAIEngine = async (params: {
  prompt: string;
  visionPrompt?: string;
  imageBase64?: string;
  jsonMode?: boolean;
}) => {
  let imageBase64 = params.imageBase64;
  if (imageBase64 && imageBase64.startsWith("http")) {
    try {
      console.log("ASTEYA AI: Fetching preset model image URL and converting to base64...");
      const imgRes = await fetch(imageBase64);
      if (imgRes.ok) {
        const buffer = await imgRes.arrayBuffer();
        imageBase64 = `data:image/jpeg;base64,${Buffer.from(buffer).toString("base64")}`;
      }
    } catch (fetchErr) {
      console.warn("ASTEYA AI: Failed to fetch preset model image, using raw parameter.", fetchErr);
    }
  }

  const nvidiaKey = process.env.NVIDIA_API_KEY;
  const useNvidia = nvidiaKey && nvidiaKey.startsWith("nvapi-");

  if (useNvidia) {
    console.log("ASTEYA Core: Orchestrating AI query via NVIDIA NIM API...");
    try {
      const messages: any[] = [];
      let model = "meta/llama-3.1-70b-instruct"; // Text default

      if (imageBase64) {
        const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
        model = "meta/llama-3.2-11b-vision-instruct"; // Multimodal Vision NIM
        messages.push({
          role: "user",
          content: [
            { type: "text", text: params.visionPrompt || params.prompt },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${cleanBase64}` } }
          ]
        });
      } else {
        messages.push({ role: "user", content: params.prompt });
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.warn("ASTEYA Core: NVIDIA NIM query timed out after 5 seconds.");
      }, 5000);

      const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${nvidiaKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.2,
          max_tokens: 1024
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`NVIDIA NIM HTTP Error: ${response.status}`);
      }

      const resJson = await response.json();
      return resJson.choices[0].message.content.trim();
    } catch (err) {
      console.warn("ASTEYA Core: NVIDIA NIM query failed, falling back to Gemini.", err);
    }
  }

  // Fallback to Google Gemini
  if (ai) {
    console.log("ASTEYA Core: Orchestrating AI query via Google Gemini API...");
    const contents: any[] = [];
    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      contents.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: cleanBase64
        }
      });
      contents.push(params.visionPrompt || params.prompt);
    } else {
      contents.push(params.prompt);
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: params.jsonMode ? { responseMimeType: "application/json" } : undefined
    });

    return response.text ? response.text.trim() : "";
  }

  throw new Error("No active AI Engine (Nvidia NIM or Google Gemini) successfully connected.");
};

// ---------------- Supabase Connection ----------------
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;

if (!isSupabaseConfigured) {
  console.warn("ASTEYA Core NOTICE: Supabase credentials not found in server environment. Active in-memory caches engaged.");
} else {
  console.log("ASTEYA Core: Supabase Postgres database client successfully bound.");
  
  // Verify and auto-create public bucket "jewelry-assets" to guarantee successful uploads
  if (supabase) {
    (async () => {
      try {
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();
        if (listError) throw listError;
        
          const hasBucket = buckets.some(b => b.name === "jewelry-assets");
          if (!hasBucket) {
            console.log("ASTEYA Core: Public bucket 'jewelry-assets' not found. Creating bucket...");
            const { error: createError } = await supabase.storage.createBucket("jewelry-assets", {
              public: true,
              allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/gif", "model/gltf-binary", "application/octet-stream", "text/plain"],
              fileSizeLimit: 52428800 // 50MB
            });
            if (createError) throw createError;
            console.log("ASTEYA Core: Public bucket 'jewelry-assets' successfully created.");
          } else {
            console.log("ASTEYA Core: Public bucket 'jewelry-assets' already active.");
          }
        } catch (e) {
          console.warn("ASTEYA Core NOTICE: Could not verify/create Supabase bucket 'jewelry-assets':", e);
        }

        // Database Auto-Seeder: Ensure full catalog products exist in Supabase
        try {
          const { data: dbProducts, error: dbError } = await supabase.from("products").select("id");
          if (!dbError) {
            // Only seed standard creations if the database is completely empty (0 products)
            // This prevents deleted products from aggressively reappearing during server restarts
            const productsToSeed = (dbProducts && dbProducts.length === 0) ? PRODUCTS : [];
            
            if (productsToSeed.length > 0) {
              console.log(`ASTEYA Auto-Seeder: Seeding ${productsToSeed.length} standard fine jewelry creations into Supabase...`);
              
              const seedPayloads = productsToSeed.map((p: any) => ({
                id: p.id,
                name: p.name,
                slug: p.slug,
                category: p.category,
                category_label: p.categoryLabel,
                price: Number(p.price),
                description: p.description,
                materials: p.materials,
                dimensions: p.dimensions,
                carat_weight: Number(p.caratWeight),
                images: p.images,
                model_url: p.modelUrl,
                is_new: !!p.isNew,
                is_limited: !!p.isLimited,
                collection: p.collection,
                specifications: p.specifications || {},
                inventory_count: 10
              }));

              const { error: seedError } = await supabase.from("products").insert(seedPayloads);
              if (seedError) {
                console.warn("ASTEYA Auto-Seeder: Seeding inserts encountered warning:", seedError);
              } else {
                console.log("ASTEYA Auto-Seeder: Seeding successfully processed.");
              }
            } else {
              console.log("ASTEYA Auto-Seeder: Database already contains full catalog creations.");
            }
          }
        } catch (seedErr) {
          console.warn("ASTEYA Auto-Seeder: Database queries encountered error:", seedErr);
        }
      })();
    }
  }


const app = express();
const PORT = 3000;

// Middleware configuration
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));
app.use("/uploads", express.static(path.join(process.cwd(), "public", "uploads")));

// Luxury Product Database
const PRODUCTS = [
  {
    id: "prod-1",
    name: "Solitaire Amethyst Crown Ring",
    slug: "solitaire-amethyst-crown-ring",
    category: "rings",
    categoryLabel: "Ring Ateliers",
    price: 3450,
    description: "A breathtaking cushion-cut premium simulated violet Amethyst, hand-set on an 18-karat gold vermeil filigree royal crown band with double rows of pavé flawless simulated diamonds. Handcrafted inside our Parisian atelier.",
    materials: ["18K Yellow Gold Vermeil (Premium Plating)", "3.4ct Premium Simulated Amethyst", "0.42ct Artisan Simulated Diamonds"],
    dimensions: "Amethyst face: 10mm x 10mm. Select band width.",
    caratWeight: 3.82,
    images: [
      "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&q=80&w=1200"
    ],
    // Free high-quality ring GLB path for model-viewer (standard sample GLB)
    modelUrl: "https://modelviewer.dev/shared-assets/models/glTF-Sample-Assets/Models/ToyCar/glTF/ToyCar.gltf", // fallback standard asset, but let's use premium orbital coordinate rotations or direct GLB
    isNew: true,
    isLimited: false,
    collection: "Imperial Aura",
    specifications: {
      "Reference ID": "AST-RG-00104",
      "Metal Quality": "Bespoke 18K Yellow Gold Vermeil on Solid Silver Core",
      "Main Gemstone": "Artisan-Crafted Simulated Grade AAA Amethyst",
      "Gem Cut": "Cushion-cut Brilliant-faceted",
      "Creation Process": "Eco-Conscious Precision Lab Synthesis",
      "Certification": "ASTEYA Atelier Quality Certificate Included",
      "Band Design": "Cinematic Crown-embossed Filigree Architecture"
    }
  },
  {
    id: "prod-2",
    name: "Celestial Aura Diamond Necklace",
    slug: "celestial-aura-diamond-necklace",
    category: "necklaces",
    categoryLabel: "Neckwear Ateliers",
    price: 8900,
    description: "Suspended from a fluid 18-karat gold vermeil liquid cord, this circular pendant features a mesmerizing simulated diamond galaxy swirl surrounding a singular luminous floating marquis teardrop simulant. Reflects light brilliantly.",
    materials: ["18K Champagne White Gold Plated Premium Alloy", "1.85ct Vibrant Simulated Marquis Diamond", "1.25ct Brilliant Simulated Diamond Orbit"],
    dimensions: "Pendant Diameter: 22mm. Liquid chain length: 16-18 inches adjustable.",
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
      "Metal Quality": "18K Champagne White Gold Plated Premium Brass",
      "Center Stone": "Bespoke Simulated Marquis Diamond (F-Color, VVS1 equivalent)",
      "Atelier Certificate": "Atelier Quality Verified #74892185-MC",
      "Chain Style": "Custom Seamless Liquid Venetian Link",
      "Clasp": "Bespoke Engraved Asteya Lobster Lock"
    }
  },
  {
    id: "prod-3",
    name: "Imperial Lotus Gold Cuff",
    slug: "imperial-lotus-gold-cuff",
    category: "bracelets",
    categoryLabel: "Bracelet & Cuff Ateliers",
    price: 12400,
    description: "A heavily sculpted, massive 18K yellow gold plated cuff designed with delicate origami-inspired Lotus petal slits. Inside detailed with warm-champagne satin brushwork and engraved brand monogram.",
    materials: ["Heavy 18K Yellow Gold Plating", "Selected Satin Brush Polish"],
    dimensions: "Cuff Width: 45mm. Inner diameter tailored on demand (S/M/L fits).",
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
      "Metal Quality": "74.8 grams of 18K Gold Plated Luxury Brass Core",
      "Interior Finish": "Contrast Matte Micro-Satin Hand-Sanding",
      "Slits": "9 Precise Lotus-Shaped Radial Laser Cutouts",
      "Signature": "Laser-etched 'ASTEYA Circle VI' authentic insignia"
    }
  },
  {
    id: "prod-4",
    name: "Sovereign Marquise Emerald Ring",
    slug: "sovereign-marquise-emerald-ring",
    category: "rings",
    categoryLabel: "Ring Ateliers",
    price: 6700,
    description: "Capturing the dark forest glamour of the Emerald, this piece nests an ultra-narrow simulated marquise emerald alongside twin asymmetrical simulated trillion diamonds on an organically textured band inspired by ancient tree bark.",
    materials: ["18K Antique Finished Rose Gold Plated Premium Alloy", "1.95ct Vibrant Simulated Colombian Emerald", "0.6ct VVS2 Simulated Trillion Diamonds"],
    dimensions: "Main Emerald length: 14mm. Bark band width: 2.8mm.",
    caratWeight: 2.55,
    images: [
      "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=1200"
    ],
    isNew: false,
    isLimited: false,
    collection: "Elysian Forest",
    specifications: {
      "Reference ID": "AST-RG-00923",
      "Emerald Quality": "Deep-Vivid Green Eco-Conscious Simulated Emerald (Atelier Premium)",
      "Bark Gold": "Textured Rose Gold Plating on Premium Alloy Core",
      "Simulated Diamond Accents": "D-Color Excellent Symmetry Simulated Trillions",
      "Design Certificate": "Atelier Premium Quality Verification Checked"
    }
  },
  {
    id: "prod-5",
    name: "Ethereal Dewdrop Gold Earrings",
    slug: "ethereal-dewdrop-gold-earrings",
    category: "earrings",
    categoryLabel: "Earring Ateliers",
    price: 2950,
    description: "Designed to trace the elegant curvature of the jawline, these dangling droplets mimic natural glistening morning dew frozen in raw sculpted gold vermeil, culminating in matching flawless pear-cut rock crystals.",
    materials: ["18K Polished Yellow Gold Plated Premium Alloy", "Two Flawless Simulated Drop Rock Quartz Crystals"],
    dimensions: "Dangle Length: 48mm. Secure luxury butterfly backing.",
    caratWeight: 4.2,
    images: [
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1635767798638-3e25273a8236?auto=format&fit=crop&q=80&w=1200"
    ],
    isNew: false,
    isLimited: false,
    collection: "Elysian Forest",
    specifications: {
      "Reference ID": "AST-ER-00382",
      "Design Philosophy": "Organic Fluidity / Frozen Dew Droplet Sculpting",
      "Main Crystal": "Ultra-pure Artisan-Grown Hexagonal Rock Crystal (AAA Grade)",
      "Weight Per Earring": "6.8g focused lightweight suspension"
    }
  },
  {
    id: "prod-6",
    name: "Cosmic Constellation Diamond Choker",
    slug: "cosmic-constellation-diamond-choker",
    category: "necklaces",
    categoryLabel: "Neckwear Ateliers",
    price: 15800,
    description: "The ultimate statement. A choker formed of raw premium branches woven with twenty-four sparkling simulated celestial stars, set with brilliant simulated diamonds of varying calibers that glimmer dynamically.",
    materials: ["Rhodium Plated Premium Sterling Silver Core", "4.8ct Total Brilliant Simulated Round Diamonds"],
    dimensions: "Choker Circumference: 14.5 inches with invisible flush clasp.",
    caratWeight: 4.8,
    images: [
      "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=1200"
    ],
    isNew: true,
    isLimited: true,
    collection: "Stellar Orbit",
    specifications: {
      "Reference ID": "AST-NC-00712",
      "Setting Base": "Heavy Rhodium Plated Premium Sterling Silver Hand-Woven Filigree",
      "Setting Detail": "Micro-pronged floating celestial starbeds",
      "Simulated Diamond Quality": "VVS1 equivalent clarity mix, Hearts & Arrows excellent cut simulated diamonds",
      "Security": "Double-safety hidden click mechanism"
    }
  }
];

// ================= API ENDPOINTS =================

const getTryOnImageUrl = (p: any) => {
  let tryOnUrl = p.try_on_image_url || p.specifications?.try_on_image_url || "";
  
  if (p.id === "prod-823904") {
    const heartPath = path.join(process.cwd(), "ear_tryon_heart.png");
    if (fs.existsSync(heartPath)) {
      const base64 = fs.readFileSync(heartPath, "base64");
      tryOnUrl = `data:image/png;base64,${base64}`;
    }
  }
  
  return tryOnUrl;
};

// 1. Get All Products (Supabase live query with offline fallback)
app.get("/api/products", async (req, res) => {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        // Map database columns to front-end camelCase properties
        const mappedProducts = data.map((p: any) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          category: p.category,
          categoryLabel: p.category_label,
          price: Number(p.price),
          description: p.description,
          materials: p.materials,
          dimensions: p.dimensions,
          caratWeight: Number(p.carat_weight),
          images: p.images,
          modelUrl: p.model_url,
          mtlUrl: p.mtl_url || p.specifications?.mtl_url || "",
          isNew: p.is_new,
          isLimited: p.is_limited,
          collection: p.collection,
          specifications: p.specifications,
          tryOnImageUrl: getTryOnImageUrl(p)
        }));
        return res.json({ products: mappedProducts });
      }
    } catch (err) {
      console.warn("ASTEYA Database query failed. Serving local offline vault caches.", err);
    }
  }
  res.json({ products: PRODUCTS });
});

// 2. Get Product By Slug
app.get("/api/products/:slug", async (req, res) => {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("slug", req.params.slug)
        .single();

      if (error) throw error;

      if (data) {
        const product = {
          id: data.id,
          name: data.name,
          slug: data.slug,
          category: data.category,
          categoryLabel: data.category_label,
          price: Number(data.price),
          description: data.description,
          materials: data.materials,
          dimensions: data.dimensions,
          caratWeight: Number(data.carat_weight),
          images: data.images,
          modelUrl: data.model_url,
          mtlUrl: data.mtl_url || data.specifications?.mtl_url || "",
          isNew: data.is_new,
          isLimited: data.is_limited,
          collection: data.collection,
          specifications: data.specifications,
          tryOnImageUrl: getTryOnImageUrl(data)
        };
        return res.json({ product });
      }
    } catch (err) {
      console.warn(`ASTEYA Database single query for slug [${req.params.slug}] failed. Falling back.`, err);
    }
  }

  const product = PRODUCTS.find((p) => p.slug === req.params.slug);
  if (!product) {
    return res.status(404).json({ error: "High fine jewel not found in local or remote indexes." });
  }
  res.json({ product });
});

// 3. Create New Product
app.post("/api/products/new", async (req, res) => {
  const p = req.body;
  if (supabase) {
    try {
      const specs = {
        ...(p.specifications || {}),
        try_on_image_url: p.tryOnImageUrl || "",
        mtl_url: p.mtlUrl || ""
      };
      const { error } = await supabase.from("products").insert([{
        id: p.id,
        name: p.name,
        slug: p.slug,
        category: p.category,
        category_label: p.categoryLabel,
        price: Number(p.price),
        description: p.description,
        materials: p.materials,
        dimensions: p.dimensions,
        carat_weight: Number(p.caratWeight),
        images: p.images,
        model_url: p.modelUrl,
        is_new: p.isNew,
        is_limited: p.isLimited,
        collection: p.collection,
        specifications: specs,
        inventory_count: p.inventory_count || 10
      }]);

      if (error) throw error;
      console.log(`ASTEYA Database: Registered product [${p.name}] inside Supabase Postgres.`);
      return res.json({ success: true, product: p });
    } catch (err: any) {
      console.error("ASTEYA DB insert error:", err);
      return res.status(500).json({ error: err.message || "Failed to record piece in database ledger." });
    }
  }

  // Simulated fallback
  PRODUCTS.unshift(p as any);
  res.json({ success: true, product: p, simulated: true });
});

// 4. Update Existing Product
app.post("/api/products/:slug/edit", async (req, res) => {
  const p = req.body;
  if (supabase) {
    try {
      const specs = {
        ...(p.specifications || {}),
        try_on_image_url: p.tryOnImageUrl || "",
        mtl_url: p.mtlUrl || ""
      };
      const { error } = await supabase
        .from("products")
        .update({
          name: p.name,
          category: p.category,
          category_label: p.categoryLabel,
          price: Number(p.price),
          description: p.description,
          materials: p.materials,
          dimensions: p.dimensions,
          carat_weight: Number(p.caratWeight),
          images: p.images,
          model_url: p.modelUrl,
          is_new: p.isNew,
          is_limited: p.is_limited,
          collection: p.collection,
          specifications: specs,
          inventory_count: p.inventory_count || 10
        })
        .eq("slug", req.params.slug);

      if (error) throw error;
      console.log(`ASTEYA Database: Revised metadata for slug [${req.params.slug}] in Supabase.`);
      return res.json({ success: true });
    } catch (err: any) {
      console.error("ASTEYA DB update error:", err);
      return res.status(500).json({ error: err.message || "Failed to revise product ledger." });
    }
  }

  // Simulated fallback
  const idx = PRODUCTS.findIndex((x) => x.slug === req.params.slug);
  if (idx > -1) {
    PRODUCTS[idx] = p as any;
  }
  res.json({ success: true, simulated: true });
});

// 5. Delete Product Entry
app.delete("/api/products/:slug/delete", async (req, res) => {
  if (supabase) {
    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("slug", req.params.slug);

      if (error) throw error;
      console.log(`ASTEYA Database: Purged entry [${req.params.slug}] from remote registry.`);
      return res.json({ success: true });
    } catch (err: any) {
      console.error("ASTEYA DB delete error:", err);
      return res.status(500).json({ error: err.message || "Failed to delete product from database." });
    }
  }

  // Simulated fallback
  const idx = PRODUCTS.findIndex((x) => x.slug === req.params.slug);
  if (idx > -1) {
    PRODUCTS.splice(idx, 1);
  }
  res.json({ success: true, simulated: true });
});

// 6. Dynamic File Upload (Supabase Storage bucket routing)
app.post("/api/upload", async (req, res) => {
  try {
    const rawFileName = req.query.fileName || req.query.filename || req.headers["x-file-name"] || "uploaded-jewelry.glb";
    const fileName = decodeURIComponent(rawFileName as string);
    const fileType = req.headers["content-type"] || "model/gltf-binary";
    const uniqueId = `asteya-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const cleanName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const storagePath = `public/${uniqueId}_${cleanName}`;

    const chunks: Buffer[] = [];

    req.on("data", (chunk) => {
      chunks.push(chunk);
    });

    req.on("end", async () => {
      try {
        const buffer = Buffer.concat(chunks);

        if (buffer.length === 0) {
          return res.status(400).json({ success: false, error: "Empty file body provided." });
        }

        if (supabase) {
          try {
            const { error } = await supabase.storage
              .from("jewelry-assets")
              .upload(storagePath, buffer, {
                contentType: fileType,
                cacheControl: "3600",
                upsert: true
              });

            if (error) throw error;

            const { data: urlData } = supabase.storage
              .from("jewelry-assets")
              .getPublicUrl(storagePath);

            return res.json({
              success: true,
              uploadedUrl: urlData.publicUrl,
              sizeBytes: buffer.length,
              fileName: cleanName
            });
          } catch (storageErr: any) {
            console.warn("Supabase storage upload failed, saving locally as fallback:", storageErr);
            
            // Local file save fallback!
            const uploadDir = path.join(process.cwd(), "public", "uploads");
            if (!fs.existsSync(uploadDir)) {
              fs.mkdirSync(uploadDir, { recursive: true });
            }
            const localFilePath = path.join(uploadDir, `${uniqueId}_${cleanName}`);
            fs.writeFileSync(localFilePath, buffer);

            return res.json({
              success: true,
              uploadedUrl: `/uploads/${uniqueId}_${cleanName}`,
              sizeBytes: buffer.length,
              fileName: cleanName
            });
          }
        } else {
          // Local file save fallback if Supabase not configured!
          const uploadDir = path.join(process.cwd(), "public", "uploads");
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          const localFilePath = path.join(uploadDir, `${uniqueId}_${cleanName}`);
          fs.writeFileSync(localFilePath, buffer);

          return res.json({
            success: true,
            uploadedUrl: `/uploads/${uniqueId}_${cleanName}`,
            sizeBytes: buffer.length,
            fileName: cleanName
          });
        }
      } catch (innerErr: any) {
        console.error("ASTEYA Storage upload inner exception:", innerErr);
        return res.status(500).json({ success: false, error: innerErr.message || "Upload failed." });
      }
    });

    req.on("error", (err) => {
      console.error("Request stream error:", err);
      return res.status(500).json({ success: false, error: "Request stream interrupted." });
    });
  } catch (e: any) {
    console.error("ASTEYA Storage upload outer exception:", e);
    return res.status(500).json({ success: false, error: e.message || "Failed to parse upload." });
  }
});


// 7. AI Product Image Classification (Gemini Vision)
app.post("/api/ai/classify", async (req, res) => {
  const { imageBase64 } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ error: "No image payload found in request." });
  }

  // Strip prefix if exists
  const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

  console.log("ASTEYA AI Classification: Running multimodal analysis on uploaded product photo...");

  let detectedCategory = "rings";
  let detectedLabel = "Ring Ateliers";
  let suggestedName = "Bespoke Royal Creation";
  let suggestedMaterials = ["18K Gold Plated Brass", "Simulated Gemstones"];
  let suggestedPrice = 2500;
  let estimatedCaratWeight = 1.5;
  let detectedBackground = "white"; // white or black or grey
  let luxuryDescription = "A masterpiece of custom haute joaillerie, handcrafted inside our Parisian ateliers.";
  let detectedBoundingBox = [15, 20, 85, 80]; // Default center bounding box crop [ymin, xmin, ymax, xmax]

  try {
    const prompt = `
      You are ASTEYA's Chief Luxury Curator and Premium Fashion Catalog Director.
      Analyze this premium artificial fashion jewelry image.
      
      Determine the following details with absolute premium fashion & artisan standards:
      1. The product category. Must be strictly one of these four: "rings", "necklaces", "earrings", "bracelets".
      2. A luxury group label for it:
         - if rings: "Ring Ateliers"
         - if necklaces: "Neckwear Ateliers"
         - if earrings: "Earring Ateliers"
         - if bracelets: "Bracelet & Cuff Ateliers"
      3. A premium luxury marketing title/name for this piece.
      4. An opulent editorial styling description of 2-3 sentences.
      5. An array of suggested premium fashion materials used in the piece (e.g., 18K Gold Vermeil, Heavy Rhodium Plating, premium simulated gemstones like Simulated Emerald, Simulated Amethyst, Simulated Diamond, Cubic Zirconia).
      6. A suitable premium price in INR (e.g., between 2000 and 15000).
      7. Estimated total simulated gemstone carat weight equivalent as a float (e.g. 1.25, or 0 if it's pure metal).
      8. The background color type of the image. Must be strictly one of: "white", "black", "grey", "natural".
      9. A precise normalized bounding box for **exactly ONE single isolated item** in the image (e.g., if there is a pair of earrings, detect the bounding box of just ONE single earring. If there is a necklace, detect the bounding box of the necklace. If there is a ring, detect the bounding box of the ring).
         Return it as a JSON array of 4 integers in [0, 100] representing percentage coordinates: [ymin, xmin, ymax, xmax] relative to the image size.
      
      Respond ONLY with a valid JSON block containing these exact keys:
      {
        "category": "rings" | "necklaces" | "earrings" | "bracelets",
        "categoryLabel": string,
        "name": string,
        "description": string,
        "materials": string[],
        "price": number,
        "caratWeight": number,
        "backgroundColor": "white" | "black" | "grey" | "natural",
        "boundingBox": [number, number, number, number]
      }
    `;

    const responseText = await callAIEngine({
      prompt,
      visionPrompt: prompt,
      imageBase64: imageBase64,
      jsonMode: true
    });

    console.log("ASTEYA AI Classification Result:", responseText);

    try {
      const parsedJson = JSON.parse(responseText);
      detectedCategory = parsedJson.category || detectedCategory;
      detectedLabel = parsedJson.categoryLabel || detectedLabel;
      suggestedName = parsedJson.name || suggestedName;
      luxuryDescription = parsedJson.description || luxuryDescription;
      suggestedMaterials = parsedJson.materials || suggestedMaterials;
      suggestedPrice = parsedJson.price || suggestedPrice;
      estimatedCaratWeight = parsedJson.caratWeight || estimatedCaratWeight;
      detectedBackground = parsedJson.backgroundColor || detectedBackground;
      detectedBoundingBox = parsedJson.boundingBox || detectedBoundingBox;
    } catch (jsonErr) {
      console.warn("Could not completely parse JSON response from AI Engine, using fallbacks.", jsonErr);
    }
  } catch (err) {
    console.error("ASTEYA AI Classification Engine call failed:", err);
  }

  res.json({
    success: true,
    category: detectedCategory,
    categoryLabel: detectedLabel,
    name: suggestedName,
    description: luxuryDescription,
    materials: suggestedMaterials.join(", "),
    price: suggestedPrice,
    caratWeight: estimatedCaratWeight,
    backgroundColor: detectedBackground,
    boundingBox: detectedBoundingBox
  });
});


app.post("/api/ai/tryon", async (req, res) => {
  const { productId, userImage, isLiveCamera } = req.body;
  
  let product: any = null;
  if (supabase) {
    try {
      const { data, error } = await supabase.from("products").select("*").eq("id", productId).single();
      if (!error && data) {
        product = {
          id: data.id,
          name: data.name,
          slug: data.slug,
          category: data.category,
          categoryLabel: data.category_label,
          price: data.price,
          description: data.description,
          materials: data.materials || [],
          dimensions: data.dimensions,
          caratWeight: data.carat_weight,
          images: data.images || [],
          modelUrl: data.model_url,
          isNew: data.is_new,
          isLimited: data.is_limited,
          collection: data.collection,
          specifications: data.specifications || {}
        };
      }
    } catch (dbErr) {
      console.warn("ASTEYA AI: Database error fetching custom product, using local catalog fallback.", dbErr);
    }
  }

  if (!product) {
    product = PRODUCTS.find((p) => p.id === productId) || PRODUCTS[0];
  }

  console.log(`ASTEYA AI: Processing try-on for product [${product.name}]...`);

  let responseText = "";
  let faceShapeResult = "Oval / Cinematic Grace";
  let recommendedMetalsResult = ["18K Yellow Gold", "Platinum"];
  let stylistQuoteResult = "A stunning geometric synergy between your facial alignment and the product's royal structure.";
  let detectedLandmarks: any = null;

  try {
    const prompt = `
      You are ASTEYA's Grand Master Gemologist, Computer Vision Specialist, and Editorial High-Fashion Stylist.
      The user has engaged the AI Virtual Try-on studio to wear our handcrafted jewelry: "${product.name}" (${product.collection} Collection).
      This jewelry is made of: ${product.materials.join(", ")}. It is classified as: ${product.description}.
      
      Write a luxury fashion and styling assessment for this try-on session. The tone must be opulent, architectural, artistic, and deeply VIP-personalized.
      
      Also, analyze the user's facial portrait image provided. Detect the exact normalized coordinates (as percentages in [0, 100] measured from the top-left of the image box) for:
      1. "ear_ref_l": The center point of their left earlobe (the ear on the left side of the image, which is the user's right ear if front-facing).
      2. "ear_ref_r": The center point of their right earlobe (the ear on the right side of the image).
      3. "neck_ref": The base center of their neck where a necklace pendant would naturally rest.
      
      Provide your assessment strictly in a clear, formatted JSON structure containing the following keys (do not wrap in anything else except a parsing friendly block):
      {
        "faceShape": string (e.g. "Sculpted Diamond Symmetrical", "Chiseled Classic Oval", "Regal Sovereign Heart"),
        "gemologistCritique": string (detailed critique paragraph),
        "stylistQuote": string (max 15 words),
        "recommendedMetals": string[] (array of 2-3 noble metals),
        "landmarks": {
          "ear_ref_l": { "x": number, "y": number },
          "ear_ref_r": { "x": number, "y": number },
          "neck_ref": { "x": number, "y": number },
          "hand_ref": { "x": 50, "y": 65 }
        }
      }
    `;

    const responseTextResult = await callAIEngine({
      prompt,
      visionPrompt: prompt,
      imageBase64: userImage,
      jsonMode: true
    });

    console.log("ASTEYA AI Tryon Answer Received:", responseTextResult);

    try {
      const parsedJson = JSON.parse(responseTextResult);
      responseText = parsedJson.gemologistCritique || parsedJson.critique || responseText;
      faceShapeResult = parsedJson.faceShape || faceShapeResult;
      stylistQuoteResult = parsedJson.stylistQuote || stylistQuoteResult;
      recommendedMetalsResult = parsedJson.recommendedMetals || recommendedMetalsResult;
      if (parsedJson.landmarks) {
        detectedLandmarks = parsedJson.landmarks;
      }
    } catch (jsonErr) {
      console.warn("Could not completely parse JSON response from AI Engine Tryon, parsing flat text.", jsonErr);
      responseText = responseTextResult;
    }
  } catch (err) {
    console.error("ASTEYA AI error querying AI Engine Vision Tryon:", err);
  }

  // Fallback if key missing or query failed
  if (!responseText) {
    responseText = `The luxurious architectures of the ${product.name} present an impeccable synergy with your feature geometry. The intense luster of our hand-selected noble weights harmonizes brilliantly, drawing ambient focus to your silhouette. As sunlight captures the diamond micro-facets, a golden aureole frames your lineation with supreme authority—conveying both contemporary power and timeless heritage.`;
  }

  // Smart coordinate fallback if Gemini was offline
  if (!detectedLandmarks) {
    if (userImage) {
      if (userImage.includes("model-w-1")) {
        detectedLandmarks = { ear_ref_l: { x: 38, y: 61 }, ear_ref_r: { x: 62, y: 61 }, neck_ref: { x: 50, y: 77 }, hand_ref: { x: 50, y: 65 } };
      } else if (userImage.includes("model-m-1")) {
        detectedLandmarks = { ear_ref_l: { x: 37, y: 58 }, ear_ref_r: { x: 63, y: 58 }, neck_ref: { x: 51, y: 74 }, hand_ref: { x: 50, y: 65 } };
      } else if (userImage.includes("model-w-2")) {
        detectedLandmarks = { ear_ref_l: { x: 39, y: 62 }, ear_ref_r: { x: 61, y: 62 }, neck_ref: { x: 50, y: 79 }, hand_ref: { x: 55, y: 68 } };
      } else {
        // Safe centered fallback coordinates
        detectedLandmarks = { ear_ref_l: { x: 38, y: 61 }, ear_ref_r: { x: 62, y: 61 }, neck_ref: { x: 50, y: 76 }, hand_ref: { x: 50, y: 65 } };
      }
    } else {
      detectedLandmarks = { ear_ref_l: { x: 38, y: 61 }, ear_ref_r: { x: 62, y: 61 }, neck_ref: { x: 50, y: 76 }, hand_ref: { x: 50, y: 65 } };
    }
  }

  // Return realistic high-fashion tryon response
  res.json({
    success: true,
    assessment: responseText,
    faceShape: faceShapeResult,
    stylistQuote: stylistQuoteResult,
    recommendedMetals: recommendedMetalsResult,
    landmarks: detectedLandmarks,
    renderedImageUrl: product.images[0] // Composition preview url
  });
});

// 5. AI Avatar & Persona Boutique (Gemini-powered recommendation)
app.post("/api/ai/avatar", async (req, res) => {
  const { preferences, archetype, focusArea } = req.body;

  console.log(`ASTEYA AI Avatar: Crafting styled persona for archetype [${archetype}]...`);

  let signatureStyleResult = "Sovereign Avant-Garde";
  let recommendedCollectionsResult = ["Imperial Aura", "Stellar Orbit"];
  let descriptionResult = "";

  if (ai) {
    try {
      const prompt = `
        You are ASTEYA's Brand Director and AI Haute Stylist.
        The VIP Member is crafting their digital Haute Joaillerie profile.
        - Style Archetype chosen: ${archetype} (e.g., Boldly Sovereign, Quiet Luxury, Midnight Avant-Garde, Celestial Wanderer).
        - Desired Gemology Focus: ${focusArea} (e.g., Flawless Diamonds, Raw Amethyst, Vivid Emeralds, High Rose Gold).
        - Additional Mood Inputs: ${preferences || "No specific preferences, general high-fashion art."}

        Generate an opulent, poetic, highly sophisticated Member Identity Persona profile write-up for this VIP.
        Return your results strictly in a JSON block with these keys:
        1. "signatureStyle": A three-word high-end couture style label name.
        2. "description": A highly creative, cinematic paragraph (4 sentences) characterizing their style aura, how they command attention in candlelit galas, and how their metal-of-choice echoes their inner nobility.
        3. "recommendedCollections": An array of 2 collections from ASTEYA's catalog (e.g. 'Imperial Aura', 'Stellar Orbit', 'Elysian Forest', 'Dynasty') that fit.
        4. "aestheticCompatibilityScore": A percentage integer between 94% and 99%.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const parsedText = response.text ? response.text.trim() : "";
      try {
        const parsedJson = JSON.parse(parsedText);
        signatureStyleResult = parsedJson.signatureStyle || signatureStyleResult;
        descriptionResult = parsedJson.description || descriptionResult;
        recommendedCollectionsResult = parsedJson.recommendedCollections || recommendedCollectionsResult;
      } catch (e) {
        console.warn("Avatar JSON parse failed, utilizing fallback text extraction.", e);
        descriptionResult = parsedText;
      }
    } catch (e) {
      console.error("AI Avatar generator call failed:", e);
    }
  }

  if (!descriptionResult) {
    descriptionResult = `You embody the rare aura of the "${archetype}". Your design language seeks architectural grandeur rather than simple decoration. In grand candlelit salons, you command the room not through volume, but through the severe elegance of custom-worked precious metals and highly specialized stone placements which mirror the internal brilliance of your character.`;
  }

  // Select a stunning curated portrait based on chosen archetype to serve as the user's high-fashion AI Avatar profile picture!
  let avatarUrl = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400"; // portrait
  if (archetype === "Quiet Luxury") {
    avatarUrl = "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400";
  } else if (archetype === "Midnight Avant-Garde") {
    avatarUrl = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400";
  } else if (archetype === "Celestial Wanderer") {
    avatarUrl = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400";
  }

  res.json({
    success: true,
    signatureStyle: signatureStyleResult,
    description: descriptionResult,
    recommendedCollections: recommendedCollectionsResult,
    avatarUrl,
    aestheticCompatibilityScore: Math.floor(Math.random() * 6) + 94
  });
});

// 6. AI Aesthetic Concierge (Budget + Outfit + Skin Assessment Product Allocator)
app.post("/api/ai/concierge", async (req, res) => {
  const { budget, outfitImage, skinImage, outfitColor, outfitSwatches, criteria } = req.body;
  
  if (budget === undefined || budget === null) {
    return res.status(400).json({ error: "Maximum budget parameter is required." });
  }

  const useBudget = criteria?.budget !== false;
  const useOutfit = criteria?.outfit !== false;
  const useSkin = criteria?.skin !== false;

  console.log(`ASTEYA AI Concierge: Allocating custom jewelry for maximum budget of ₹${budget} (Strict Budget: ${useBudget}, Outfit: ${useOutfit}, Skin: ${useSkin})...`);

  // Query live product database first (Supabase active check) or local catalog list
  let activeProducts: any[] = PRODUCTS;
  if (supabase) {
    try {
      const { data } = await supabase.from("products").select("*");
      if (data && data.length > 0) {
        activeProducts = data.map((p: any) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          category: p.category,
          price: Number(p.price),
          description: p.description,
          materials: p.materials,
          collection: p.collection
        }));
      }
    } catch (dbErr) {
      console.warn("ASTEYA AI Concierge: Supabase product fetch failed. Reverting to local ledger.", dbErr);
    }
  }

  let finalResponseJson: any = null;

  if (ai) {
    try {
      const contents: any[] = [];

      if (useOutfit && outfitImage && outfitImage.startsWith("data:image/")) {
        const cleanOutfit = outfitImage.replace(/^data:image\/\w+;base64,/, "");
        contents.push({
          inlineData: {
            mimeType: "image/jpeg",
            data: cleanOutfit
          }
        });
      } else if (useOutfit && outfitImage) {
        contents.push(`The user's selected outfit: ${outfitImage}. Please use this style context.`);
      }

      if (useSkin && skinImage && skinImage.startsWith("data:image/")) {
        const cleanSkin = skinImage.replace(/^data:image\/\w+;base64,/, "");
        contents.push({
          inlineData: {
            mimeType: "image/jpeg",
            data: cleanSkin
          }
        });
      } else if (useSkin && skinImage) {
        contents.push(`The user's selected skin tone: ${skinImage}. Please use this skin tone context.`);
      }

      const productSummary = activeProducts.map(p => 
        `ID: ${p.id}, Name: ${p.name}, Price: ₹${p.price}, Category: ${p.category}, Collection: ${p.collection}, Description: ${p.description}, Materials: ${p.materials.join(", ")}`
      ).join("\n");

      const prompt = `
        You are ASTEYA's Grand Concierge Director, Chief Color Analyst, and Haute Joaillerie Stylist.
        
        The user has engaged the AI Concierge for personalized jewelry allocation:
        ${useBudget ? `- Maximum Spending Limit (Budget): ₹${budget} INR. (You MUST strictly recommend products whose price is LESS THAN OR EQUAL TO this maximum budget. If no products in the catalog are under this maximum budget cap, you MUST return recommendedProductIds as an empty array [])` : "- No Budget constraints selected."}
        - We have provided up to two images:
          ${(useOutfit && outfitImage) ? "- One image of their outfit selection." : ""}
          ${(useSkin && skinImage) ? "- One image of their face/skin profile." : ""}
        
        Available Catalog Products:
        ${productSummary}

        ${useOutfit ? "Analyze the uploaded outfit image (if provided) to extract color harmony, styling textures, and look aura. Ensure recommended items complement the color and shape of the dress beautifully. Avoid colors that clash with the dress color." : "Do not perform outfit color matching; recommend neutral elegant designs."}
        ${useSkin ? "Analyze the uploaded skin profile image (if provided) to determine undertones, skin warmth, and the most flattering metal alloys (Yellow Gold, White Gold, Rose Gold)." : "Do not perform skin tone matching."}

        Recommend ALL matching products from our catalog that fit the user's styling matches and are strictly under their budget constraint (if budget limit is enabled). If no products fit the constraints, return recommendedProductIds as an empty array []—do NOT recommend products that violate the filters.

        Provide your assessment strictly in a clear, formatted JSON structure containing these exact keys:
        {
          "undertone": string (e.g. "Warm Golden Undertone" or "Cool Alabaster" or "Neutral Honey"),
          "metalRecommendation": string (e.g. "Polished 18K Yellow Gold" or "Rhodium Plating / Champagne White Gold"),
          "skinRationale": string (2-3 sentences detailing skin tone and metal pairing),
          "dominantColors": string[] (array of colors detected in the outfit, e.g. ["Deep Emerald", "Gold Filigree", "Burgundy Velvet"]),
          "styleMatchAura": string (e.g. "Regal Evening / Traditional Festive" or "Quiet Luxury / Corporate Power"),
          "outfitRationale": string (2-3 sentences detailing how the outfit coordinates with jewelry shapes),
          "stylistCritique": string (opulent, poetic styling summary of the allocated jewelry styling set),
          "recommendedProductIds": string[] (array of product IDs from the catalog that match, STRICTLY matching all checked filters)
        }
      `;
      contents.push(prompt);

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: contents,
        config: {
          responseMimeType: "application/json",
        },
      });

      const parsedText = response.text ? response.text.trim() : "";
      try {
        finalResponseJson = JSON.parse(parsedText);
        console.log("ASTEYA AI Concierge: Allocation completed successfully.");
      } catch (jsonErr) {
        console.warn("ASTEYA AI Concierge: JSON parse failed. Utilizing fallback mechanism.", jsonErr);
      }
    } catch (aiErr) {
      console.error("ASTEYA AI Concierge: Gemini API call failed:", aiErr);
    }
  }

  // Robust Fallback Builder if Gemini was offline, not configured, or returned invalid layout
  if (!finalResponseJson) {
    const affordable = useBudget ? activeProducts.filter(p => p.price <= budget) : activeProducts;
    
    // Fit matching: match color of the dress if outfit matching is enabled
    let matchingProducts = affordable;
    if (useOutfit) {
      const colorQuery = (outfitColor || outfitImage || "").toLowerCase();
      if (colorQuery.includes("emerald") || colorQuery.includes("green")) {
        matchingProducts = affordable.filter(p => p.id === "prod-4" || p.id === "prod-3" || p.id === "prod-5" || p.id === "prod-2" || p.id === "prod-6");
      } else if (colorQuery.includes("crimson") || colorQuery.includes("red")) {
        matchingProducts = affordable.filter(p => p.id === "prod-1" || p.id === "prod-2" || p.id === "prod-3" || p.id === "prod-5" || p.id === "prod-6");
      } else if (colorQuery.includes("champagne") || colorQuery.includes("gold")) {
        matchingProducts = affordable.filter(p => p.id === "prod-3" || p.id === "prod-5" || p.id === "prod-1" || p.id === "prod-2" || p.id === "prod-6");
      } else if (colorQuery.includes("white") || colorQuery.includes("ivory") || colorQuery.includes("pearl")) {
        // White matches all catalog items! It is a neutral luxury drape that highlights all gems and gold.
        matchingProducts = affordable;
      } else if (colorQuery.includes("sapphire") || colorQuery.includes("blue")) {
        matchingProducts = affordable.filter(p => p.id === "prod-2" || p.id === "prod-6" || p.id === "prod-3" || p.id === "prod-5" || p.id === "prod-1");
      }
    }

    const ids = matchingProducts.map(p => p.id);

    finalResponseJson = {
      undertone: useSkin ? (skinImage ? "Warm Golden Undertone" : "Neutral Honey Alignment") : "Curation Custom Select",
      metalRecommendation: useSkin ? (budget >= 10000 ? "Polished 18K Yellow Gold" : "18K Gold Vermeil & Rhodium Silver") : "Atelier Precious Alloys",
      skinRationale: useSkin 
        ? "The luminous texture of your skin coordinates naturally with classic warm gold jewelry accents. Asteya's custom handcrafting reflects premium light frequencies, accentuating skin radiance."
        : "Skin undertone assessment bypassed by client.",
      dominantColors: useOutfit ? (outfitSwatches && outfitSwatches.length > 0 ? outfitSwatches : [outfitColor || "Ivory Silk"]) : ["Bespoke Gold", "Silver Sparkles"],
      styleMatchAura: useOutfit ? "Haute Traditional / Elegant Gala Festive" : "Classic Signature Selection",
      outfitRationale: useOutfit 
        ? `The structural silhouette of the dress in ${outfitColor || "custom shade"} coordinates excellently with clean, circular metal architectures and suspended teardrop simulations.`
        : "Outfit matching bypassed by client.",
      stylistCritique: ids.length > 0
        ? `An outstanding premium styling allocation matching the maximum budget limit of ₹${budget}. By coordinating delicate simulated stones and warm precious metals, these hand-selected pieces present an impeccable aesthetic balance of traditional pride and contemporary luxury.`
        : `All of our luxury master creations currently exceed your entered maximum budget cap of ₹${budget}. We invite you to refine your filters or explore our entry-level creations starting at ₹2,950.`,
      recommendedProductIds: ids
    };
  }

  // Hard backend post-filtering to guarantee budget rules are never bypassed by AI hallucinations
  if (finalResponseJson && finalResponseJson.recommendedProductIds) {
    if (useBudget) {
      const budgetMap = new Map(activeProducts.map(p => [p.id, p.price]));
      finalResponseJson.recommendedProductIds = finalResponseJson.recommendedProductIds.filter((id: string) => {
        const price = budgetMap.get(id);
        return price !== undefined && price <= budget;
      });
    }
  }

  res.json({
    success: true,
    undertone: finalResponseJson.undertone,
    metalRecommendation: finalResponseJson.metalRecommendation,
    skinRationale: finalResponseJson.skinRationale,
    dominantColors: finalResponseJson.dominantColors,
    styleMatchAura: finalResponseJson.styleMatchAura,
    outfitRationale: finalResponseJson.outfitRationale,
    stylistCritique: finalResponseJson.stylistCritique,
    recommendedProductIds: finalResponseJson.recommendedProductIds
  });
});


// 8. Order Checkout and Dispatch Alerts
app.post("/api/checkout", async (req, res) => {
  const { buyer, items, subtotal, tax, delivery, total } = req.body;

  if (!buyer || !items || items.length === 0) {
    return res.status(400).json({ error: "Missing required order parameters." });
  }

  console.log(`ASTEYA Order Processing: Initiating transaction for ${buyer.name} (${buyer.email})...`);

  let dbSaved = false;
  let dbErrorMsg = "";

  // 1. Attempt Supabase Ledger Insert
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("orders")
        .insert([{
          buyer_name: buyer.name,
          buyer_email: buyer.email,
          buyer_phone: buyer.phone,
          buyer_address: buyer.address,
          items: items,
          subtotal: Number(subtotal),
          tax: Number(tax),
          delivery: Number(delivery),
          total: Number(total),
          status: "pending"
        }]);

      if (error) {
        console.warn("ASTEYA Ledger Warn: Supabase order registry insert returned error:", error);
        dbErrorMsg = error.message;
      } else {
        console.log("ASTEYA Ledger: Order successfully logged in Supabase orders registry.");
        dbSaved = true;
      }
    } catch (dbErr: any) {
      console.warn("ASTEYA Ledger Warn: Exceptional error during database recording:", dbErr);
      dbErrorMsg = dbErr.message || String(dbErr);
    }
  } else {
    console.warn("ASTEYA Ledger Notice: Supabase not configured. Bypassing database order ledgering.");
    dbErrorMsg = "Supabase client not initialized";
  }

  // 2. Format Price Helper
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(price);
  };

  // 3. Construct Opulent HTML Email Template
  const itemsHtml = items.map((item: any) => `
    <table width="100%" style="margin-bottom: 20px; border-bottom: 1px solid rgba(197, 168, 128, 0.1); padding-bottom: 15px; border-collapse: collapse;">
      <tr>
        <td width="70" style="vertical-align: middle; padding-right: 15px;">
          <img src="${item.product.images[0]}" alt="${item.product.name}" width="70" height="70" style="display: block; object-fit: cover; border: 1px solid rgba(197, 168, 128, 0.2); background-color: #170715; border-radius: 2px;" />
        </td>
        <td style="vertical-align: middle;">
          <h3 style="font-family: 'Cinzel', 'Georgia', serif; font-size: 13px; letter-spacing: 1px; color: #f7f2f7; margin: 0 0 4px 0; text-transform: uppercase; font-weight: normal;">
            ${item.product.name}
          </h3>
          <p style="font-family: 'Arial', sans-serif; font-size: 11px; color: #a392a1; margin: 0 0 8px 0;">
            ${item.product.categoryLabel || "Jewelry Ateliers"} ${item.selectedSize ? `&bull; Size: ${item.selectedSize}` : ""}
          </p>
          <table width="100%" style="border-collapse: collapse; font-family: 'Arial', sans-serif; font-size: 12px; color: #f7f2f7;">
            <tr>
              <td style="color: #a392a1; font-family: 'Arial', sans-serif;">Quantity: ${item.quantity}</td>
              <td style="text-align: right; color: #c5a880; font-weight: bold; font-family: 'Arial', sans-serif;">${formatPrice(item.product.price * item.quantity)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `).join("");

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>ASTEYA Order Alert</title>
    </head>
    <body style="font-family: 'Georgia', serif; background-color: #170715; color: #f7f2f7; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #210d20; border: 1px solid #c5a880; padding: 40px; box-sizing: border-box; border-radius: 4px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
        
        <!-- Header -->
        <div style="text-align: center; border-bottom: 1px solid rgba(197, 168, 128, 0.2); padding-bottom: 30px; margin-bottom: 30px;">
          <h1 style="font-family: 'Cinzel', 'Georgia', serif; color: #c5a880; font-size: 26px; letter-spacing: 5px; margin: 0 0 10px 0; text-transform: uppercase; font-weight: normal;">
            ASTEYA
          </h1>
          <p style="font-style: italic; color: #a392a1; font-size: 12px; margin: 0; letter-spacing: 2px;">
            HAUTE JOAILLERIE ACQUISITION ALERT
          </p>
        </div>

        <!-- Section 1: Customer Details -->
        <div style="margin-bottom: 35px;">
          <h2 style="font-family: 'Cinzel', 'Georgia', serif; font-size: 12px; letter-spacing: 2px; color: #c5a880; border-bottom: 1px solid rgba(197, 168, 128, 0.15); padding-bottom: 8px; margin: 0 0 15px 0; text-transform: uppercase; font-weight: normal;">
            VIP Client Profile
          </h2>
          <table style="width: 100%; border-collapse: collapse; font-family: 'Arial', sans-serif; font-size: 13px;">
            <tr>
              <td style="padding: 8px 0; color: #a392a1; width: 30%; font-weight: bold;">Client Name:</td>
              <td style="padding: 8px 0; color: #f7f2f7;">${buyer.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #a392a1; font-weight: bold;">Email Address:</td>
              <td style="padding: 8px 0; color: #f7f2f7;">${buyer.email}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #a392a1; font-weight: bold;">Phone Number:</td>
              <td style="padding: 8px 0; color: #f7f2f7;">${buyer.phone}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #a392a1; font-weight: bold;">Delivery Address:</td>
              <td style="padding: 8px 0; color: #f7f2f7; line-height: 1.6;">${buyer.address}</td>
            </tr>
          </table>
        </div>

        <!-- Section 2: Order Items -->
        <div style="margin-bottom: 35px;">
          <h2 style="font-family: 'Cinzel', 'Georgia', serif; font-size: 12px; letter-spacing: 2px; color: #c5a880; border-bottom: 1px solid rgba(197, 168, 128, 0.15); padding-bottom: 8px; margin: 0 0 15px 0; text-transform: uppercase; font-weight: normal;">
            Allocated Creations
          </h2>
          ${itemsHtml}
        </div>

        <!-- Section 3: Cost breakdown -->
        <div style="margin-top: 30px; border-top: 1px solid rgba(197, 168, 128, 0.2); padding-top: 20px;">
          <table style="width: 100%; border-collapse: collapse; font-family: 'Arial', sans-serif; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #a392a1;">Boutique Subtotal:</td>
              <td style="padding: 6px 0; color: #f7f2f7; text-align: right;">${formatPrice(subtotal)}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #a392a1;">Armored Handover Delivery:</td>
              <td style="padding: 6px 0; color: #f7f2f7; text-align: right;">
                ${delivery === 0 ? '<span style="color: #c5a880; font-weight: bold; letter-spacing: 1px; font-size: 11px;">COMPLIMENTARY VIP</span>' : formatPrice(delivery)}
              </td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #a392a1;">Estimated Luxury Excise:</td>
              <td style="padding: 6px 0; color: #f7f2f7; text-align: right;">${formatPrice(tax)}</td>
            </tr>
            <tr style="border-top: 1px solid rgba(197, 168, 128, 0.25);">
              <td style="padding: 15px 0 0 0; font-family: 'Cinzel', 'Georgia', serif; font-size: 13px; color: #f7f2f7; letter-spacing: 2px;">AGGREGATED VALUE:</td>
              <td style="padding: 15px 0 0 0; font-family: 'Arial', sans-serif; font-size: 18px; color: #c5a880; font-weight: bold; text-align: right;">${formatPrice(total)}</td>
            </tr>
          </table>
        </div>

        <!-- Action Decree Section -->
        <div style="margin-top: 40px; padding: 15px; border: 1px dashed rgba(197, 168, 128, 0.3); background-color: rgba(197, 168, 128, 0.02); text-align: center; border-radius: 2px;">
          <p style="font-family: 'Arial', sans-serif; font-size: 11px; color: #c5a880; margin: 0; text-transform: uppercase; letter-spacing: 1px; line-height: 1.5;">
            <strong>Atelier Action Decree:</strong> Please coordinate with Amritsar logistics for solid vault release, custom certificate binding, and VIP courier hand-carry routing.
          </p>
        </div>

        <!-- Footer -->
        <div style="margin-top: 40px; text-align: center; border-top: 1px solid rgba(197, 168, 128, 0.1); padding-top: 20px;">
          <p style="font-family: 'Arial', sans-serif; font-size: 10px; color: #887886; margin: 0 0 5px 0; letter-spacing: 1px;">
            ASTEYA Fine Jewelry &bull; Paris &bull; Amritsar
          </p>
          <p style="font-family: 'Arial', sans-serif; font-size: 9px; color: #6a5a68; margin: 0;">
            Database Status: ${dbSaved ? "Registered in Supabase Ledger" : "Caches Synchronized (DB Notice: " + dbErrorMsg + ")"}
          </p>
        </div>

      </div>
    </body>
    </html>
  `;

  // 4. Send email alert to the two accounts
  const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER || "";
  const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_PASS || "";

  if (smtpUser && smtpPass) {
    try {
      console.log(`ASTEYA Email: Preparing dispatch via secure SMTP for ${smtpUser}...`);
      
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });

      const mailOptions = {
        from: `"ASTEYA Boutique Alerts" <${smtpUser}>`,
        to: "asteya.in@gmail.com, pushkarsaluja2008@gmail.com",
        subject: `👑 New ASTEYA Acquisition Request - ${buyer.name}`,
        html: emailHtml
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`ASTEYA Email: Dispatch processed successfully. MessageId: ${info.messageId}`);
      
      return res.json({
        success: true,
        dbSaved,
        emailSent: true,
        message: "Your premium ASTEYA pieces have been allocated. Our luxury master curators are preparing courier logs."
      });
    } catch (mailErr: any) {
      console.error("ASTEYA Email Error: SMTP transporter dispatch failed:", mailErr);
      return res.json({
        success: true,
        dbSaved,
        emailSent: false,
        emailError: mailErr.message || String(mailErr),
        message: "Atelier allocation request recorded in database logs. Our master artisans are preparing your velvet drawers."
      });
    }
  } else {
    console.warn("ASTEYA Email Warn: SMTP credentials not present in Netlify environment variables. Bypassing email dispatch.");
    return res.json({
      success: true,
      dbSaved,
      emailSent: false,
      emailWarning: "Credentials missing",
      message: "Atelier allocation request recorded in database logs. Our master artisans are preparing your velvet drawers."
    });
  }
});


// ================= VITE DEV / PRODUCTION SERVER GATEWAY =================

export default app;
