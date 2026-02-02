import FirecrawlApp from "@mendable/firecrawl-js";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

// Load grant sources
const sourcesPath = path.join(process.cwd(), "config", "grant-sources.json");
const sources = JSON.parse(fs.readFileSync(sourcesPath, "utf-8")).sources;

console.log(`🔍 Loaded ${sources.length} grant sources to crawl`);

/**
 * Extract grant information from scraped content using Gemini
 */
async function extractGrantsFromContent(url, content, sourceName) {
  const prompt = `You are a grant information extractor. Analyze the following web page content and extract ALL grant opportunities mentioned.

Source: ${sourceName}
URL: ${url}

Content:
${content.substring(0, 15000)}

For each grant found, extract:
1. Grant name/title
2. Description (1-2 sentences)
3. Funding amount (or "TBD" if not mentioned)
4. Deadline date (in YYYY-MM-DD format, or null if not found)
5. Eligibility requirements
6. Direct URL to the grant (or the source URL if not found)
7. Category (AI, Research, Innovation, Climate, Health, Education, etc.)
8. Region/Country

Return ONLY a JSON array of grant objects. If no grants found, return [].
Format:
[
  {
    "name": "Grant Title",
    "description": "Brief description",
    "funding_amount": "$500,000",
    "deadline": "2026-03-15",
    "eligibility": "Who can apply",
    "source_url": "https://...",
    "category": "AI",
    "region": "USA"
  }
]`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Extract JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.log(`❌ No grants found in ${sourceName}`);
      return [];
    }

    const grants = JSON.parse(jsonMatch[0]);
    console.log(`✅ Found ${grants.length} grants from ${sourceName}`);
    return grants;
  } catch (error) {
    console.error(
      `❌ Error extracting grants from ${sourceName}:`,
      error.message,
    );
    return [];
  }
}

/**
 * Crawl a single grant source and extract grants
 */
async function crawlSource(source) {
  console.log(`\n🕷️  Crawling: ${source.name}`);
  console.log(`   URL: ${source.url}`);

  try {
    // Scrape the page with Firecrawl
    const scrapeResult = await firecrawl.scrapeUrl(source.url, {
      formats: ["markdown"],
      waitFor: 3000,
    });

    if (!scrapeResult.success || !scrapeResult.markdown) {
      console.log(`❌ Failed to scrape ${source.name}`);
      return [];
    }

    console.log(`   📄 Scraped ${scrapeResult.markdown.length} characters`);

    // Extract grants using Gemini
    const grants = await extractGrantsFromContent(
      source.url,
      scrapeResult.markdown,
      source.name,
    );

    if (grants.length === 0) {
      return [];
    }

    // Save grants to database
    const grantsToInsert = grants.map((grant) => ({
      name: grant.name,
      description: grant.description,
      source: source.name,
      source_url: grant.source_url || source.url,
      funding_amount: grant.funding_amount || "TBD",
      amount: grant.funding_amount || "TBD",
      deadline: grant.deadline,
      eligibility: grant.eligibility,
      category: grant.category || "General",
      region: grant.region || source.region,
      country: grant.region || source.region,
      relevance_score: 75, // Default score
      relevance: 75,
      status: "active",
      keywords: [grant.category, source.type],
      discovered_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from("grants")
      .upsert(grantsToInsert, {
        onConflict: "source_url",
        ignoreDuplicates: true,
      })
      .select();

    if (error) {
      console.error(`❌ Database error for ${source.name}:`, error.message);
      return [];
    }

    console.log(`   💾 Saved ${data.length} new grants to database`);
    return data;
  } catch (error) {
    console.error(`❌ Error crawling ${source.name}:`, error.message);
    return [];
  }
}

/**
 * Main discovery function
 */
async function discoverGrants() {
  console.log("\n🚀 Starting Grant Discovery Process");
  console.log("===================================\n");

  // Filter sources by priority
  const highPrioritySources = sources.filter((s) => s.priority === "high");
  console.log(
    `📊 Processing ${highPrioritySources.length} high-priority sources first\n`,
  );

  let totalGrantsFound = 0;

  // Crawl high-priority sources first
  for (const source of highPrioritySources) {
    const grants = await crawlSource(source);
    totalGrantsFound += grants.length;

    // Rate limiting - wait 2 seconds between sources
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  console.log("\n===================================");
  console.log(`✅ Discovery Complete!`);
  console.log(`   Total new grants discovered: ${totalGrantsFound}`);
  console.log("===================================\n");

  // Check total grants in database
  const { count } = await supabase
    .from("grants")
    .select("*", { count: "exact", head: true });

  console.log(`📊 Total grants in database: ${count}`);

  process.exit(0);
}

// Run discovery
discoverGrants().catch((error) => {
  console.error("❌ Discovery failed:", error);
  process.exit(1);
});
