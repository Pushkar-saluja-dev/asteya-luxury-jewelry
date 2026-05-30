const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase credentials missing!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data, error } = await supabase.from("products").select("*");
  if (error) {
    console.error("Error:", error);
    return;
  }
  console.log(`Found ${data.length} products in database:`);
  data.forEach(p => {
    console.log(`\n- ID: ${p.id} | Name: ${p.name} | Category: ${p.category}`);
    console.log(`  try_on_image_url (first 100 chars): ${p.try_on_image_url ? p.try_on_image_url.slice(0, 100) + '...' : 'none'}`);
    console.log(`  specifications.try_on_image_url (first 100 chars): ${p.specifications?.try_on_image_url ? p.specifications.try_on_image_url.slice(0, 100) + '...' : 'none'}`);
    console.log(`  images length: ${p.images?.length || 0}`);
    if (p.images && p.images.length > 0) {
      console.log(`  images[0] (first 100 chars): ${p.images[0].slice(0, 100)}...`);
    }
  });
}

run();
