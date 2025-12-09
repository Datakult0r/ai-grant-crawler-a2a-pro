<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import {
    LabRenderer,
    Sprite,
    BreadcrumbStage,
  } from "$lib/litecanvasRenderer.js";

  // Props - grantId is the primary prop for SSE streaming
  let {
    grantId,
    proposalId = null,
  }: { grantId: string; proposalId?: string | null } = $props();

  // Canvas refs
  let canvasElement: HTMLCanvasElement;
  let renderer: LabRenderer | null = null;

  // SSE connection
  let eventSource: EventSource | null = null;

  // Game state
  let sprites = $state<Sprite[]>([]);
  let breadcrumbs = $state<BreadcrumbStage[]>([]);
  let currentStageIndex = $state(0);
  let logs = $state<
    Array<{ timestamp: string; message: string; agent: string; status: string }>
  >([]);
  let selectedStageIndex = $state<number | null>(null);
  let stageLogs = $derived(
    selectedStageIndex !== null ? getLogsForStage(selectedStageIndex) : []
  );

  // 7 Research stages (matching aiResearcher.js phases)
  const STAGES = [
    "Literature Review",
    "Plan Formulation",
    "Data Preparation",
    "Running Experiments",
    "Results Interpretation",
    "Report Writing",
    "Report Refinement",
  ];

  // Researcher data (5 agents matching the pixel sprites)
  const RESEARCHERS = [
    { id: 0, name: "Lit Reviewer", color: "#8b5cf6", spriteRow: 0 },
    { id: 1, name: "Idea Generator", color: "#3b82f6", spriteRow: 1 },
    { id: 2, name: "Data Analyst", color: "#10b981", spriteRow: 2 },
    { id: 3, name: "Experimenter", color: "#f59e0b", spriteRow: 3 },
    { id: 4, name: "Paper Writer", color: "#ec4899", spriteRow: 4 },
  ];

  // Sprite positions for each stage
  const STAGE_POSITIONS: Record<number, Array<{ x: number; y: number }>> = {
    0: [
      // Literature Review - researchers at desks
      { x: 100, y: 400 },
      { x: 250, y: 400 },
      { x: 400, y: 400 },
      { x: 550, y: 400 },
    ],
    1: [
      // Plan Formulation - gather at meeting table
      { x: 300, y: 350 },
      { x: 400, y: 350 },
      { x: 500, y: 350 },
      { x: 400, y: 450 },
    ],
    2: [
      // Data Preparation - spread out
      { x: 100, y: 300 },
      { x: 650, y: 300 },
      { x: 100, y: 500 },
      { x: 650, y: 500 },
    ],
    3: [
      // Running Experiments - clustered around center
      { x: 350, y: 400 },
      { x: 450, y: 400 },
      { x: 400, y: 350 },
      { x: 400, y: 450 },
    ],
    4: [
      // Results Interpretation - around whiteboard
      { x: 150, y: 350 },
      { x: 250, y: 350 },
      { x: 150, y: 450 },
      { x: 250, y: 450 },
    ],
    5: [
      // Report Writing - writer focus
      { x: 400, y: 400 },
      { x: 300, y: 350 },
      { x: 500, y: 350 },
      { x: 400, y: 500 },
    ],
    6: [
      // Report Refinement - celebration circle
      { x: 350, y: 350 },
      { x: 450, y: 350 },
      { x: 350, y: 450 },
      { x: 450, y: 450 },
    ],
  };

  /**
   * Initialize renderer and assets
   */
  onMount(async () => {
    if (!canvasElement) return;

    // Create renderer
    renderer = new LabRenderer(canvasElement, {
      width: 800,
      height: 600,
      fps: 30,
    });

    // Load assets
    try {
      await renderer.loadAssets({
        researchers: "/assets/lab/LabNPCs.png",
        floor: "/assets/lab/tiles/tilesFloor32.png",
        stuff: "/assets/lab/tiles/tilesStuff.png",
      });
    } catch (error) {
      console.error("[ResearchViz] Failed to load assets:", error);
      return;
    }

    // Initialize breadcrumbs (7 stages)
    breadcrumbs = STAGES.map((name, index) => {
      const x = 80 + index * 100;
      const y = 50;
      return new BreadcrumbStage(index, name, x, y);
    });

    // Set first stage as in-progress
    if (breadcrumbs.length > 0) {
      breadcrumbs[0].status = "in-progress";
    }

    // Initialize sprites (4 researchers)
    sprites = RESEARCHERS.map((researcher, index) => {
      const pos = STAGE_POSITIONS[0][index];
      const sprite = new Sprite(
        pos.x,
        pos.y,
        "researchers",
        16, // frame width (16px sprites)
        16 // frame height
      );
      // Store researcher metadata
      (sprite as any).researcherId = researcher.id;
      (sprite as any).color = researcher.color;
      return sprite;
    });

    // Start game loop
    renderer.start(update, draw);

    // Connect to SSE stream (grantId takes priority)
    if (grantId || proposalId) {
      connectToSSE();
    }
  });

  /**
   * Connect to SSE stream for real-time updates
   * Primary endpoint: /api/research/{grantId}/stream
   * Fallback: /api/proposal/{proposalId}/stream
   */
  function connectToSSE() {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

    // Use grantId-based endpoint as primary (per spec)
    let sseUrl: string;
    if (grantId) {
      sseUrl = `${apiUrl}/api/research/${grantId}/stream`;
    } else if (proposalId) {
      sseUrl = `${apiUrl}/api/proposal/${proposalId}/stream`;
    } else {
      console.error("[ResearchViz] No grantId or proposalId provided");
      return;
    }

    console.log("[ResearchViz] Connecting to SSE:", sseUrl);
    eventSource = new EventSource(sseUrl);

    eventSource.addEventListener("connected", (e) => {
      console.log("[ResearchViz] Connected to SSE stream");
      addLog("System", "Connected to research stream", "Connected");
    });

    // Handle SSE events per schema:
    // { type: "stage_started" | "stage_completed" | "agent_active" | "agent_idle", stage, agent, message }
    eventSource.addEventListener("message", (e) => {
      try {
        const data = JSON.parse(e.data);
        handleSSEEvent(data);
      } catch (err) {
        // Keep-alive or malformed message
      }
    });

    eventSource.addEventListener("log", (e) => {
      const data = JSON.parse(e.data);
      addLog(data.agent || "System", data.message, data.status || "Processing");

      // Activate corresponding agent sprite
      if (data.agent) {
        activateAgentByName(data.agent);
      }
    });

    eventSource.addEventListener("phase", (e) => {
      const data = JSON.parse(e.data);
      updateStage(data.phase);
    });

    eventSource.addEventListener("progress", (e) => {
      const data = JSON.parse(e.data);
      console.log("[ResearchViz] Progress:", data.percentage);
    });

    eventSource.addEventListener("complete", (e) => {
      console.log("[ResearchViz] Research complete");
      // Mark all stages as completed
      breadcrumbs.forEach((b) => (b.status = "completed"));
      addLog("System", "Research completed successfully!", "Complete");
    });

    eventSource.addEventListener("error", (e) => {
      console.error("[ResearchViz] SSE error:", e);
    });

    eventSource.onerror = () => {
      console.error("[ResearchViz] SSE connection error");
      // Attempt reconnection after delay
      setTimeout(() => {
        if (!eventSource || eventSource.readyState === EventSource.CLOSED) {
          connectToSSE();
        }
      }, 5000);
    };
  }

  /**
   * Handle SSE events per the defined schema
   */
  function handleSSEEvent(data: {
    type: string;
    stage?: string;
    agent?: string;
    message?: string;
  }) {
    const { type, stage, agent, message } = data;

    switch (type) {
      case "stage_started":
        const startIndex = STAGES.findIndex(
          (s) =>
            s.toLowerCase() === stage?.toLowerCase() ||
            s.toLowerCase().includes(stage?.toLowerCase() || "")
        );
        if (startIndex >= 0) {
          updateStage(startIndex);
        }
        if (message) addLog(agent || "System", message, "In Progress");
        break;

      case "stage_completed":
        const completeIndex = STAGES.findIndex(
          (s) =>
            s.toLowerCase() === stage?.toLowerCase() ||
            s.toLowerCase().includes(stage?.toLowerCase() || "")
        );
        if (completeIndex >= 0 && breadcrumbs[completeIndex]) {
          breadcrumbs[completeIndex].status = "completed";
          // Move to next stage if available
          if (completeIndex + 1 < breadcrumbs.length) {
            updateStage(completeIndex + 1);
          }
        }
        if (message) addLog(agent || "System", message, "Completed");
        break;

      case "agent_active":
        activateAgentByName(agent || "");
        if (message) addLog(agent || "Agent", message, "Active");
        break;

      case "agent_idle":
        // Reset agent animation
        if (message) addLog(agent || "Agent", message, "Idle");
        break;

      default:
        if (message) addLog(agent || "System", message, "Info");
    }
  }

  /**
   * Add a log entry
   */
  function addLog(agent: string, message: string, status: string) {
    logs = [
      ...logs,
      {
        timestamp: new Date().toLocaleTimeString(),
        message,
        agent,
        status,
      },
    ];

    // Keep only last 200 logs
    if (logs.length > 200) {
      logs = logs.slice(-200);
    }
  }

  /**
   * Activate agent sprite animation by name
   */
  function activateAgentByName(agentName: string) {
    const agentIndex = RESEARCHERS.findIndex(
      (r) =>
        r.name.toLowerCase().includes(agentName.toLowerCase()) ||
        agentName.toLowerCase().includes(r.name.toLowerCase().split(" ")[0])
    );

    if (agentIndex >= 0 && sprites[agentIndex]) {
      // Trigger bounce animation
      sprites[agentIndex].moving = true;
      setTimeout(() => {
        if (sprites[agentIndex]) sprites[agentIndex].moving = false;
      }, 2000);
    }
  }

  /**
   * Update current stage
   */
  function updateStage(stageIndex: number) {
    if (stageIndex < 0 || stageIndex >= breadcrumbs.length) return;

    // Mark previous stages as completed
    for (let i = 0; i < stageIndex; i++) {
      breadcrumbs[i].status = "completed";
    }

    // Mark current stage as in-progress
    breadcrumbs[stageIndex].status = "in-progress";

    // Mark future stages as pending
    for (let i = stageIndex + 1; i < breadcrumbs.length; i++) {
      breadcrumbs[i].status = "pending";
    }

    currentStageIndex = stageIndex;

    // Move sprites to new positions
    const positions = STAGE_POSITIONS[stageIndex] || STAGE_POSITIONS[0];
    sprites.forEach((sprite, index) => {
      if (positions[index]) {
        sprite.moveTo(positions[index].x, positions[index].y);
      }
    });
  }

  /**
   * Game update loop
   */
  function update(deltaTime: number) {
    if (!renderer) return;

    // Update all sprites
    sprites.forEach((sprite) => sprite.update(deltaTime));
  }

  /**
   * Game draw loop
   */
  function draw(ctx: CanvasRenderingContext2D) {
    if (!renderer) return;

    // Draw background floor
    renderer.rect(0, 0, 800, 600, "#1a1a2e");

    // Draw lab floor tiles (simple pattern)
    for (let y = 120; y < 600; y += 32) {
      for (let x = 0; x < 800; x += 32) {
        renderer.rect(x, y, 30, 30, "#252842");
        renderer.rect(x, y, 30, 30, "#1f1f38");
      }
    }

    // Draw breadcrumb timeline
    breadcrumbs.forEach((breadcrumb) => breadcrumb.draw(renderer!));

    // Draw meeting table (center area)
    if (currentStageIndex === 1 || currentStageIndex === 3) {
      renderer.rect(320, 360, 160, 80, "#4a4a6a");
      renderer.rectOutline(320, 360, 160, 80, "#6b6b8a", 2);
    }

    // Draw whiteboard (left area during Results Interpretation)
    if (currentStageIndex === 4) {
      renderer.rect(80, 300, 120, 180, "#f5f5f5");
      renderer.rectOutline(80, 300, 120, 180, "#333", 3);
      renderer.text("RESULTS", 90, 320, "#333", "bold 14px monospace");
      renderer.text("• Accuracy: 94%", 90, 350, "#10b981", "10px monospace");
      renderer.text("• Speed: +40%", 90, 370, "#10b981", "10px monospace");
    }

    // Draw sprites
    sprites.forEach((sprite, index) => {
      // Calculate sprite position in spritesheet
      const researcher = RESEARCHERS[index];
      const sx = sprite.currentFrame * 16; // 16px sprite width
      const sy = researcher.spriteRow * 16; // 16px sprite height

      renderer!.drawSprite(
        "researchers",
        sx,
        sy,
        16,
        16,
        sprite.x - 16,
        sprite.y - 16, // Center sprite
        32,
        32 // 2x scale
      );

      // Draw researcher name tag
      renderer!.textCentered(
        researcher.name,
        sprite.x,
        sprite.y + 25,
        researcher.color,
        "bold 9px monospace"
      );
    });

    // Draw stage title
    if (currentStageIndex < STAGES.length) {
      renderer.rect(200, 570, 400, 25, "rgba(0, 0, 0, 0.7)");
      renderer.textCentered(
        `Stage ${currentStageIndex + 1}/7: ${STAGES[currentStageIndex]}`,
        400,
        587,
        "#f59e0b",
        "bold 14px monospace"
      );
    }
  }

  /**
   * Handle breadcrumb click
   */
  function handleStageClick(index: number) {
    selectedStageIndex = selectedStageIndex === index ? null : index;
  }

  /**
   * Get logs for selected stage
   */
  function getLogsForStage(stageIndex: number): typeof logs {
    const stageName = STAGES[stageIndex];
    return logs.filter(
      (log) =>
        log.message.toLowerCase().includes(stageName.toLowerCase()) ||
        log.agent.toLowerCase().includes(stageName.toLowerCase())
    );
  }

  /**
   * Cleanup
   */
  onDestroy(() => {
    if (renderer) {
      renderer.stop();
    }
    if (eventSource) {
      eventSource.close();
    }
  });
</script>

<div class="research-visualization">
  <!-- Canvas Container -->
  <div class="canvas-container">
    <canvas
      bind:this={canvasElement}
      class="pixel-canvas"
      width="800"
      height="600"
    ></canvas>
  </div>

  <!-- Interactive Breadcrumb Overlay (HTML for better interactivity) -->
  <div class="breadcrumb-overlay">
    {#each breadcrumbs as breadcrumb, index}
      <button
        class="breadcrumb-btn"
        class:selected={selectedStageIndex === index}
        style="left: {breadcrumb.x - 30}px; top: {breadcrumb.y - 30}px;"
        onclick={() => handleStageClick(index)}
        title={`Click to view ${breadcrumb.name} logs`}
      >
        <span class="sr-only">{breadcrumb.name}</span>
      </button>
    {/each}
  </div>

  <!-- Logs Sidebar (Expandable Panel) -->
  {#if selectedStageIndex !== null}
    <div class="logs-panel">
      <div class="logs-header">
        <h3 class="logs-title">{STAGES[selectedStageIndex]} - Activity Log</h3>
        <button onclick={() => (selectedStageIndex = null)} class="close-btn"
          >×</button
        >
      </div>

      <div class="logs-content">
        {#if stageLogs.length === 0}
          <p class="no-logs">No activity logs for this stage yet.</p>
        {:else}
          {#each stageLogs as log}
            <div class="log-entry">
              <div class="log-header">
                <span class="log-agent">{log.agent}</span>
                <span class="log-timestamp">{log.timestamp}</span>
              </div>
              <p class="log-message">{log.message}</p>
              <span class="log-status status-{log.status.toLowerCase()}"
                >{log.status}</span
              >
            </div>
          {/each}
        {/if}
      </div>
    </div>
  {/if}

  <!-- All Logs (Bottom expandable) -->
  <div class="all-logs-section">
    <details>
      <summary>View All Activity Logs ({logs.length})</summary>
      <div class="all-logs-content">
        {#each logs as log}
          <div class="log-entry-small">
            <span class="log-time">{log.timestamp}</span>
            <span class="log-agent-badge">{log.agent}</span>
            <span class="log-msg">{log.message}</span>
          </div>
        {/each}
      </div>
    </details>
  </div>
</div>

<style>
  .research-visualization {
    position: relative;
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
  }

  .canvas-container {
    position: relative;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    background: #1a1a2e;
  }

  .pixel-canvas {
    display: block;
    width: 100%;
    height: auto;
    image-rendering: pixelated;
    image-rendering: crisp-edges;
  }

  /* Breadcrumb overlay for clickable areas */
  .breadcrumb-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  .breadcrumb-btn {
    position: absolute;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: transparent;
    border: none;
    cursor: pointer;
    pointer-events: all;
    transition: all 0.2s;
  }

  .breadcrumb-btn:hover {
    background: rgba(245, 158, 11, 0.1);
    transform: scale(1.1);
  }

  .breadcrumb-btn.selected {
    background: rgba(245, 158, 11, 0.2);
    box-shadow: 0 0 20px rgba(245, 158, 11, 0.4);
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }

  /* Logs Panel */
  .logs-panel {
    position: absolute;
    top: 100px;
    right: -320px;
    width: 300px;
    max-height: 400px;
    background: rgba(26, 26, 46, 0.95);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(107, 114, 128, 0.3);
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
    overflow: hidden;
    animation: slide-in 0.3s forwards;
  }

  @keyframes slide-in {
    to {
      right: 20px;
    }
  }

  .logs-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: rgba(139, 92, 246, 0.1);
    border-bottom: 1px solid rgba(139, 92, 246, 0.2);
  }

  .logs-title {
    font-size: 14px;
    font-weight: 600;
    color: #8b5cf6;
    margin: 0;
  }

  .close-btn {
    background: none;
    border: none;
    color: #9ca3af;
    font-size: 24px;
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    line-height: 20px;
    transition: color 0.2s;
  }

  .close-btn:hover {
    color: #f59e0b;
  }

  .logs-content {
    padding: 12px;
    max-height: 340px;
    overflow-y: auto;
  }

  .no-logs {
    text-align: center;
    color: #6b7280;
    font-size: 12px;
    padding: 20px;
  }

  .log-entry {
    background: rgba(55, 65, 81, 0.3);
    border-radius: 8px;
    padding: 10px;
    margin-bottom: 8px;
    border-left: 3px solid #8b5cf6;
  }

  .log-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 6px;
  }

  .log-agent {
    font-size: 11px;
    font-weight: 600;
    color: #d1d5db;
  }

  .log-timestamp {
    font-size: 10px;
    color: #6b7280;
  }

  .log-message {
    font-size: 11px;
    color: #9ca3af;
    margin: 0 0 6px 0;
    line-height: 1.4;
  }

  .log-status {
    display: inline-block;
    font-size: 9px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 10px;
    text-transform: uppercase;
  }

  .status-processing {
    background: rgba(59, 130, 246, 0.2);
    color: #3b82f6;
  }
  .status-researching {
    background: rgba(16, 185, 129, 0.2);
    color: #10b981;
  }
  .status-thinking {
    background: rgba(139, 92, 246, 0.2);
    color: #8b5cf6;
  }
  .status-writing {
    background: rgba(245, 158, 11, 0.2);
    color: #f59e0b;
  }
  .status-complete {
    background: rgba(16, 185, 129, 0.2);
    color: #10b981;
  }

  /* All Logs Section */
  .all-logs-section {
    margin-top: 20px;
    background: rgba(26, 26, 46, 0.5);
    border: 1px solid rgba(107, 114, 128, 0.2);
    border-radius: 12px;
    overflow: hidden;
  }

  .all-logs-section details {
    cursor: pointer;
  }

  .all-logs-section summary {
    padding: 12px 16px;
    font-size: 13px;
    font-weight: 600;
    color: #d1d5db;
    background: rgba(55, 65, 81, 0.3);
    user-select: none;
  }

  .all-logs-section summary:hover {
    background: rgba(55, 65, 81, 0.5);
  }

  .all-logs-content {
    padding: 12px;
    max-height: 300px;
    overflow-y: auto;
  }

  .log-entry-small {
    display: grid;
    grid-template-columns: 80px 120px 1fr;
    gap: 8px;
    padding: 6px 8px;
    border-bottom: 1px solid rgba(55, 65, 81, 0.3);
    font-size: 11px;
  }

  .log-time {
    color: #6b7280;
  }

  .log-agent-badge {
    color: #8b5cf6;
    font-weight: 600;
  }

  .log-msg {
    color: #9ca3af;
  }

  /* Scrollbar styling */
  .logs-content::-webkit-scrollbar,
  .all-logs-content::-webkit-scrollbar {
    width: 6px;
  }

  .logs-content::-webkit-scrollbar-track,
  .all-logs-content::-webkit-scrollbar-track {
    background: transparent;
  }

  .logs-content::-webkit-scrollbar-thumb,
  .all-logs-content::-webkit-scrollbar-thumb {
    background: rgba(139, 92, 246, 0.3);
    border-radius: 3px;
  }

  .logs-content::-webkit-scrollbar-thumb:hover,
  .all-logs-content::-webkit-scrollbar-thumb:hover {
    background: rgba(139, 92, 246, 0.5);
  }
</style>
