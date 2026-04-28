import { supabase } from "./src/integrations/supabase/client.js";

async function checkStorage() {
    console.log("Checking storage buckets...");
    const { data, error } = await supabase.storage.listBuckets();
    
    if (error) {
        console.error("Error listing buckets:", error.message);
        return;
    }
    
    console.log("Found buckets:", data.map(b => b.name));
    
    const productsBucket = data.find(b => b.name === 'products');
    if (!productsBucket) {
        console.log("❌ 'products' bucket is MISSING!");
    } else {
        console.log("✅ 'products' bucket exists.");
    }
}

checkStorage();
