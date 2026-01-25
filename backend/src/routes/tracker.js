import express from "express";
import { supabase } from "../config/supabase.js";

const router = express.Router();

// GET /api/tracker - Get all proposals grouped by status for kanban board
router.get("/", async (req, res) => {
  try {
    // Fetch all proposals with their associated grant info
    const { data: proposals, error } = await supabase
      .from("proposals")
      .select(`
        id,
        grant_id,
        mode,
        executive_summary,
        status,
        generation_time,
        created_at,
        grants (
          id,
          name,
          source,
          funding_amount,
          deadline
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching proposals:", error);
      return res.status(500).json({ error: "Failed to fetch proposals" });
    }

    // Group proposals by status for kanban board
    const grouped = {
      draft: [],
      applied: [],
      review: [],
      awarded: [],
      rejected: [],
    };

    proposals.forEach((proposal) => {
      const status = proposal.status || "draft";
      const grant = proposal.grants || {};
      
      const item = {
        id: proposal.id,
        grantId: proposal.grant_id,
        grant: grant.name || "Unknown Grant",
        amount: grant.funding_amount || "TBD",
        submitted: proposal.created_at
          ? new Date(proposal.created_at).toISOString().split("T")[0]
          : "N/A",
        status: status,
        mode: proposal.mode,
        source: grant.source || "Unknown",
      };

      if (grouped[status]) {
        grouped[status].push(item);
      } else {
        grouped.draft.push(item);
      }
    });

    res.json({
      applications: grouped,
      stats: {
        total: proposals.length,
        draft: grouped.draft.length,
        applied: grouped.applied.length,
        review: grouped.review.length,
        awarded: grouped.awarded.length,
        rejected: grouped.rejected.length,
      },
    });
  } catch (error) {
    console.error("Tracker error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/tracker/:id - Update proposal status (for drag-and-drop)
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["draft", "applied", "review", "awarded", "rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const { data, error } = await supabase
      .from("proposals")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating proposal status:", error);
      return res.status(500).json({ error: "Failed to update status" });
    }

    res.json({ success: true, proposal: data });
  } catch (error) {
    console.error("Tracker update error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
