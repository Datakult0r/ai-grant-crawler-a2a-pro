<script lang="ts">
  import { onMount, onDestroy } from "svelte";

  // Props for SSE integration
  interface Props {
    currentPhase?: number;
    totalPhases?: number;
    activeAgent?: string;
    agentMessage?: string;
    isRunning?: boolean;
  }

  let {
    currentPhase = 0,
    totalPhases = 7,
    activeAgent = "",
    agentMessage = "",
    isRunning = false,
  }: Props = $props();

  // Canvas reference
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;
  let animationFrame: number;

  // Sprite sheets
  let labNPCsImg: HTMLImageElement;
  let assetsImg: HTMLImageElement;
  let tubesImg: HTMLImageElement;
  let floorsWallsImg: HTMLImageElement;
  let imagesLoaded = $state(false);

  // Animation state
  let frameCount = $state(0);
  let speechBubbleText = $state("");
  let speechBubbleAgent = $state(-1);

  // Research phases matching Agent Laboratory
  const RESEARCH_PHASES = [
    { id: 0, name: "Literature Review", shortName: "Lit Review" },
    { id: 1, name: "Plan Formulation", shortName: "Planning" },
    { id: 2, name: "Data Preparation", shortName: "Data Prep" },
    { id: 3, name: "Running Experiments", shortName: "Experiments" },
    { id: 4, name: "Results Interpretation", shortName: "Results" },
    { id: 5, name: "Report Writing", shortName: "Writing" },
    { id: 6, name: "Report Refinement", shortName: "Refinement" },
  ];

  // Agent definitions with sprite positions (row, col in LabNPCs.png)
  // Each character is 32x32 pixels, 8 columns, 4 rows of characters
  const AGENTS = [
    { id: 0, name: "PhD Student", role: "lit_reviewer", spriteRow: 0, spriteCol: 0, color: "#9333ea" },
    { id: 1, name: "Postdoc", role: "planner", spriteRow: 0, spriteCol: 1, color: "#3b82f6" },
    { id: 2, name: "Professor", role: "supervisor", spriteRow: 0, spriteCol: 2, color: "#22c55e" },
    { id: 3, name: "ML Engineer", role: "experimenter", spriteRow: 0, spriteCol: 3, color: "#f59e0b" },
    { id: 4, name: "SW Engineer", role: "coder", spriteRow: 0, spriteCol: 4, color: "#06b6d4" },
  ];

  // Agent positions in the lab (will animate based on phase)
  let agentPositions = $state(AGENTS.map((a, i) => ({
    x: 80 + i * 100,
    y: 200,
    targetX: 80 + i * 100,
    targetY: 200,
    isActive: false,
    isSpeaking: false,
  })));

  // Canvas dimensions
  const CANVAS_WIDTH = 600;
  const CANVAS_HEIGHT = 350;
  const SPRITE_SIZE = 32;
  const TILE_SIZE = 16;

  // Load images
  onMount(() => {
    ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.imageSmoothingEnabled = false; // Pixel art crisp rendering
    }

    // Load sprite sheets
    labNPCsImg = new Image();
    labNPCsImg.src = "/assets/lab-tileset/LabNPCs.png";

    assetsImg = new Image();
    assetsImg.src = "/assets/lab-tileset/assets.png";

    tubesImg = new Image();
    tubesImg.src = "/assets/lab-tileset/Tubes.png";

    floorsWallsImg = new Image();
    floorsWallsImg.src = "/assets/lab-tileset/floorsWalls.png";

    let loadedCount = 0;
    const onImageLoad = () => {
      loadedCount++;
      if (loadedCount >= 4) {
        imagesLoaded = true;
        startAnimation();
      }
    };

    labNPCsImg.onload = onImageLoad;
    assetsImg.onload = onImageLoad;
    tubesImg.onload = onImageLoad;
    floorsWallsImg.onload = onImageLoad;

    // Fallback if images don't load
    setTimeout(() => {
      if (!imagesLoaded) {
        imagesLoaded = true;
        startAnimation();
      }
    }, 2000);
  });

  onDestroy(() => {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }
  });

  // Update agent positions based on current phase
  $effect(() => {
    updateAgentPositions(currentPhase);
  });

  // Update speech bubble when agent message changes
  $effect(() => {
    if (agentMessage && activeAgent) {
      const agentIndex = AGENTS.findIndex(a => 
        a.name.toLowerCase().includes(activeAgent.toLowerCase()) ||
        a.role.toLowerCase().includes(activeAgent.toLowerCase())
      );
      if (agentIndex >= 0) {
        speechBubbleAgent = agentIndex;
        speechBubbleText = agentMessage.length > 40 
          ? agentMessage.substring(0, 40) + "..." 
          : agentMessage;
        
        // Clear speech bubble after 4 seconds
        setTimeout(() => {
          speechBubbleAgent = -1;
          speechBubbleText = "";
        }, 4000);
      }
    }
  });

  function updateAgentPositions(phase: number) {
    const centerX = CANVAS_WIDTH / 2;
    const centerY = 200;

    switch (phase) {
      case 0: // Literature Review - PhD student active at desk
        agentPositions = AGENTS.map((a, i) => ({
          ...agentPositions[i],
          targetX: 80 + i * 100,
          targetY: 200,
          isActive: i === 0,
        }));
        break;
      case 1: // Plan Formulation - gather around whiteboard
        agentPositions = AGENTS.map((a, i) => ({
          ...agentPositions[i],
          targetX: centerX - 80 + (i % 3) * 80,
          targetY: 160 + Math.floor(i / 3) * 60,
          isActive: i === 1 || i === 2,
        }));
        break;
      case 2: // Data Preparation - ML Engineer active
        agentPositions = AGENTS.map((a, i) => ({
          ...agentPositions[i],
          targetX: 100 + i * 90,
          targetY: 200,
          isActive: i === 3,
        }));
        break;
      case 3: // Running Experiments - all at computers
        agentPositions = AGENTS.map((a, i) => ({
          ...agentPositions[i],
          targetX: 60 + i * 110,
          targetY: 220,
          isActive: i === 3 || i === 4,
        }));
        break;
      case 4: // Results Interpretation - gather around screen
        agentPositions = AGENTS.map((a, i) => ({
          ...agentPositions[i],
          targetX: centerX - 100 + i * 50,
          targetY: 180,
          isActive: true,
        }));
        break;
      case 5: // Report Writing - PhD student and Postdoc
        agentPositions = AGENTS.map((a, i) => ({
          ...agentPositions[i],
          targetX: 150 + i * 80,
          targetY: 200,
          isActive: i === 0 || i === 1,
        }));
        break;
      case 6: // Report Refinement - Professor reviews
        agentPositions = AGENTS.map((a, i) => ({
          ...agentPositions[i],
          targetX: centerX - 80 + (i % 3) * 80,
          targetY: 170 + Math.floor(i / 3) * 50,
          isActive: i === 2,
        }));
        break;
    }
  }

  function startAnimation() {
    const animate = () => {
      frameCount++;
      
      // Smooth agent movement
      agentPositions = agentPositions.map(pos => ({
        ...pos,
        x: pos.x + (pos.targetX - pos.x) * 0.1,
        y: pos.y + (pos.targetY - pos.y) * 0.1,
      }));

      render();
      animationFrame = requestAnimationFrame(animate);
    };
    animate();
  }

  function render() {
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw lab floor (checkerboard pattern)
    drawLabFloor();

    // Draw lab equipment (tubes, desks)
    drawLabEquipment();

    // Draw breadcrumb timeline at top
    drawBreadcrumbTimeline();

    // Draw agents
    drawAgents();

    // Draw speech bubbles
    if (speechBubbleAgent >= 0 && speechBubbleText) {
      drawSpeechBubble(speechBubbleAgent);
    }

    // Draw status indicator
    drawStatusIndicator();
  }

  function drawLabFloor() {
    if (!ctx) return;
    
    // Draw a simple tiled floor pattern
    for (let x = 0; x < CANVAS_WIDTH; x += TILE_SIZE * 2) {
      for (let y = 100; y < CANVAS_HEIGHT; y += TILE_SIZE * 2) {
        const isLight = ((x / (TILE_SIZE * 2)) + (y / (TILE_SIZE * 2))) % 2 === 0;
        ctx.fillStyle = isLight ? "#2a2a4e" : "#1e1e3a";
        ctx.fillRect(x, y, TILE_SIZE * 2, TILE_SIZE * 2);
      }
    }

    // Draw wall at top
    ctx.fillStyle = "#3a3a5e";
    ctx.fillRect(0, 80, CANVAS_WIDTH, 20);
  }

  function drawLabEquipment() {
    if (!ctx) return;

    // Draw test tubes on the right
    ctx.fillStyle = "#4ade80";
    ctx.globalAlpha = 0.6;
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(CANVAS_WIDTH - 60 + i * 15, 120, 10, 40);
      ctx.fillStyle = "#22d3ee";
      ctx.fillRect(CANVAS_WIDTH - 60 + i * 15, 130, 10, 20);
      ctx.fillStyle = "#4ade80";
    }
    ctx.globalAlpha = 1;

    // Draw computer monitors
    ctx.fillStyle = "#374151";
    for (let i = 0; i < 5; i++) {
      const x = 70 + i * 100;
      // Monitor
      ctx.fillRect(x, 170, 40, 30);
      // Screen glow
      ctx.fillStyle = isRunning ? "#60a5fa" : "#4b5563";
      ctx.fillRect(x + 2, 172, 36, 26);
      ctx.fillStyle = "#374151";
      // Stand
      ctx.fillRect(x + 15, 200, 10, 10);
    }

    // Draw whiteboard
    ctx.fillStyle = "#f3f4f6";
    ctx.fillRect(CANVAS_WIDTH / 2 - 60, 85, 120, 60);
    ctx.strokeStyle = "#9ca3af";
    ctx.lineWidth = 2;
    ctx.strokeRect(CANVAS_WIDTH / 2 - 60, 85, 120, 60);

    // Draw some "writing" on whiteboard if in planning phase
    if (currentPhase === 1 || currentPhase === 4) {
      ctx.fillStyle = "#3b82f6";
      ctx.fillRect(CANVAS_WIDTH / 2 - 50, 95, 40, 3);
      ctx.fillRect(CANVAS_WIDTH / 2 - 50, 105, 60, 3);
      ctx.fillRect(CANVAS_WIDTH / 2 - 50, 115, 30, 3);
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(CANVAS_WIDTH / 2 + 10, 95, 40, 3);
      ctx.fillRect(CANVAS_WIDTH / 2 + 10, 105, 50, 3);
    }
  }

  function drawBreadcrumbTimeline() {
    if (!ctx) return;

    const timelineY = 30;
    const startX = 30;
    const phaseWidth = (CANVAS_WIDTH - 60) / totalPhases;

    // Draw timeline background
    ctx.fillStyle = "#374151";
    ctx.fillRect(startX, timelineY + 8, CANVAS_WIDTH - 60, 4);

    // Draw phase markers
    RESEARCH_PHASES.forEach((phase, i) => {
      const x = startX + i * phaseWidth + phaseWidth / 2;
      
      // Circle marker
      ctx.beginPath();
      ctx.arc(x, timelineY + 10, 8, 0, Math.PI * 2);
      
      if (i < currentPhase) {
        // Completed
        ctx.fillStyle = "#22c55e";
      } else if (i === currentPhase) {
        // Current - pulsing
        const pulse = Math.sin(frameCount * 0.1) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(59, 130, 246, ${pulse})`;
      } else {
        // Future
        ctx.fillStyle = "#4b5563";
      }
      ctx.fill();

      // Phase name
      ctx.fillStyle = i <= currentPhase ? "#e5e7eb" : "#6b7280";
      ctx.font = "9px monospace";
      ctx.textAlign = "center";
      ctx.fillText(phase.shortName, x, timelineY + 30);
    });

    // Draw progress line
    if (currentPhase > 0) {
      const progressWidth = (currentPhase / totalPhases) * (CANVAS_WIDTH - 60);
      ctx.fillStyle = "#22c55e";
      ctx.fillRect(startX, timelineY + 8, progressWidth, 4);
    }
  }

  function drawAgents() {
    if (!ctx) return;

    agentPositions.forEach((pos, i) => {
      const agent = AGENTS[i];
      
      // Draw shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      ctx.beginPath();
      ctx.ellipse(pos.x + 16, pos.y + 30, 12, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Try to draw sprite, fallback to colored circle
      if (imagesLoaded && labNPCsImg.complete) {
        // Calculate sprite position (32x32 sprites, 8 columns)
        const spriteX = agent.spriteCol * SPRITE_SIZE;
        const spriteY = agent.spriteRow * SPRITE_SIZE;
        
        // Animation frame (idle bounce)
        const bounce = pos.isActive ? Math.sin(frameCount * 0.15) * 2 : 0;
        
        ctx.drawImage(
          labNPCsImg,
          spriteX, spriteY, SPRITE_SIZE, SPRITE_SIZE,
          pos.x, pos.y - bounce, SPRITE_SIZE, SPRITE_SIZE
        );
      } else {
        // Fallback: colored circle with letter
        ctx.fillStyle = agent.color;
        ctx.beginPath();
        ctx.arc(pos.x + 16, pos.y + 16, 14, 0, Math.PI * 2);
        ctx.fill();

        // Agent initial
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 12px monospace";
        ctx.textAlign = "center";
        ctx.fillText(agent.name[0], pos.x + 16, pos.y + 20);
      }

      // Active indicator (glow)
      if (pos.isActive && isRunning) {
        ctx.strokeStyle = agent.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = Math.sin(frameCount * 0.1) * 0.5 + 0.5;
        ctx.beginPath();
        ctx.arc(pos.x + 16, pos.y + 16, 20, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Agent name below
      ctx.fillStyle = pos.isActive ? "#ffffff" : "#9ca3af";
      ctx.font = "8px monospace";
      ctx.textAlign = "center";
      ctx.fillText(agent.name, pos.x + 16, pos.y + 45);
    });
  }

  function drawSpeechBubble(agentIndex: number) {
    if (!ctx || agentIndex < 0 || !speechBubbleText) return;

    const pos = agentPositions[agentIndex];
    const bubbleX = pos.x - 20;
    const bubbleY = pos.y - 50;
    const bubbleWidth = Math.min(speechBubbleText.length * 6 + 20, 150);
    const bubbleHeight = 30;

    // Bubble background
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, 8);
    ctx.fill();

    // Bubble tail
    ctx.beginPath();
    ctx.moveTo(bubbleX + 20, bubbleY + bubbleHeight);
    ctx.lineTo(bubbleX + 30, bubbleY + bubbleHeight + 10);
    ctx.lineTo(bubbleX + 40, bubbleY + bubbleHeight);
    ctx.fill();

    // Text
    ctx.fillStyle = "#1f2937";
    ctx.font = "9px monospace";
    ctx.textAlign = "left";
    ctx.fillText(speechBubbleText, bubbleX + 10, bubbleY + 18);
  }

  function drawStatusIndicator() {
    if (!ctx) return;

    // Status text at bottom
    const statusText = isRunning 
      ? `Phase ${currentPhase + 1}/${totalPhases}: ${RESEARCH_PHASES[currentPhase]?.name || "Processing"}`
      : "Ready to start research";

    ctx.fillStyle = "#9ca3af";
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    ctx.fillText(statusText, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 10);

    // Running indicator
    if (isRunning) {
      const dotX = CANVAS_WIDTH / 2 - 100;
      const dotY = CANVAS_HEIGHT - 12;
      ctx.fillStyle = "#22c55e";
      ctx.globalAlpha = Math.sin(frameCount * 0.1) * 0.5 + 0.5;
      ctx.beginPath();
      ctx.arc(dotX, dotY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
</script>

<div class="pixel-lab-container">
  <canvas
    bind:this={canvas}
    width={CANVAS_WIDTH}
    height={CANVAS_HEIGHT}
    class="pixel-lab-canvas"
  ></canvas>
  
  {#if !imagesLoaded}
    <div class="loading-overlay">
      <span class="loading-text">Loading lab assets...</span>
    </div>
  {/if}
</div>

<style>
  .pixel-lab-container {
    position: relative;
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
    border-radius: 12px;
    overflow: hidden;
    background: #1a1a2e;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  }

  .pixel-lab-canvas {
    display: block;
    width: 100%;
    height: auto;
    image-rendering: pixelated;
    image-rendering: crisp-edges;
  }

  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(26, 26, 46, 0.9);
  }

  .loading-text {
    color: #9ca3af;
    font-family: monospace;
    font-size: 14px;
  }
</style>
