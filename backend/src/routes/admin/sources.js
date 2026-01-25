import express from "express";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// GET all sources
router.get("/", async (req, res) => {
  const { data, error } = await supabase
    .from("grant_sources")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ADD new source
router.post("/", async (req, res) => {
  const { url, name, type, scrape_frequency } = req.body;
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

  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
});

// UPDATE source (toggle status, update frequency)
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { status, scrape_frequency, name, url } = req.body;
  
  const updates = {};
  if (status !== undefined) updates.status = status;
  if (scrape_frequency !== undefined) updates.scrape_frequency = scrape_frequency;
  if (name !== undefined) updates.name = name;
  if (url !== undefined) updates.url = url;
  
  const { data, error } = await supabase
    .from("grant_sources")
    .update(updates)
    .eq("id", id)
    .select();

  if (error) return res.status(500).json({ error: error.message });
  if (!data || data.length === 0) return res.status(404).json({ error: "Source not found" });
  res.json(data[0]);
});

// DELETE source
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  
  const { error } = await supabase
    .from("grant_sources")
    .delete()
    .eq("id", id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// GET source health/stats
router.get("/stats", async (req, res) => {
  const { data: sources, error } = await supabase
    .from("grant_sources")
    .select("*");
  
  if (error) return res.status(500).json({ error: error.message });
  
  const stats = {
    total: sources.length,
    active: sources.filter(s => s.status === 'active').length,
    inactive: sources.filter(s => s.status === 'inactive').length,
    lastCrawled: sources
      .filter(s => s.last_crawled_at)
      .sort((a, b) => new Date(b.last_crawled_at) - new Date(a.last_crawled_at))[0]?.last_crawled_at || null
  };
  
  res.json(stats);
});

export default router;
