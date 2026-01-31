import { spawn } from "child_process";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// SSE Hardening Configuration
const SSE_CONFIG = {
  TIMEOUT_MS: 60000, // 60 seconds timeout
  HEARTBEAT_INTERVAL_MS: 10000, // 10 seconds heartbeat
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 2000,
};

// Research phases matching Agent Laboratory specification
// See: Agent Laboratory paper - 7 research phases with specialized agents
const RESEARCH_PHASES = [
  { id: 0, name: "Literature Review", description: "PhD Student reviewing relevant literature and prior work", agent: "PhD Student" },
  { id: 1, name: "Plan Formulation", description: "Postdoc and Professor formulating research plan", agent: "Postdoc" },
  { id: 2, name: "Data Preparation", description: "ML Engineer preparing datasets and preprocessing", agent: "ML Engineer" },
  { id: 3, name: "Running Experiments", description: "ML Engineer and SW Engineer running experiments", agent: "ML Engineer" },
  { id: 4, name: "Results Interpretation", description: "Team analyzing and interpreting results", agent: "Professor" },
  { id: 5, name: "Report Writing", description: "PhD Student and Postdoc drafting the report", agent: "PhD Student" },
  { id: 6, name: "Report Refinement", description: "Professor reviewing and refining the final report", agent: "Professor" },
];

export class ResearchService {
  /**
   * Check if OpenRouter API key is available for deep research
   */
  static hasOpenRouterKey() {
    return !!process.env.OPENROUTER_API_KEY;
  }

  /**
   * Start a deep research session for a grant.
   * @param {string} grantId - UUID or ID of the grant
   * @param {Object} res - Express response object for SSE
   */
  static async startResearch(grantId, res) {
    // Check for OpenRouter key - graceful degradation to Fast Track
    if (!this.hasOpenRouterKey()) {
      console.log("OPENROUTER_API_KEY not found, suggesting Fast Track mode");
      res.write(
        `data: ${JSON.stringify({
          type: "fallback",
          message: "Deep research unavailable (OPENROUTER_API_KEY missing). Switching to Fast Track mode.",
          fallbackMode: "fast_track",
        })}\n\n`
      );
      res.end();
      return;
    }
    // 1. Fetch grant data
    const { data: grant, error } = await supabase
      .from("grants")
      .select("*")
      .eq("id", grantId)
      .single();

    if (error || !grant) {
      res.write(
        `data: ${JSON.stringify({
          type: "error",
          message: "Grant not found",
        })}\n\n`
      );
      res.end();
      return;
    }

    // 3. Create Research Record
    const { data: researchRecord, error: researchError } = await supabase
      .from("grant_research")
      .insert({
        grant_id: grant.id, // Ensure type match (UUID vs Int depending on schema, assume handled)
        status: "starting",
      })
      .select()
      .single();

    if (researchError) {
      res.write(
        `data: ${JSON.stringify({
          type: "error",
          message: "Failed to create research record",
        })}\n\n`
      );
      return;
    }

    // 2. Prepare payload (moved after record creation to include ID)
    const researchContext = {
      proposal_id: researchRecord.id, // Use research record ID for workspace isolation
      title: grant.name,
      description: grant.description,
      url: grant.source_url,
      raw_data: grant.raw_data,
    };

    // 4. Spawn Python Process - Using bridge script for Agent Laboratory
    const pythonScriptPath = path.resolve(
      "ai-researcher/grant_research_bridge.py"
    );

    const pythonProcess = spawn(
      "python",
      [pythonScriptPath, "--grant-data", JSON.stringify(researchContext)],
      {
        cwd: path.resolve("ai-researcher"), // Run inside the dir to find its imports
        env: {
          ...process.env,
          PYTHONUNBUFFERED: "1", // Ensure real-time output streaming
        },
      }
    );

    console.log(
      `Spawned Agent Lab for Grant ${grantId} (PID: ${pythonProcess.pid})`
    );

    // Send initial phases info to frontend
    res.write(
      `data: ${JSON.stringify({
        type: "phases_info",
        phases: RESEARCH_PHASES,
        totalPhases: RESEARCH_PHASES.length,
      })}\n\n`
    );

    // 5. Setup heartbeat interval to keep connection alive
    let currentPhase = 0;
    let lastActivityTime = Date.now();
    let isProcessComplete = false;

    const heartbeatInterval = setInterval(() => {
      if (isProcessComplete) {
        clearInterval(heartbeatInterval);
        return;
      }

      // Send heartbeat
      res.write(
        `data: ${JSON.stringify({
          type: "heartbeat",
          timestamp: new Date().toISOString(),
          currentPhase,
          phaseName: RESEARCH_PHASES[currentPhase]?.name || "Unknown",
        })}\n\n`
      );

      // Check for timeout
      const timeSinceLastActivity = Date.now() - lastActivityTime;
      if (timeSinceLastActivity > SSE_CONFIG.TIMEOUT_MS) {
        console.error(`Research timeout for grant ${grantId} after ${SSE_CONFIG.TIMEOUT_MS}ms`);
        res.write(
          `data: ${JSON.stringify({
            type: "timeout",
            message: "Research process timed out. Please try again.",
          })}\n\n`
        );
        pythonProcess.kill();
        clearInterval(heartbeatInterval);
      }
    }, SSE_CONFIG.HEARTBEAT_INTERVAL_MS);

    // 6. Pipe output to SSE
    let buffer = "";

    pythonProcess.stdout.on("data", (data) => {
      lastActivityTime = Date.now(); // Reset timeout on activity
      buffer += data.toString();
      const lines = buffer.split("\n");

      // Process all complete lines (leave incomplete line in buffer)
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        try {
          // The bridge script outputs structured JSON events
          const parsed = JSON.parse(trimmed);

          // Track phase changes
          if (parsed.type === "stage_started" || parsed.type === "phase") {
            const phaseNum = parsed.stage ?? parsed.phase ?? currentPhase;
            currentPhase = phaseNum;
            
                        // Enhanced phase event with phase details and agent info
                        const phaseInfo = RESEARCH_PHASES[currentPhase] || {};
                        res.write(
                          `data: ${JSON.stringify({
                            type: "phase",
                            phase: currentPhase,
                            phaseName: phaseInfo.name || "Unknown",
                            phaseDescription: phaseInfo.description || "",
                            agent: phaseInfo.agent || "System",
                            totalPhases: RESEARCH_PHASES.length,
                            progress: Math.round((currentPhase / RESEARCH_PHASES.length) * 100),
                          })}\n\n`
                        );

            // Update database on stage changes
            supabase
              .from("grant_research")
              .update({ current_stage: currentPhase })
              .eq("id", researchRecord.id)
              .then(() => {});
          } else {
            // Forward other events directly to SSE
            res.write(`data: ${JSON.stringify(parsed)}\n\n`);
          }
        } catch (e) {
          // Not JSON, wrap as text log
          res.write(
            `data: ${JSON.stringify({ type: "log", message: trimmed })}\n\n`
          );
        }
      }
    });

    pythonProcess.stderr.on("data", (data) => {
      lastActivityTime = Date.now(); // Reset timeout on activity
      console.error(`Agent Lab Err: ${data}`);
      res.write(
        `data: ${JSON.stringify({
          type: "log",
          level: "error",
          message: data.toString(),
        })}\n\n`
      );
    });

    pythonProcess.on("close", async (code) => {
      isProcessComplete = true;
      clearInterval(heartbeatInterval);
      
      console.log(`Agent Lab exited with code ${code}`);
      const status = code === 0 ? "completed" : "failed";

      // Update DB
      await supabase
        .from("grant_research")
        .update({ status: status })
        .eq("id", researchRecord.id);

      res.write(
        `data: ${JSON.stringify({ 
          type: "status", 
          status: status,
          finalPhase: currentPhase,
          totalPhases: RESEARCH_PHASES.length,
        })}\n\n`
      );
      res.end();
    });

    // Handle client disconnect
    res.on("close", () => {
      isProcessComplete = true;
      clearInterval(heartbeatInterval);
      if (pythonProcess && !pythonProcess.killed) {
        console.log(`Client disconnected, killing Agent Lab process ${pythonProcess.pid}`);
        pythonProcess.kill();
      }
    });
  }
}
