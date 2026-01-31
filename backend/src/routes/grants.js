import express from "express";
import { supabase } from "../config/database.js";
import { logger } from "../utils/logger.js";
import { validateUUID } from "../middleware/validation.js";

const router = express.Router();

// GET /api/grants
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("grants")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    logger.info("Fetched grants list", { count: data.length });
    res.json(data);
  } catch (error) {
    logger.error("Error fetching grants", error);
    res.status(500).json({ error: "Failed to fetch grants" });
  }
});

// GET /api/grants/:id
router.get("/:id", validateUUID(), async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from("grants")
      .select("*, research_data(*)")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // Supabase single() returns this if no rows found
        logger.warn("Grant not found", { id });
        return res.status(404).json({ error: "Grant not found" });
      }
      throw error;
    }

    logger.info("Fetched grant details", { id });
    res.json(data);
  } catch (error) {
    logger.error("Error fetching grant details", error);
    res.status(500).json({ error: "Failed to fetch grant details" });
  }
});

// GET /api/grants/calendar
router.get("/calendar", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("grants")
      .select("id, name, deadline")
      .not("deadline", "is", null)
      .order("deadline", { ascending: true });

    if (error) throw error;

    // Group by month
    const calendar = data.reduce((acc, grant) => {
      const month = new Date(grant.deadline).toLocaleString("default", {
        month: "long",
        year: "numeric",
      });
      if (!acc[month]) acc[month] = [];
      acc[month].push(grant);
      return acc;
    }, {});

    logger.info("Fetched grants calendar", { count: data.length });
    res.json(calendar);
  } catch (error) {
    logger.error("Error fetching grants calendar", error);
    res.status(500).json({ error: "Failed to fetch calendar" });
  }
});

export default router;
