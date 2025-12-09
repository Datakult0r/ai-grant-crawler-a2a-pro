import { spawn } from "child_process";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export class ResearchService {
  /**
   * Start a deep research session for a grant.
   * @param {string} grantId - UUID or ID of the grant
   * @param {Object} res - Express response object for SSE
   */
  static async startResearch(grantId, res) {
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

    // 2. Prepare payload
    // We reuse existing data to avoid re-crawling if possible, or provide context.
    const researchContext = {
      title: grant.name,
      description: grant.description,
      url: grant.source_url,
      raw_data: grant.raw_data,
    };

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
      return; // Don't end res yet if we want to keep connection open for debug? No, fail hard.
    }

    // 4. Spawn Python Process - Using bridge script for Agent Laboratory
    const pythonScriptPath = path.resolve("ai-researcher/grant_research_bridge.py");

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

    // 5. Pipe output to SSE
    let buffer = "";

    pythonProcess.stdout.on("data", (data) => {
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

          // Forward the event directly to SSE
          res.write(`data: ${JSON.stringify(parsed)}\n\n`);

          // Update database on stage changes
          if (parsed.type === "stage_started") {
            supabase
              .from("grant_research")
              .update({ current_stage: parsed.stage })
              .eq("id", researchRecord.id)
              .then(() => {});
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
      console.log(`Agent Lab exited with code ${code}`);
      const status = code === 0 ? "completed" : "failed";

      // Update DB
      await supabase
        .from("grant_research")
        .update({ status: status })
        .eq("id", researchRecord.id);

      res.write(
        `data: ${JSON.stringify({ type: "status", status: status })}\n\n`
      );
      res.end();
    });
  }
}
