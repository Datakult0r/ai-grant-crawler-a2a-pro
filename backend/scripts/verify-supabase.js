import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log("Testing Supabase Connection...");
console.log("URL:", supabaseUrl);
console.log(
  "Key:",
  supabaseKey ? supabaseKey.substring(0, 10) + "..." : "MISSING"
);

if (
  !supabaseUrl ||
  !supabaseKey ||
  supabaseKey === "INSERT_SUPABASE_KEY_HERE"
) {
  console.error("❌ Missing or invalid Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // Try to select from a non-existent table to check connection
    // We expect a 404 or "relation does not exist" error, which means we connected successfully to the DB
    // If auth fails, we get a 401 or 403
    const { data, error } = await supabase
      .from("non_existent_table_123")
      .select("*")
      .limit(1);

    if (error) {
      // PGRST200 = relation not found (good, means we reached the DB)
      // PGRST205 = relation not found (also good, newer PostgREST versions)
      if (
        error.code === "PGRST200" ||
        error.code === "PGRST205" ||
        error.message.includes("relation") ||
        error.message.includes("does not exist")
      ) {
        console.log("✅ Connection Successful! (Database reachable)");
      } else {
        console.error("❌ Connection Failed:", error.message);
        console.error("Error Code:", error.code);
      }
    } else {
      console.log("✅ Connection Successful! (Table exists?)");
    }
  } catch (err) {
    console.error("❌ Unexpected Error:", err.message);
  }
}

testConnection();
