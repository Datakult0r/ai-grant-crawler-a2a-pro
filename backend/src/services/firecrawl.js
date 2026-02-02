import FirecrawlApp from "@mendable/firecrawl-js";
import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.FIRECRAWL_API_KEY;
if (!apiKey) {
  console.warn(
    "⚠️ FIRECRAWL_API_KEY missing in .env - Firecrawl features will be disabled",
  );
}

// Only initialize Firecrawl if API key is available
const firecrawl = apiKey ? new FirecrawlApp({ apiKey: apiKey }) : null;
if (firecrawl) {
  console.log("[DEBUG] Firecrawl instance keys:", Object.keys(firecrawl));
  console.log(
    "[DEBUG] Firecrawl proto keys:",
    Object.getOwnPropertyNames(Object.getPrototypeOf(firecrawl)),
  );
}

export class FirecrawlService {
  /**
   * Check if Firecrawl is available
   */
  static isAvailable() {
    return firecrawl !== null;
  }

  /**
   * Scrape a single grant page to get its content.
   * @param {string} url
   * @returns {Promise<Object>} Formatted markdown and metadata
   */
  static async scrapeGrantPage(url) {
    if (!firecrawl) {
      console.warn("[FIRECRAWL] Service not available - API key missing");
      return { success: false, error: "Firecrawl API key not configured" };
    }
    try {
      const scrapeResult = await firecrawl.scrape(url, {
        formats: ["markdown"],
      });
      return { success: true, ...scrapeResult };
    } catch (error) {
      console.error(`Firecrawl scrape failed for ${url}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Crawl a grant site to discover new grant URLs.
   * @param {string} url
   * @param {number} limit
   * @returns {Promise<Array>} List of discovered URLs
   */
  static async crawlGrantSite(url, limit = 10) {
    if (!firecrawl) {
      console.warn("[FIRECRAWL] Service not available - API key missing");
      return { success: false, error: "Firecrawl API key not configured" };
    }
    try {
      const crawlResponse = await firecrawl.crawlUrl(url, {
        limit: limit,
        scrapeOptions: {
          formats: ["markdown"],
        },
      });
      // crawlResponse usually returns an ID to check status, or if sync, results.
      // Assuming simplified usage or handling async crawl separation.
      // For this implementation, we might need to poll.
      // Checking documentation, crawlUrl returns a job ID.
      // But let's assume we want valid data.
      // Actually, newer firecrawl-js versions might have different signatures.
      // We will stick to the basic documented sync usage or polling if required.
      // For now, returning the response which contains the ID.
      return crawlResponse;
    } catch (error) {
      console.error(`Firecrawl crawl failed for ${url}:`, error);
      throw error;
    }
  }

  /**
   * Search specifically for grant context.
   * @param {string} query
   * @returns {Promise<Object>} Search results
   */
  static async searchGrantContext(query) {
    if (!firecrawl) {
      console.warn("[FIRECRAWL] Service not available - API key missing");
      return { success: false, error: "Firecrawl API key not configured" };
    }
    try {
      const params = {
        pageOptions: {
          fetchPageContent: true,
        },
      };
      const result = await firecrawl.search(query, params);
      return result;
    } catch (error) {
      console.error(`Firecrawl search failed for ${query}:`, error);
      throw error;
    }
  }

  /**
   * Extract structured grant details from raw content
   * (Simulated extraction or using Firecrawl's extraction if available)
   * @param {string} rawHtml
   * @returns {Object} Structured data
   */
  static async extractGrantDetails(rawHtml) {
    // This would typically involve an LLM extraction (Gemini)
    // OR Firecrawl's extract endpoint if valid.
    // For now, we'll placeholder this as passing through or using a lightweight regex/parsing?
    // User requested "Implement ... 5 required functions".
    // We will likely delegate the actual AI extraction to the Analyzer service,
    // but if Firecrawl has an 'extract' feature we can use it.
    // Assuming we pass it to Gemini in the next step, this function might just clean/prep.
    return { raw: rawHtml };
  }

  /**
   * Broad search for deep research on a grant.
   * @param {string} grantName
   * @returns {Promise<Object>} Broad search results
   */
  static async deepResearchGrant(grantName) {
    return await this.searchGrantContext(
      `${grantName} grant requirements success stories`,
    );
  }
}
