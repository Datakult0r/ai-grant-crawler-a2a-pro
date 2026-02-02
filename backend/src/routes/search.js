import express from "express";
import { supabase } from "../config/database.js";
import FirecrawlApp from '@mendable/firecrawl-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from "../config/env.js";

const router = express.Router();

// Initialize Firecrawl if API key is available
let firecrawl = null;
if (env.firecrawlApiKey) {
  firecrawl = new FirecrawlApp({ apiKey: env.firecrawlApiKey });
  console.log('✅ Firecrawl initialized for real-time grant discovery');
}

// Initialize Gemini
const genAI = new GoogleGenerativeAI(env.geminiApiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

// Grant sources to crawl in real-time
const QUICK_SEARCH_SOURCES = [
  {
    name: 'Grants.gov',
    url: 'https://www.grants.gov/search-results',
    searchUrl: (keyword) => `https://www.grants.gov/search-results?keywords=${encodeURIComponent(keyword)}`,
  },
  {
    name: 'NSF Awards',
    url: 'https://www.nsf.gov/awardsearch/simpleSearch.jsp',
    searchUrl: (keyword) => `https://www.nsf.gov/awardsearch/simpleSearch.jsp?queryText=${encodeURIComponent(keyword)}`,
  },
  {
    name: 'Horizon Europe',
    url: 'https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/topic-search',
    searchUrl: (keyword) => `https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/topic-search;keywords=${encodeURIComponent(keyword)}`,
  },
];

/**
 * Crawl a grant source in real-time and extract matching grants
 */
async function crawlSourceRealtime(source, keyword) {
  if (!firecrawl) {
    console.log(`⚠️  Firecrawl not configured, skipping ${source.name}`);
    return [];
  }

  try {
    console.log(`🔍 Real-time crawl: ${source.name} for "${keyword}"`);

    const searchUrl = source.searchUrl(keyword);
    const scrapeResult = await firecrawl.scrapeUrl(searchUrl, {
      formats: ['markdown'],
      waitFor: 2000,
    });

    if (!scrapeResult.success || !scrapeResult.markdown) {
      console.log(`❌ Failed to scrape ${source.name}`);
      return [];
    }

    // Extract grants using Gemini
    const prompt = `Extract ALL grant opportunities from this search results page for keyword "${keyword}".

Source: ${source.name}
Content:
${scrapeResult.markdown.substring(0, 10000)}

Return ONLY a JSON array of grants (max 10). Format:
[{"name":"Grant Title","description":"Brief desc","funding_amount":"$X","deadline":"YYYY-MM-DD","source_url":"https://...","category":"Category"}]

If no grants found, return []`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\[[\s\S]*\]/);

    if (!jsonMatch) {
      return [];
    }

    const grants = JSON.parse(jsonMatch[0]);
    console.log(`✅ Found ${grants.length} new grants from ${source.name}`);

    // Save to database
    const grantsToSave = grants.map(g => ({
      name: g.name,
      description: g.description || '',
      source: source.name,
      source_url: g.source_url || searchUrl,
      funding_amount: g.funding_amount || 'TBD',
      amount: g.funding_amount || 'TBD',
      deadline: g.deadline,
      category: g.category || 'General',
      relevance_score: 85,
      relevance: 85,
      status: 'active',
      discovered_at: new Date().toISOString(),
    }));

    await supabase.from('grants').upsert(grantsToSave, {
      onConflict: 'source_url',
      ignoreDuplicates: true,
    });

    return grantsToSave;
  } catch (error) {
    console.error(`Error crawling ${source.name}:`, error.message);
    return [];
  }
}

/**
 * POST /api/search
 * Search grants by keyword + real-time crawl
 * Body: { query: string }
 */
router.post("/", async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: "Search query is required" });
    }

    const searchTerm = `%${query.trim()}%`;

    // 1. Search database first (fast)
    const { data: dbResults, error } = await supabase
      .from("grants")
      .select("*")
      .or(
        `name.ilike.${searchTerm},description.ilike.${searchTerm},category.ilike.${searchTerm},source.ilike.${searchTerm},eligibility.ilike.${searchTerm}`
      )
      .eq("status", "active")
      .order("relevance_score", { ascending: false })
      .limit(50);

    if (error) throw error;

    console.log(`📊 Found ${dbResults.length} grants in database`);

    // 2. Crawl grant sources in real-time (parallel)
    if (firecrawl) {
      console.log(`🕷️  Starting real-time crawl for "${query}"...`);

      const crawlPromises = QUICK_SEARCH_SOURCES.map(source =>
        crawlSourceRealtime(source, query.trim())
      );

      // Wait for all crawls (with timeout)
      const crawlResults = await Promise.race([
        Promise.all(crawlPromises),
        new Promise(resolve => setTimeout(() => resolve([]), 15000)), // 15s timeout
      ]);

      const newGrants = crawlResults.flat();
      console.log(`🆕 Discovered ${newGrants.length} NEW grants from live crawl`);

      // Combine results
      const allResults = [...dbResults, ...newGrants];

      res.json({
        results: allResults,
        count: allResults.length,
        query: query.trim(),
        sources: {
          database: dbResults.length,
          realtime: newGrants.length,
        },
      });
    } else {
      // No Firecrawl configured, return database results only
      res.json({
        results: dbResults,
        count: dbResults.length,
        query: query.trim(),
        sources: {
          database: dbResults.length,
          realtime: 0,
        },
      });
    }
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Failed to search grants" });
  }
});

/**
 * GET /api/search/grant/:id/deep-dive
 * Get comprehensive information about a specific grant
 */
router.get("/grant/:id/deep-dive", async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch grant details
    const { data: grant, error: grantError } = await supabase
      .from("grants")
      .select("*")
      .eq("id", id)
      .single();

    if (grantError) throw grantError;
    if (!grant) {
      return res.status(404).json({ error: "Grant not found" });
    }

    // Compile comprehensive information
    const deepDive = {
      grant: grant,
      documentation: {
        source_url: grant.source_url,
        description: grant.description,
        eligibility: grant.eligibility,
        requirements: extractRequirements(grant),
        deadlines: {
          deadline: grant.deadline,
          days_left: grant.days_left,
          created_at: grant.created_at,
        },
        funding: {
          amount: grant.funding_amount || grant.amount,
          category: grant.category,
        },
      },
      analysis: {
        relevance_score: grant.relevance_score || grant.relevance,
        keywords: grant.keywords || [],
        region: grant.region,
        country: grant.country,
      },
      metadata: {
        id: grant.id,
        source: grant.source,
        status: grant.status,
        discovered_at: grant.discovered_at || grant.created_at,
        last_updated: grant.updated_at,
      },
    };

    res.json(deepDive);
  } catch (error) {
    console.error("Deep dive error:", error);
    res.status(500).json({ error: "Failed to fetch grant details" });
  }
});

/**
 * Helper: Extract requirements from grant data
 */
function extractRequirements(grant) {
  const requirements = [];

  if (grant.eligibility) {
    requirements.push({
      type: "eligibility",
      description: grant.eligibility,
    });
  }

  if (grant.raw_data?.requirements) {
    requirements.push({
      type: "general",
      description: grant.raw_data.requirements,
    });
  }

  return requirements;
}

export default router;
