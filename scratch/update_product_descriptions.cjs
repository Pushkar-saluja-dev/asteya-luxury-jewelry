const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase credentials missing!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log("Updating prod-823904...");
  const { data, error } = await supabase
    .from("products")
    .update({ 
      name: "Aura Blossom Heart Earrings",
      description: "Exquisite heart-shaped earrings featuring handcrafted white flower petals, glistening pearls, and fine simulated pink stones set in a polished 18K yellow gold border. Perfectly matches ivory and white attire.",
      materials: ["18K Yellow Gold Plated Brass", "White Shell Flower Petals", "Simulated Pearl", "Pink Tourmaline Simulants"],
      category_label: "Earring Ateliers"
    })
    .eq("id", "prod-823904")
    .select();

  if (error) {
    console.error("Error updating product:", error);
    process.exit(1);
  }
  
  console.log("Successfully updated product details:");
  console.log(data);
}

run();
