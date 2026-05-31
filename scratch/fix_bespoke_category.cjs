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

async function updateCategory() {
  const { data, error } = await supabase
    .from("products")
    .update({ 
      category: "earrings", 
      category_label: "Earring Ateliers" 
    })
    .eq("id", "prod-837651")
    .select();

  if (error) {
    console.error("Error updating product category:", error);
    process.exit(1);
  }
  
  console.log("Successfully updated 'Bespoke Royal Creation' category to 'earrings':");
  console.log(data);
}

updateCategory();
