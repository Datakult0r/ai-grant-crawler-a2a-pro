import express from "express";
import { ResearchService } from "../services/researchService.js";

const router = express.Router();

// Start Research & Stream Logs
router.get("/:id/research", async (req, res) => {
  // Note: User prompt said "POST /api/grants/:id/research", but SSE is usually a GET or we need to handle the connection carefully.
  // Wait, SSE is traditionally GET. But we can do POST if we rely on the client to handle the stream.
  // However, `EventSource` in browser only supports GET.
  // If the requirement is "Execute ... SSE endpoint at /api/research/:id/stream", then let's make it GET.
  // The previous plan said "POST ... Stream stdout via SSE".
  // To be browser-compatible with standard EventSource, GET is safer.
  // But if we use fetch with stream reader, POST is fine.
  // Given "endpoints at /api/research/:id/stream", valid usage implies GET.
  // Let's implement as GET for strict SSE compliance or support POST if args are needed.
  // Since we just need ID, GET is fine.

  // Headers for SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const grantId = req.params.id;
  await ResearchService.startResearch(grantId, res);
});

export default router;
