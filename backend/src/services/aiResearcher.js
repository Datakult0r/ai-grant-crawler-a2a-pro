/**
 * AI-Researcher Integration for MODE 2 Proposal Generation
 * Full autonomous research system from https://github.com/HKUDS/AI-Researcher
 */

import { spawn } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { supabase } from "../config/database.js";
import { env } from "../config/env.js";
import { sendLog, sendPhase, sendProgress } from "../utils/sse.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AI_RESEARCHER_PATH = path.join(__dirname, "../../ai-researcher");
const BRIDGE_SCRIPT = "grant_research_bridge.py";

/**
 * MODE 2: Full AI-Researcher Pipeline
 *
 * Executes the Python-based Agent Laboratory to perform autonomous research.
 * Connects to the local Python environment via grant_research_bridge.py.
 */
export const generateResearchProposal = async (
  grantData,
  companyProfile,
  proposalId
) => {
  const startTime = Date.now();

  try {
    console.log(
      `[AI-Researcher MODE 2] Starting research proposal generation for grant: ${grantData.name}`
    );
    sendLog(
      proposalId,
      `Starting autonomous research agents...`,
      "System",
      "Starting"
    );
    sendProgress(proposalId, 0);

    // Prepare Grant Data for Python Bridge
    const bridgeInput = JSON.stringify({
      proposal_id: proposalId, // Critical for workspace isolation
      title: grantData.name,
      description: grantData.description || "No description provided",
      amount: grantData.amount,
      deadline: grantData.deadline,
      category: grantData.category,
      eligibility: grantData.eligibility,
      extra_data: grantData.raw_data,
    });

    // Spawn Python Process
    const pythonProcess = spawn(
      "python3",
      [BRIDGE_SCRIPT, "--grant-data", bridgeInput],
      {
        cwd: AI_RESEARCHER_PATH,
        env: {
          ...process.env,
          PYTHONUNBUFFERED: "1", // Ensure stdout is flushed immediately
          // Pass API keys explicitly if needed, mostly covered by process.env inheritance
          OPENROUTER_API_KEY: env.openRouterKey,
          GEMINI_API_KEY: env.geminiKey,
          OPENAI_API_KEY: env.openAiKey,
          DEEPSEEK_API_KEY: env.deepSeekKey,
        },
      }
    );

    let outputDir = null;
    let finalStatus = "failed";

    // Handle Real-time Output
    pythonProcess.stdout.on("data", (data) => {
      const lines = data.toString().split("\n");
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          // Try to parse JSON events from the bridge
          const event = JSON.parse(line);
          handleBridgeEvent(event, proposalId);

          if (event.type === "result") {
            outputDir = event.output_dir;
          }
          if (event.type === "status" && event.status === "completed") {
            finalStatus = "completed";
          }
        } catch (e) {
          // If not JSON, just log it as a raw message (likely Python print)
          console.log(`[Python Raw]: ${line}`);
          sendLog(proposalId, line, "AI Agent", "Processing");
        }
      }
    });

    pythonProcess.stderr.on("data", (data) => {
      const errorMsg = data.toString();
      console.error(`[Python stderr]: ${errorMsg}`);
      // Don't show all stderr to user, only if critical?
      // Often warnings appear in stderr.
      // sendLog(proposalId, `Log: ${errorMsg}`, 'System', 'Log');
    });

    // Wait for process to finish
    await new Promise((resolve, reject) => {
      pythonProcess.on("close", (code) => {
        if (code === 0 && finalStatus === "completed") {
          resolve();
        } else {
          reject(
            new Error(
              `Research process exited with code ${code}. Status: ${finalStatus}`
            )
          );
        }
      });

      pythonProcess.on("error", (err) => {
        reject(new Error(`Failed to start Python process: ${err.message}`));
      });
    });

    // Process Result
    if (outputDir) {
      const reportPath = path.join(AI_RESEARCHER_PATH, outputDir, "report.txt"); // Bridge saves as report.txt
      const reportContent = await fs.readFile(reportPath, "utf-8");

      // Generate PDF path if it exists
      // const pdfPath = path.join(AI_RESEARCHER_PATH, outputDir, 'tex', 'report.pdf');

      sendLog(
        proposalId,
        "Storing final proposal in database...",
        "System",
        "Saving"
      );
      await storeProposal(
        proposalId,
        reportContent,
        Math.floor((Date.now() - startTime) / 1000)
      );
      sendProgress(proposalId, 100);

      console.log(`[AI-Researcher] Success. Saved to DB.`);
      return reportContent;
    } else {
      throw new Error(
        "Research completed but no output directory was reported."
      );
    }
  } catch (error) {
    console.error("[AI-Researcher MODE 2] Error:", error);
    sendLog(
      proposalId,
      `Critical Failure: ${error.message}`,
      "System",
      "Error"
    );
    throw error;
  }
};

/**
 * Handle events from the Python Bridge
 */
const handleBridgeEvent = (event, proposalId) => {
  switch (event.type) {
    case "stage_started":
      sendPhase(proposalId, mapStageToPhaseId(event.stage));
      sendLog(proposalId, event.message, "Manager", "Phase Change");
      // Estimate progress based on stage
      sendProgress(proposalId, mapStageToProgress(event.stage));
      break;
    case "log":
      sendLog(proposalId, event.message, "Researcher", "Working");
      break;
    case "error":
      sendLog(proposalId, `Error: ${event.message}`, "System", "Error");
      break;
    case "status":
      // Handled in main loop
      break;
    case "result":
      // Handled in main loop
      break;
    default:
      console.log("Unknown event type:", event);
  }
};

// Helper: Map text stages to the numeric phases expected by the Frontend
const mapStageToPhaseId = (stageName) => {
  const lower = stageName.toLowerCase();
  if (lower.includes("literature")) return 2; // Deep Research
  if (lower.includes("plan")) return 3; // Synthesis
  if (lower.includes("data")) return 3;
  if (lower.includes("experiment")) return 3; // Synthesis/Validation
  if (lower.includes("result")) return 3;
  if (lower.includes("report")) return 4; // Writing
  if (lower.includes("refinement")) return 5;
  return 1; // Default
};

const mapStageToProgress = (stageName) => {
  const lower = stageName.toLowerCase();
  if (lower.includes("literature")) return 20;
  if (lower.includes("plan")) return 40;
  if (lower.includes("data")) return 50;
  if (lower.includes("experiment")) return 60;
  if (lower.includes("result")) return 75;
  if (lower.includes("report")) return 85;
  if (lower.includes("refinement")) return 95;
  return 10;
};

const storeProposal = async (proposalId, proposal, duration) => {
  const { error } = await supabase
    .from("proposals")
    .update({
      full_proposal: proposal,
      status: "completed",
      generation_time: duration,
      mode: "research",
    })
    .eq("id", proposalId);

  if (error) throw error;
};
