import express from "express";
import { supabase } from "../config/database.js";
import { generateProposalFast } from "../services/geminiService.js";
import { generateResearchProposal } from "../services/aiResearcher.js";
import { addClient, sendEvent, sendLog } from "../utils/sse.js";
import {
  requireFields,
  validateEnum,
  validateUUID,
} from "../middleware/validation.js";
import { logger } from "../utils/logger.js";

const router = express.Router();

/**
 * GET /api/proposal/:id/stream
 * Connect to SSE stream for a specific proposal
 */
router.get("/:id/stream", validateUUID(), (req, res) => {
  const { id } = req.params;

  // SSE Headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  addClient(id, res);

  // Send initial connection message
  sendEvent(id, "connected", { message: "Connected to proposal stream" });
  logger.debug("New SSE client connected", { proposalId: id });
});

/**
 * POST /api/proposal/generate
 * Body: { grantId, companyProfile, mode }
 * mode: 'fast' | 'research'
 */
router.post(
  "/generate",
  requireFields("grantId", "mode"),
  validateEnum("mode", ["fast", "research"]),
  async (req, res) => {
    const { grantId, companyProfile, mode } = req.body;

    try {
      // 1. Fetch grant details
      const { data: grant, error: grantError } = await supabase
        .from("grants")
        .select("*")
        .eq("id", grantId)
        .single();

      if (grantError || !grant) {
        logger.warn("Grant not found during proposal generation", { grantId });
        return res.status(404).json({ error: "Grant not found" });
      }

      // 2. Create proposal record
      const { data: proposal, error: proposalError } = await supabase
        .from("proposals")
        .insert({
          grant_id: grantId,
          mode: mode,
          status: "processing",
        })
        .select()
        .single();

      if (proposalError) throw proposalError;

      logger.info("Started proposal generation", {
        proposalId: proposal.id,
        mode,
        grantId,
      });

      // 3. Start generation (Async)
      // We return the proposal ID immediately so the frontend can poll or listen for SSE
      res.json({ proposalId: proposal.id, status: "processing" });

      // Background processing
      (async () => {
        try {
          let result;
          const startTime = Date.now();

          if (mode === "fast") {
            result = await generateProposalFast(grant, companyProfile);
          } else if (mode === "research") {
            // Pass proposal.id for SSE updates
            result = await generateResearchProposal(
              grant,
              companyProfile,
              proposal.id,
            );
          } else {
            throw new Error("Invalid mode");
          }

          // Update proposal with result (if not already updated by service)
          // Note: generateResearchProposal might update it internally, but we ensure it here for fast mode
          // or if research mode returns the result directly.
          if (mode === "fast" || result) {
            await supabase
              .from("proposals")
              .update({
                full_proposal: result,
                status: "completed",
                generation_time: Math.floor((Date.now() - startTime) / 1000),
              })
              .eq("id", proposal.id);
          }

          if (mode === "research") {
            sendEvent(proposal.id, "complete", { result });
          }
          logger.info("Proposal generation completed", {
            proposalId: proposal.id,
            mode,
          });
        } catch (err) {
          logger.error("Proposal generation failed in background", {
            proposalId: proposal.id,
            error: err,
          });
          await supabase
            .from("proposals")
            .update({
              status: "failed",
              full_proposal: `Error: ${err.message}`,
            })
            .eq("id", proposal.id);

          sendLog(proposal.id, `Error: ${err.message}`, "System", "Failed");
          sendEvent(proposal.id, "error", { error: err.message });
        }
      })();
    } catch (error) {
      logger.error("Error in proposal route", error);
      res.status(500).json({ error: error.message });
    }
  },
);

export default router;
