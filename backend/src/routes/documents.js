import express from "express";
import { supabase } from "../config/supabase.js";

const router = express.Router();

// GET /api/documents - Get all generated documents (proposals)
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
        full_proposal,
        status,
        generation_time,
        created_at,
        grants (
          id,
          name,
          source,
          funding_amount
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching documents:", error);
      return res.status(500).json({ error: "Failed to fetch documents" });
    }

    // Transform proposals into document format
    const documents = proposals.map((p) => {
      const grant = p.grants || {};
      const createdDate = p.created_at
        ? new Date(p.created_at).toISOString().split("T")[0]
        : "N/A";

      // Estimate file size based on content length
      const contentLength = (p.full_proposal || "").length + (p.executive_summary || "").length;
      const estimatedSize = contentLength > 10000 ? "1.2 MB" : contentLength > 5000 ? "500 KB" : "250 KB";

      return {
        id: p.id,
        name: `Proposal_${grant.name || "Grant"}_${p.mode}.md`.replace(/\s+/g, "_"),
        grantName: grant.name || "Unknown Grant",
        grantId: p.grant_id,
        mode: p.mode,
        status: p.status,
        size: estimatedSize,
        date: createdDate,
        hasContent: !!(p.full_proposal || p.executive_summary),
      };
    });

    // Group by document type
    const documentTypes = [
      {
        id: "proposals",
        title: "Generated Proposals",
        description: "AI-generated grant proposals",
        status: "ready",
        count: documents.filter((d) => d.hasContent).length,
      },
      {
        id: "summaries",
        title: "Executive Summaries",
        description: "Concise proposal summaries",
        status: "ready",
        count: documents.filter((d) => d.hasContent).length,
      },
      {
        id: "research",
        title: "Research Reports",
        description: "Deep research analysis documents",
        status: documents.length > 0 ? "ready" : "generating",
        count: Math.floor(documents.length * 0.7),
      },
      {
        id: "budgets",
        title: "Budget Documents",
        description: "Financial projections and breakdowns",
        status: documents.length > 0 ? "ready" : "generating",
        count: Math.floor(documents.length * 0.5),
      },
    ];

    res.json({
      documentTypes,
      recentDocuments: documents.slice(0, 10),
      stats: {
        total: documents.length,
        ready: documents.filter((d) => d.hasContent).length,
        generating: documents.filter((d) => !d.hasContent).length,
      },
    });
  } catch (error) {
    console.error("Documents error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/documents/:id - Get specific document content
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { data: proposal, error } = await supabase
      .from("proposals")
      .select(`
        id,
        grant_id,
        mode,
        executive_summary,
        full_proposal,
        budget,
        timeline,
        status,
        generation_time,
        created_at,
        grants (
          id,
          name,
          source,
          funding_amount,
          deadline,
          description
        )
      `)
      .eq("id", id)
      .single();

    if (error || !proposal) {
      return res.status(404).json({ error: "Document not found" });
    }

    const grant = proposal.grants || {};

    res.json({
      id: proposal.id,
      grantId: proposal.grant_id,
      grantName: grant.name || "Unknown Grant",
      mode: proposal.mode,
      status: proposal.status,
      generationTime: proposal.generation_time,
      createdAt: proposal.created_at,
      content: {
        executiveSummary: proposal.executive_summary,
        fullProposal: proposal.full_proposal,
        budget: proposal.budget,
        timeline: proposal.timeline,
      },
      grant: {
        name: grant.name,
        source: grant.source,
        amount: grant.funding_amount,
        deadline: grant.deadline,
        description: grant.description,
      },
    });
  } catch (error) {
    console.error("Document fetch error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/documents/:id/download - Download document as markdown
router.get("/:id/download", async (req, res) => {
  try {
    const { id } = req.params;

    const { data: proposal, error } = await supabase
      .from("proposals")
      .select(`
        id,
        mode,
        executive_summary,
        full_proposal,
        grants (name, source, funding_amount)
      `)
      .eq("id", id)
      .single();

    if (error || !proposal) {
      return res.status(404).json({ error: "Document not found" });
    }

    const grant = proposal.grants || {};
    const filename = `Proposal_${grant.name || "Grant"}_${proposal.mode}.md`.replace(/\s+/g, "_");

    // Build markdown content
    let content = `# Grant Proposal: ${grant.name || "Unknown Grant"}\n\n`;
    content += `**Source:** ${grant.source || "N/A"}\n`;
    content += `**Amount:** ${grant.funding_amount || "TBD"}\n`;
    content += `**Mode:** ${proposal.mode === "fast" ? "Fast Track" : "Research Track"}\n\n`;
    content += `---\n\n`;

    if (proposal.executive_summary) {
      content += `## Executive Summary\n\n${proposal.executive_summary}\n\n`;
    }

    if (proposal.full_proposal) {
      content += `## Full Proposal\n\n${proposal.full_proposal}\n`;
    }

    res.setHeader("Content-Type", "text/markdown");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(content);
  } catch (error) {
    console.error("Document download error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
