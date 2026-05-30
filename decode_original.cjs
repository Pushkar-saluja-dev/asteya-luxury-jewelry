const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase credentials missing!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data, error } = await supabase.from("products").select("*").eq("id", "prod-823904").single();
  if (error) {
    console.error("Error:", error);
    return;
  }
  
  const img0 = data.images?.[0] || "";
  if (!img0) {
    console.log("No images[0]!");
    return;
  }
  
  // Extract base64 part
  const base64Data = img0.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, 'base64');
  
  const outputPath = path.join(__dirname, "ear_original.png");
  fs.writeFileSync(outputPath, buffer);
  console.log(`Successfully saved ear_original.png to ${outputPath}`);
}

run();
