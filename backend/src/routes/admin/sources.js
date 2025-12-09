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
  const { data, error } = await supabase.from("grant_sources").select("*");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ADD new source
router.post("/", async (req, res) => {
  const { url, name, type } = req.body;
  const { data, error } = await supabase
    .from("grant_sources")
    .insert([{ url, name, type }])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
});

export default router;
