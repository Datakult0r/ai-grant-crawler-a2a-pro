import { FirecrawlService } from "../src/services/firecrawl.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function testRealTimeSearch() {
  console.log("🚀 Starting Real-Time Search Test");

  const keyword = "AI grants for education";
  console.log(`Query: "${keyword}"`);

  // Check API Keys
  if (!process.env.FIRECRAWL_API_KEY) {
    console.error("❌ Missing FIRECRAWL_API_KEY");
    return;
  }
  if (!process.env.GEMINI_API_KEY) {
    console.error("❌ Missing GEMINI_API_KEY");
    return;
  }

  // 1. Simulate Source Selection (e.g., Grants.gov)
  const source = {
    name: "Test Source (Grants.gov)",
    searchUrl: (k) =>
      `https://www.grants.gov/search-results?keywords=${encodeURIComponent(k)}`,
  };
  const searchUrl = source.searchUrl(keyword);
  console.log(`\n1. Generated Search URL: ${searchUrl}`);

  try {
    // 2. Test Firecrawl Scrape
    console.log("2. Scraping with Firecrawl...");
    const scrapeResult = await FirecrawlService.scrapeGrantPage(searchUrl);

    if (!scrapeResult.success || !scrapeResult.markdown) {
      console.error("❌ Scrape failed:", scrapeResult);
      return;
    }
    console.log(`✅ Scraped ${scrapeResult.markdown.length} chars`);

    // 3. Test Gemini Extraction
    console.log("3. Extracting with Gemini...");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Extract grants from:
    ${scrapeResult.markdown.substring(0, 5000)}
    
    Return JSON array of objects with 'name' and 'amount'. Return [] if none.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    console.log(`\nGemini Response Preview: ${text.substring(0, 100)}...`);

    // Clean JSON
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const grants = JSON.parse(jsonMatch[0]);
      console.log(`\n✅ TEST PASSED: Found ${grants.length} grants.`);
      console.log(JSON.stringify(grants[0], null, 2));
    } else {
      console.warn(
        "⚠️ No JSON found in response (might be expected for this fake query or page structure)",
      );
    }
  } catch (error) {
    console.error("❌ TEST FAILED:", error);
  }
}

testRealTimeSearch();
