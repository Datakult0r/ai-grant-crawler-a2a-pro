import { FirecrawlService } from "./firecrawl.js";
import { GrantAnalyzerService } from "./discovery/analyzer.js";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export class GrantDiscoveryService {
  static async runDiscovery() {
    console.log("Starting Grant Discovery Run...");

    // 1. Fetch active sources
    const { data: sources, error } = await supabase
      .from("grant_sources")
      .select("*")
      .eq("status", "active");

    if (error) {
      console.error("Failed to fetch grant sources:", error);
      return;
    }

    for (const source of sources) {
      try {
        console.log(`Crawling source: ${source.url}`);
        // 2. Crawl
        // FirecrawlService.crawlGrantSite returns a list of URLs or content?
        // Based on implementation, crawlUrl returns a job response.
        // For simplicity/robustness in Phase 1 demo, let's use FirecrawlService.scrapeGrantPage
        // if the source is a direct list, OR handle the crawl job.
        // Assuming "crawlGrantSite" gives us a list of discovered URLs to process.
        // If it returns a job, we might need to wait.
        // Let's assume for this MVP step we assume it returns { data: [ ... items ] } or similar sync-like result
        // if we used the appropriate wait parameter (not shown in my stub but implied by "robust discovery").
        // Alternatively, let's just use scrape if it's a single page aggregator.

        // Let's try to scrape the source page first to find links (simple crawl)
        const crawlResult = await FirecrawlService.scrapeGrantPage(source.url);

        // 3. Process Content
        // In a real scenario, we'd parse links. For now, let's assume the page ITSELF contains grant info
        // to analyze (Simple Aggregator mode).
        if (crawlResult && crawlResult.markdown) {
          const analyzedGrant = await GrantAnalyzerService.analyzeAndScore(
            crawlResult.markdown
          );

          if (analyzedGrant && analyzedGrant.relevance_score > 50) {
            // arbitrary threshold
            // 4. Save
            const { error: insertError } = await supabase.from("grants").upsert(
              {
                name: analyzedGrant.name || "Untitled Grant",
                description: analyzedGrant.description,
                amount: analyzedGrant.amount,
                deadline: analyzedGrant.deadline,
                category: analyzedGrant.category,
                source: source.name || "Automated Discovery",
                source_url: source.url, // unique constraint might trigger here
                relevance_score: analyzedGrant.relevance_score,
                keywords: analyzedGrant.keywords,
                source_id: source.id,
                status: "active",
                raw_data: analyzedGrant,
              },
              { onConflict: "source_url" }
            );

            if (insertError) console.error("Error saving grant:", insertError);
            else console.log(`Saved grant: ${analyzedGrant.name}`);
          }
        }

        // Update source last_crawled_at
        await supabase
          .from("grant_sources")
          .update({ last_crawled_at: new Date() })
          .eq("id", source.id);
      } catch (err) {
        console.error(`Error processing source ${source.url}:`, err);
      }
    }
    console.log("Discovery Run Complete.");
  }
}
