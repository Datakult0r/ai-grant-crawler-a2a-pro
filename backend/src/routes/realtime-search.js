import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "../config/database.js";
import { env } from "../config/env.js";
import { FirecrawlService } from "../services/firecrawl.js";

const router = express.Router();

// Check if Firecrawl is available
if (FirecrawlService.isAvailable()) {
  console.log("✅ Firecrawl initialized for real-time grant discovery");
} else {
  console.warn(
    "⚠️  FIRECRAWL_API_KEY not found - real-time search will not work",
  );
}

// Initialize Gemini
const genAI = new GoogleGenerativeAI(env.geminiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

/**
 * PUBLIC GRANT DATABASES TO SEARCH
 * These are crawled in real-time when user searches
 */
const GRANT_SOURCES = [
  {
    name: "Grants.gov (USA)",
    searchUrl: (keyword) =>
      `https://www.grants.gov/search-results?keywords=${encodeURIComponent(keyword)}`,
    priority: "high",
  },
  {
    name: "NSF (USA)",
    searchUrl: (keyword) =>
      `https://www.nsf.gov/awardsearch/simpleSearch.jsp?queryText=${encodeURIComponent(keyword)}`,
    priority: "high",
  },
  {
    name: "Horizon Europe",
    searchUrl: (keyword) =>
      `https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/topic-search;keywords=${encodeURIComponent(keyword)}`,
    priority: "high",
  },
  {
    name: "Portugal - ANI",
    searchUrl: (keyword) =>
      `https://www.ani.pt/pt/apoios-e-incentivos/?search=${encodeURIComponent(keyword)}`,
    priority: "high",
  },
  {
    name: "Portugal - IAPMEI",
    searchUrl: (keyword) =>
      `https://www.iapmei.pt/PRODUTOS-E-SERVICOS/Incentivos-Financiamento.aspx?search=${encodeURIComponent(keyword)}`,
    priority: "high",
  },
  {
    name: "Portugal - COMPETE 2030",
    searchUrl: (keyword) =>
      `https://www.compete2030.gov.pt/?s=${encodeURIComponent(keyword)}`,
    priority: "high",
  },
  {
    name: "EIC Accelerator",
    searchUrl: (keyword) =>
      `https://eic.ec.europa.eu/eic-funding-opportunities_en?search=${encodeURIComponent(keyword)}`,
    priority: "medium",
  },
  {
    name: "UK Innovate",
    searchUrl: (keyword) =>
      `https://apply-for-innovation-funding.service.gov.uk/competition/search?searchQuery=${encodeURIComponent(keyword)}`,
    priority: "medium",
  },
  {
    name: "European Research Council (ERC)",
    searchUrl: (keyword) =>
      `https://erc.europa.eu/funding/open-calls?search=${encodeURIComponent(keyword)}`,
    priority: "high",
  },
  {
    name: "NIH Grants (USA)",
    searchUrl: (keyword) =>
      `https://grants.nih.gov/funding/searchguide/search-guide.cfm?keyword=${encodeURIComponent(keyword)}`,
    priority: "medium",
  },
  {
    name: "DARPA Opportunities",
    searchUrl: (keyword) =>
      `https://www.darpa.mil/work-with-us/opportunities?search=${encodeURIComponent(keyword)}`,
    priority: "medium",
  },
  {
    name: "Canada - NSERC",
    searchUrl: (keyword) =>
      `https://www.nserc-crsng.gc.ca/Professors-Professeurs/Grants-Subs/index_eng.asp?search=${encodeURIComponent(keyword)}`,
    priority: "low",
  },
  {
    name: "Australia - ARC Grants",
    searchUrl: (keyword) =>
      `https://www.arc.gov.au/grants-funding?search=${encodeURIComponent(keyword)}`,
    priority: "low",
  },
  {
    name: "Germany - DFG",
    searchUrl: (keyword) =>
      `https://www.dfg.de/en/research_funding/programmes/index.jsp?search=${encodeURIComponent(keyword)}`,
    priority: "low",
  },
  {
    name: "France - ANR",
    searchUrl: (keyword) =>
      `https://anr.fr/en/call-for-proposals-all-types/?search=${encodeURIComponent(keyword)}`,
    priority: "low",
  },
  {
    name: "Netherlands - NWO",
    searchUrl: (keyword) =>
      `https://www.nwo.nl/en/calls?search=${encodeURIComponent(keyword)}`,
    priority: "low",
  },
  {
    name: "Switzerland - SNF",
    searchUrl: (keyword) =>
      `https://www.snf.ch/en/funding?search=${encodeURIComponent(keyword)}`,
    priority: "low",
  },
  {
    name: "Bill & Melinda Gates Foundation",
    searchUrl: (keyword) =>
      `https://www.gatesfoundation.org/about/how-we-work/general-information/grant-opportunities?search=${encodeURIComponent(keyword)}`,
    priority: "medium",
  },
  {
    name: "Wellcome Trust",
    searchUrl: (keyword) =>
      `https://wellcome.org/grant-funding/schemes?search=${encodeURIComponent(keyword)}`,
    priority: "medium",
  },
  {
    name: "Chan Zuckerberg Initiative",
    searchUrl: (keyword) =>
      `https://chanzuckerberg.com/grants-ventures/grants/?search=${encodeURIComponent(keyword)}`,
    priority: "medium",
  },
  {
    name: "Ford Foundation",
    searchUrl: (keyword) =>
      `https://www.fordfoundation.org/work/challenging-inequality/grants/?search=${encodeURIComponent(keyword)}`,
    priority: "low",
  },
  {
    name: "Robert Wood Johnson Foundation",
    searchUrl: (keyword) =>
      `https://www.rwjf.org/en/how-we-work/grants-and-grant-programs.html?search=${encodeURIComponent(keyword)}`,
    priority: "low",
  },
  {
    name: "UK Research and Innovation (UKRI)",
    searchUrl: (keyword) =>
      `https://www.ukri.org/opportunity/?search=${encodeURIComponent(keyword)}`,
    priority: "medium",
  },
  {
    name: "European Innovation Council",
    searchUrl: (keyword) =>
      `https://eic.ec.europa.eu/eic-funding-opportunities_en?search=${encodeURIComponent(keyword)}`,
    priority: "high",
  },
  {
    name: "Spain - CDTI",
    searchUrl: (keyword) =>
      `https://www.cdti.es/en/funding-opportunities?search=${encodeURIComponent(keyword)}`,
    priority: "low",
  },
  {
    name: "Italy - MIUR",
    searchUrl: (keyword) =>
      `https://www.mur.gov.it/en/research-and-innovation/funding?search=${encodeURIComponent(keyword)}`,
    priority: "low",
  },
  {
    name: "Nordic Innovation",
    searchUrl: (keyword) =>
      `https://www.nordicinnovation.org/funding?search=${encodeURIComponent(keyword)}`,
    priority: "low",
  },
  {
    name: "Japan - JST",
    searchUrl: (keyword) =>
      `https://www.jst.go.jp/EN/funding/?search=${encodeURIComponent(keyword)}`,
    priority: "low",
  },
  {
    name: "Singapore - NRF",
    searchUrl: (keyword) =>
      `https://www.nrf.gov.sg/programmes?search=${encodeURIComponent(keyword)}`,
    priority: "low",
  },
  {
    name: "Israel Innovation Authority",
    searchUrl: (keyword) =>
      `https://innovationisrael.org.il/en/program?search=${encodeURIComponent(keyword)}`,
    priority: "low",
  },
];

/**
 * Crawl a grant database and extract matching opportunities
 */
async function crawlSource(source, keyword) {
  try {
    console.log(`🔍 Crawling ${source.name} for "${keyword}"...`);

    const searchUrl = source.searchUrl(keyword);

    // Scrape the page using FirecrawlService
    const scrapeResult = await FirecrawlService.scrapeGrantPage(searchUrl);

    if (!scrapeResult.success || !scrapeResult.markdown) {
      console.log(`❌ Failed to scrape ${source.name}`);
      return [];
    }

    // Extract grants using Gemini
    const prompt = `You are searching for grant/investment opportunities about "${keyword}".
Extract ALL relevant grants from this page.

Source: ${source.name}
Content:
${scrapeResult.markdown.substring(0, 12000)}

Return ONLY a JSON array (max 20 grants). Each grant should have:
- name: Grant title
- description: Brief 1-2 sentence description
- amount: Funding amount (or "Not specified")
- deadline: Deadline in YYYY-MM-DD format (or null)
- url: Direct link to the grant
- eligibility: Who can apply (brief)
- category: Main category (AI, Research, Innovation, etc.)

Format: [{"name":"...","description":"...","amount":"...","deadline":"...","url":"...","eligibility":"...","category":"..."}]

If NO grants found, return: []`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Extract JSON
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.log(`⚠️  No grants extracted from ${source.name}`);
      return [];
    }

    const grants = JSON.parse(jsonMatch[0]);
    console.log(`✅ ${source.name}: Found ${grants.length} grants`);

    // Add source metadata
    return grants.map((grant) => ({
      ...grant,
      source: source.name,
      discovered_at: new Date().toISOString(),
    }));
  } catch (error) {
    console.error(`❌ Error crawling ${source.name}:`, error.message);
    return [];
  }
}

/**
 * POST /api/realtime-search
 * Real-time grant discovery - NO database, pure web crawling
 */
router.post("/", async (req, res) => {
  try {
    const { keyword } = req.body;

    if (!keyword || keyword.trim().length === 0) {
      return res.status(400).json({ error: "Keyword is required" });
    }

    console.log(`\n🚀 Starting real-time search for: "${keyword}"\n`);

    // Crawl all high-priority sources in parallel
    const highPrioritySources = GRANT_SOURCES.filter(
      (s) => s.priority === "high",
    );

    const crawlPromises = highPrioritySources.map((source) =>
      crawlSource(source, keyword.trim()),
    );

    // Wait for all crawls with 30s timeout
    const results = await Promise.race([
      Promise.all(crawlPromises),
      new Promise((resolve) =>
        setTimeout(() => {
          console.log("⏱️  Search timeout reached");
          resolve([]);
        }, 30000),
      ),
    ]);

    const allGrants = results.flat();

    console.log(
      `\n✅ Search complete: ${allGrants.length} total grants found\n`,
    );

    res.json({
      results: allGrants,
      count: allGrants.length,
      keyword: keyword.trim(),
      sources_searched: highPrioritySources.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Real-time search error:", error);
    res.status(500).json({ error: "Search failed" });
  }
});

/**
 * POST /api/realtime-search/save
 * Save a selected grant to user's saved list
 */
router.post("/save", async (req, res) => {
  try {
    const grant = req.body;

    // Save to user's saved grants
    const { data, error } = await supabase
      .from("saved_grants")
      .insert({
        name: grant.name,
        description: grant.description,
        source: grant.source,
        source_url: grant.url,
        amount: grant.amount,
        deadline: grant.deadline,
        eligibility: grant.eligibility,
        category: grant.category,
        saved_at: new Date().toISOString(),
        status: "interested",
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      grant: data,
      message: "Grant saved to your list",
    });
  } catch (error) {
    console.error("Save grant error:", error);
    res.status(500).json({ error: "Failed to save grant" });
  }
});

/**
 * GET /api/realtime-search/saved
 * Get user's saved grants
 */
router.get("/saved", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("saved_grants")
      .select("*")
      .order("saved_at", { ascending: false });

    if (error) throw error;

    res.json({
      results: data || [],
      count: data?.length || 0,
    });
  } catch (error) {
    console.error("Get saved grants error:", error);
    res.status(500).json({ error: "Failed to fetch saved grants" });
  }
});

export default router;
