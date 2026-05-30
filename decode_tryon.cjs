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
  
  const tryOn = data.specifications?.try_on_image_url || data.try_on_image_url || "";
  if (!tryOn) {
    console.log("No try_on_image_url!");
    return;
  }
  
  // Extract base64 part
  const base64Data = tryOn.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, 'base64');
  
  const outputPath = path.join(__dirname, "ear_tryon.png");
  fs.writeFileSync(outputPath, buffer);
  console.log(`Successfully saved ear_tryon.png to ${outputPath}`);
}

run();
