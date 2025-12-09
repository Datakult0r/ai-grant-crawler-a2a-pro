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

    // 4. Spawn Python Process
    // Assuming we are in backend/src/services, execute from backend root?
    const pythonScriptPath = path.resolve("ai-researcher/main.py");
    // Note: Agent Laboratory main.py might expect different args.
    // We are passing a JSON string as a generic "context" or "grant-data" arg.
    // The implementation plan specified: --grant-data JSON

    const pythonProcess = spawn(
      "python",
      [pythonScriptPath, "--grant-data", JSON.stringify(researchContext)],
      {
        cwd: path.resolve("ai-researcher"), // Run inside the dir to find its imports
      }
    );

    console.log(
      `Spawned Agent Lab for Grant ${grantId} (PID: ${pythonProcess.pid})`
    );

    // 5. Pipe output to SSE
    pythonProcess.stdout.on("data", (data) => {
      const line = data.toString().trim();
      if (!line) return;

      // Try to parse if it's JSON from the agent, or wrap as log
      // The prompt requested specific SSE schema: { type, stage, agent, message }
      // If the python script doesn't output JSON, we might need to parse or wrap it.
      // For this bridge, we wrap generic logs unless they look like JSON events.

      try {
        const parsed = JSON.parse(line);
        if (parsed.type) {
          res.write(`data: ${JSON.stringify(parsed)}\n\n`);
        } else {
          // Pass through as generic log
          res.write(
            `data: ${JSON.stringify({ type: "log", message: line })}\n\n`
          );
        }
      } catch (e) {
        // Not JSON, wrap as text log or try to heuristically detect stage
        res.write(
          `data: ${JSON.stringify({ type: "log", message: line })}\n\n`
        );

        // Heuristic for stage detection if needed for demo compliance
        if (line.includes("Stage:")) {
          res.write(
            `data: ${JSON.stringify({
              type: "stage_started",
              stage: line.split("Stage:")[1].trim(),
              message: line,
            })}\n\n`
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
