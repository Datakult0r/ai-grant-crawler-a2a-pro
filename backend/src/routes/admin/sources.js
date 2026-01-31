import express from "express";
import { createClient } from "@supabase/supabase-js";
import { requireAdminMiddleware } from "../../middleware/auth.js";
import { requireFields, validateUrlField, validateEnum } from "../../middleware/validation.js";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Apply admin authentication to all routes
router.use(requireAdminMiddleware);

// GET all sources
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("grant_sources")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error('[ADMIN/SOURCES] List error:', error);
      return res.status(500).json({ error: 'Failed to fetch sources' });
    }

    res.json(data || []);
  } catch (err) {
    console.error('[ADMIN/SOURCES] List error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ADD new source
router.post("/",
  requireFields('url', 'name'),
  validateUrlField('url'),
  validateEnum('type', ['manual', 'firecrawl', 'api']),
  validateEnum('scrape_frequency', ['daily', 'weekly', 'monthly']),
  async (req, res) => {
  const { url, name, type, scrape_frequency } = req.body;

  try {
    const { data, error } = await supabase
      .from("grant_sources")
      .insert([{
        url,
        name,
        type: type || 'manual',
        status: 'active',
        scrape_frequency: scrape_frequency || 'daily'
      }])
      .select();

    if (error) {
      console.error('[ADMIN/SOURCES] Insert error:', error);
      return res.status(500).json({ error: 'Failed to create source' });
    }

    res.json(data[0]);
  } catch (err) {
    console.error('[ADMIN/SOURCES] Create error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// UPDATE source (toggle status, update frequency)
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, scrape_frequency, name, url } = req.body;

    // Validate status if provided
    if (status !== undefined && !['active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be "active" or "inactive"' });
    }

    // Validate scrape_frequency if provided
    if (scrape_frequency !== undefined && !['daily', 'weekly', 'monthly'].includes(scrape_frequency)) {
      return res.status(400).json({ error: 'Invalid scrape_frequency. Must be "daily", "weekly", or "monthly"' });
    }

    const updates = {};
    if (status !== undefined) updates.status = status;
    if (scrape_frequency !== undefined) updates.scrape_frequency = scrape_frequency;
    if (name !== undefined) updates.name = name;
    if (url !== undefined) updates.url = url;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const { data, error } = await supabase
      .from("grant_sources")
      .update(updates)
      .eq("id", id)
      .select();

    if (error) {
      console.error('[ADMIN/SOURCES] Update error:', error);
      return res.status(500).json({ error: 'Failed to update source' });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: "Source not found" });
    }

    res.json(data[0]);
  } catch (err) {
    console.error('[ADMIN/SOURCES] Patch error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE source
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("grant_sources")
      .delete()
      .eq("id", id);

    if (error) {
      console.error('[ADMIN/SOURCES] Delete error:', error);
      return res.status(500).json({ error: 'Failed to delete source' });
    }

    res.json({ success: true, message: 'Source deleted successfully' });
  } catch (err) {
    console.error('[ADMIN/SOURCES] Delete error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET source health/stats
router.get("/stats", async (req, res) => {
  try {
    const { data: sources, error } = await supabase
      .from("grant_sources")
      .select("*");

    if (error) {
      console.error('[ADMIN/SOURCES] Stats error:', error);
      return res.status(500).json({ error: 'Failed to fetch source statistics' });
    }

    const sourceList = sources || [];
    const stats = {
      total: sourceList.length,
      active: sourceList.filter(s => s.status === 'active').length,
      inactive: sourceList.filter(s => s.status === 'inactive').length,
      lastCrawled: sourceList
        .filter(s => s.last_crawled_at)
        .sort((a, b) => new Date(b.last_crawled_at) - new Date(a.last_crawled_at))[0]?.last_crawled_at || null
    };

    res.json(stats);
  } catch (err) {
    console.error('[ADMIN/SOURCES] Stats error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
