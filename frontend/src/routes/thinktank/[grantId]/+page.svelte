<script lang="ts">
  import { page } from "$app/stores";
  import { onMount, onDestroy } from "svelte";
  import {
    Brain,
    Play,
    Download,
    FileText,
    CheckCircle,
    Users,
    Lightbulb,
    Zap,
    MessageSquare,
    ArrowLeft,
    Loader2,
    RefreshCw,
    Wifi,
    WifiOff,
  } from "lucide-svelte";
  import { Button } from "$lib/components/ui/button";
  import { Badge } from "$lib/components/ui/badge";
  import { fetchGrants, generateProposal } from "$lib/api";
  import { goto } from "$app/navigation";
    import ResearchProgress from "$lib/components/ResearchProgress.svelte";
    import PixelLabVisualization from "$lib/components/PixelLabVisualization.svelte";

  // SSE Connection Recovery Configuration
  const SSE_RECONNECT_DELAY_MS = 3000;
  const MAX_RECONNECT_ATTEMPTS = 5;

  interface Grant {
    id: number;
    name: string;
  }

  interface PhaseInfo {
    id: number;
    name: string;
    description: string;
  }

  let grantId = $page.params.grantId;
  let grant = $state<Grant | null>(null);
  let isRunning = $state(false);
  let showAgentLab = $state(false);
  let progress = $state(0);
  let currentPhase = $state(0);
  let totalPhases = $state(7);
  let phaseName = $state("");
  let phaseDescription = $state("");
  let activities = $state<
    Array<{ text: string; agent: string; timestamp: string; status: string }>
  >([]);
  let showOutput = $state(false);
  let proposalResult = $state(null);
  let proposalIdState = $state<string | null>(null);
  let error = $state<string | null>(null);
  let eventSource: EventSource | null = null;
  
  // Connection status tracking
  let connectionStatus = $state<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  let reconnectAttempts = $state(0);
  let lastHeartbeat = $state<string | null>(null);
  let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

  // Mock company profile
  const companyProfile = {
    name: "TechVision AI",
    description: "A startup focused on AI-powered healthcare diagnostics.",
    mission: "To democratize access to early disease detection.",
  };

    // Agent Laboratory phases (matching the paper specification)
    const phases = [
      { name: "Literature Review", icon: FileText, color: "text-purple-400" },
      { name: "Plan Formulation", icon: Users, color: "text-blue-400" },
      { name: "Data Preparation", icon: Brain, color: "text-green-400" },
      { name: "Running Experiments", icon: Lightbulb, color: "text-cyan-400" },
      { name: "Results Interpretation", icon: FileText, color: "text-orange-400" },
      { name: "Report Writing", icon: CheckCircle, color: "text-pink-400" },
      { name: "Report Refinement", icon: Zap, color: "text-yellow-400" },
    ];
  
    // Track active agent for pixel visualization
    let activeAgentName = $state("");

  const researchers = [
    {
      id: 1,
      name: "Lead Researcher",
      color: "bg-purple-500",
      position: { x: 15, y: 60 },
      role: "lead",
    },
    {
      id: 2,
      name: "Domain Expert",
      color: "bg-blue-500",
      position: { x: 35, y: 40 },
      role: "expert",
    },
    {
      id: 3,
      name: "Innovation Specialist",
      color: "bg-green-500",
      position: { x: 55, y: 60 },
      role: "innovation",
    },
    {
      id: 4,
      name: "Technical Writer",
      color: "bg-cyan-500",
      position: { x: 35, y: 80 },
      role: "writer",
    },
    {
      id: 5,
      name: "Critical Reviewer",
      color: "bg-orange-500",
      position: { x: 75, y: 50 },
      role: "reviewer",
    },
  ];

  let researcherPositions = $state(researchers.map((r) => ({ ...r })));
  let activeSpeaker = $state<number | null>(null);
  let speechBubble = $state<string>("");
  let whiteboardIdeas = $state<string[]>([]);

  onMount(async () => {
    try {
      const grants = await fetchGrants();
      grant = grants.find((g: any) => g.id.toString() === grantId) || null;
      if (!grant) {
        error = "Grant not found";
      }
    } catch (e) {
      if (e instanceof Error) {
        error = e.message;
      } else {
        error = String(e);
      }
    }
  });

  onDestroy(() => {
    cleanupConnection();
  });

  function cleanupConnection() {
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
    connectionStatus = 'disconnected';
  }

  function attemptReconnect() {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      error = `Connection lost after ${MAX_RECONNECT_ATTEMPTS} reconnection attempts. Please try again.`;
      isRunning = false;
      connectionStatus = 'disconnected';
      return;
    }

    connectionStatus = 'reconnecting';
    reconnectAttempts++;
    console.log(`Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);

    reconnectTimeout = setTimeout(() => {
      if (proposalIdState) {
        connectToSSE(proposalIdState);
      }
    }, SSE_RECONNECT_DELAY_MS);
  }

  function connectToSSE(proposalId: string) {
    // Close existing connection if any
    if (eventSource) {
      eventSource.close();
    }

    eventSource = new EventSource(`/api/proposal/${proposalId}/stream`);
    
    eventSource.onopen = () => {
      connectionStatus = 'connected';
      reconnectAttempts = 0; // Reset on successful connection
      console.log('SSE connection established');
    };

    eventSource.onmessage = (event) => {
      // Keep alive - generic message handler
    };

    // Handle heartbeat events
    eventSource.addEventListener("heartbeat", (event: any) => {
      const data = JSON.parse(event.data);
      lastHeartbeat = data.timestamp;
      connectionStatus = 'connected';
    });

    // Handle phases info (sent at start)
    eventSource.addEventListener("phases_info", (event: any) => {
      const data = JSON.parse(event.data);
      totalPhases = data.totalPhases || 7;
    });

        // Handle phase updates with enhanced info (Agent Laboratory spec)
        eventSource.addEventListener("phase", (event: any) => {
          const data = JSON.parse(event.data);
          currentPhase = data.phase;
          phaseName = data.phaseName || "";
          phaseDescription = data.phaseDescription || "";
          totalPhases = data.totalPhases || 7;
          progress = data.progress || Math.round((currentPhase / totalPhases) * 100);
      
          // Update active agent for pixel visualization
          if (data.agent) {
            activeAgentName = data.agent;
          }
      
          animateResearchersByPhase(currentPhase);
        });

        eventSource.addEventListener("log", (event: any) => {
          const data = JSON.parse(event.data);
          activities = [
            ...activities,
            {
              text: data.message,
              agent: data.agent || "System",
              timestamp: data.timestamp || new Date().toISOString(),
              status: data.status || "Processing",
            },
          ];

          // Update active agent for pixel visualization
          if (data.agent && data.agent !== "System") {
            activeAgentName = data.agent;
            speechBubble =
              data.message.substring(0, 50) +
              (data.message.length > 50 ? "..." : "");
        
            // Also update legacy researcher visualization
            const researcherIndex = researchers.findIndex(
              (r) => r.name.includes(data.agent) || data.agent.includes(r.name)
            );
            if (researcherIndex >= 0) {
              activeSpeaker = researcherIndex;
              setTimeout(() => {
                activeSpeaker = null;
                activeAgentName = "";
              }, 3000);
            } else {
              // Clear after timeout even if no researcher match
              setTimeout(() => {
                activeAgentName = "";
              }, 3000);
            }
          }
        });

    eventSource.addEventListener("progress", (event: any) => {
      const data = JSON.parse(event.data);
      progress = data.percentage;
    });

    eventSource.addEventListener("complete", (event: any) => {
      const data = JSON.parse(event.data);
      proposalResult = data.result;
      isRunning = false;
      showOutput = true;
      connectionStatus = 'disconnected';
      cleanupConnection();
    });

    eventSource.addEventListener("status", (event: any) => {
      const data = JSON.parse(event.data);
      if (data.status === "completed") {
        isRunning = false;
        showOutput = true;
        connectionStatus = 'disconnected';
      } else if (data.status === "failed") {
        error = "Research process failed";
        isRunning = false;
        connectionStatus = 'disconnected';
      }
      cleanupConnection();
    });

    // Handle fallback to fast track
    eventSource.addEventListener("fallback", (event: any) => {
      const data = JSON.parse(event.data);
      error = data.message;
      isRunning = false;
      connectionStatus = 'disconnected';
      cleanupConnection();
    });

    // Handle timeout
    eventSource.addEventListener("timeout", (event: any) => {
      const data = JSON.parse(event.data);
      error = data.message;
      isRunning = false;
      connectionStatus = 'disconnected';
      cleanupConnection();
    });

    eventSource.onerror = (event: any) => {
      console.error("SSE Error:", event);
      connectionStatus = 'disconnected';
      
      // Only attempt reconnect if still running
      if (isRunning && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        attemptReconnect();
      } else if (isRunning) {
        error = "Connection lost. Please try again.";
        isRunning = false;
        cleanupConnection();
      }
    };
  }

  async function startThinktank() {
    if (!grant) return;

    isRunning = true;
    progress = 0;
    currentPhase = 0;
    phaseName = "";
    phaseDescription = "";
    activities = [];
    whiteboardIdeas = [];
    showOutput = false;
    error = null;
    reconnectAttempts = 0;
    connectionStatus = 'disconnected';

    try {
      // 1. Trigger generation
      const res = await generateProposal(grant.id, companyProfile, "research");
      proposalIdState = res.proposalId;

      // 2. Connect to SSE with recovery support
      connectToSSE(res.proposalId);
    } catch (e) {
      if (e instanceof Error) {
        error = e.message;
      } else {
        error = String(e);
      }
      isRunning = false;
      connectionStatus = 'disconnected';
    }
  }

  function animateResearchersByPhase(phase: number) {
    switch (phase) {
      case 0: // Initial Analysis - at desks
        researcherPositions = researchers.map((r) => ({ ...r }));
        break;
      case 1: // Brainstorming - gather at table (center)
        researcherPositions = researchers.map((r, i) => ({
          ...r,
          position: {
            x: 50 + Math.cos((i * Math.PI * 2) / 5) * 15,
            y: 50 + Math.sin((i * Math.PI * 2) / 5) * 15,
          },
        }));
        break;
      case 2: // Deep Research - spread out
        researcherPositions = [
          { ...researchers[0], position: { x: 10, y: 30 } },
          { ...researchers[1], position: { x: 80, y: 30 } },
          { ...researchers[2], position: { x: 10, y: 70 } },
          { ...researchers[3], position: { x: 80, y: 70 } },
          { ...researchers[4], position: { x: 45, y: 50 } },
        ];
        break;
      case 3: // Synthesis - lead at whiteboard
        researcherPositions = [
          { ...researchers[0], position: { x: 20, y: 30 } }, // Lead at whiteboard
          { ...researchers[1], position: { x: 40, y: 50 } },
          { ...researchers[2], position: { x: 50, y: 50 } },
          { ...researchers[3], position: { x: 60, y: 50 } },
          { ...researchers[4], position: { x: 70, y: 50 } },
        ];
        break;
      case 4: // Writing - writer at desk
        researcherPositions = researchers.map((r) => ({ ...r }));
        break;
      case 5: // Peer Review - passing documents
        researcherPositions = researchers.map((r, i) => ({
          ...r,
          position: {
            x: 30 + i * 15,
            y: 50,
          },
        }));
        break;
      case 6: // Finalization - celebration circle
        researcherPositions = researchers.map((r, i) => ({
          ...r,
          position: {
            x: 50 + Math.cos((i * Math.PI * 2) / 5) * 20,
            y: 50 + Math.sin((i * Math.PI * 2) / 5) * 20,
          },
        }));
        break;
    }
  }
</script>

<div class="min-h-screen p-8">
  <div class="max-w-[1800px] mx-auto">
    <!-- Header -->
    <div class="mb-8 flex items-center gap-4">
      <Button variant="ghost" size="icon" onclick={() => goto("/")}>
        <ArrowLeft class="w-5 h-5" />
      </Button>
      <div>
        <h1
          class="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent"
        >
          AI Thinktank Workspace
        </h1>
        <p class="text-muted-foreground">
          {#if grant}
            Researching: <span class="font-semibold text-foreground"
              >{grant.name}</span
            >
          {:else}
            Loading...
          {/if}
        </p>
      </div>
    </div>

    {#if error}
      <div
        class="p-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 mb-6"
      >
        {error}
      </div>
    {/if}

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- Left Sidebar - Status -->
      <div class="lg:col-span-3">
        <div class="glass-card p-6 space-y-6 sticky top-8">
          {#if !isRunning && !showOutput}
            <div class="text-center space-y-4">
              <div
                class="p-4 rounded-full bg-primary/10 w-16 h-16 mx-auto flex items-center justify-center"
              >
                <Brain class="w-8 h-8 text-primary" />
              </div>
              <h3 class="font-semibold text-lg">Ready to Research</h3>
              <p class="text-sm text-muted-foreground">
                Initialize the autonomous AI research team to analyze this
                grant.
              </p>
              <button
                onclick={startThinktank}
                class="w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold
                                neon-glow-purple hover:scale-105 transition-all duration-200
                                flex items-center justify-center gap-2 mb-4"
              >
                <Play class="w-5 h-5" />
                Start AI Thinktank
              </button>

              <button
                onclick={() => (showAgentLab = true)}
                class="w-full py-4 rounded-xl bg-gradient-to-r from-green-600 to-teal-600 text-white font-semibold
                                hover:scale-105 transition-all duration-200
                                flex items-center justify-center gap-2"
              >
                <Brain class="w-5 h-5" />
                Deep Research (Agent Lab)
              </button>
            </div>
          {:else}
            <div class="space-y-4">
              <!-- Connection Status -->
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium">Connection</span>
                <div class="flex items-center gap-2">
                  {#if connectionStatus === 'connected'}
                    <Wifi class="w-4 h-4 text-green-400" />
                    <Badge variant="outline" class="border-green-500/50 text-green-400">
                      Connected
                    </Badge>
                  {:else if connectionStatus === 'reconnecting'}
                    <RefreshCw class="w-4 h-4 text-yellow-400 animate-spin" />
                    <Badge variant="outline" class="border-yellow-500/50 text-yellow-400">
                      Reconnecting ({reconnectAttempts}/{MAX_RECONNECT_ATTEMPTS})
                    </Badge>
                  {:else}
                    <WifiOff class="w-4 h-4 text-muted-foreground" />
                    <Badge variant="outline" class="border-muted-foreground/50 text-muted-foreground">
                      Disconnected
                    </Badge>
                  {/if}
                </div>
              </div>

              <div class="flex items-center justify-between">
                <span class="text-sm font-medium">Status</span>
                <Badge
                  variant="outline"
                  class="animate-pulse border-primary/50 text-primary"
                >
                  {isRunning ? "Active" : "Complete"}
                </Badge>
              </div>

              <!-- Progress Bar -->
              <div class="space-y-2">
                <div class="flex items-center justify-between text-xs">
                  <span class="text-muted-foreground">Progress</span>
                  <span class="font-medium">{progress}%</span>
                </div>
                <div class="h-2 bg-muted/30 rounded-full overflow-hidden">
                  <div 
                    class="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
                    style="width: {progress}%"
                  ></div>
                </div>
                {#if phaseName}
                  <p class="text-xs text-muted-foreground">{phaseDescription}</p>
                {/if}
              </div>

              <div class="space-y-2">
                <h3 class="text-sm font-semibold">Research Phases ({currentPhase + 1}/{totalPhases})</h3>
                {#each phases as phase, i}
                  <div class="flex items-center gap-2">
                    <div
                      class="w-8 h-8 rounded-lg flex items-center justify-center
                                        {i < currentPhase
                        ? 'bg-green-500/20 text-green-400'
                        : i === currentPhase
                        ? 'bg-primary/20 ' + phase.color + ' animate-pulse'
                        : 'bg-muted/30 text-muted-foreground'}"
                    >
                      {#if i < currentPhase}
                        <CheckCircle class="w-4 h-4" />
                      {:else if i === currentPhase && isRunning}
                        <Loader2 class="w-4 h-4 animate-spin" />
                      {:else}
                        <phase.icon class="w-4 h-4" />
                      {/if}
                    </div>
                    <span
                      class="text-xs {i < currentPhase
                        ? 'text-green-400'
                        : i === currentPhase
                        ? phase.color
                        : 'text-muted-foreground'}">{phase.name}</span
                    >
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      </div>

            <!-- Center - Pixel Art Research Visualization -->
            <div class="lg:col-span-6">
              {#if showAgentLab && grantId}
                <ResearchProgress grantId={grantId} />
              {:else}
                <div class="glass-card p-6 min-h-[450px]">
                  <div class="flex items-center justify-between mb-4">
                    <h2 class="text-lg font-semibold flex items-center gap-2">
                      <Brain class="w-5 h-5 text-purple-400" />
                      Agent Laboratory
                    </h2>
                    {#if isRunning}
                      <Badge variant="outline" class="border-green-500/50 text-green-400 animate-pulse">
                        Research in Progress
                      </Badge>
                    {/if}
                  </div>
            
                  <!-- Pixel Art Visualization -->
                  <PixelLabVisualization 
                    currentPhase={currentPhase}
                    totalPhases={totalPhases}
                    activeAgent={activeAgentName}
                    agentMessage={speechBubble}
                    isRunning={isRunning}
                  />
            
                  {#if !isRunning && !showOutput}
                    <p class="text-center text-sm text-muted-foreground mt-4">
                      Click "Start AI Thinktank" to begin the research process
                    </p>
                  {/if}
                </div>
              {/if}
            </div>

      <!-- Right Sidebar - Activity Feed -->
      <div class="lg:col-span-3">
        <div class="glass-card p-6 sticky top-8">
          <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
            <MessageSquare class="w-5 h-5 text-blue-400" />
            Live Activity
          </h2>

          <div class="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
            {#if activities.length === 0}
              <p class="text-sm text-muted-foreground text-center py-8">
                Activity log will appear here when thinktank starts
              </p>
            {/if}

            {#each activities as activity}
              <div
                class="p-3 rounded-lg bg-muted/20 border border-border/50 space-y-1 animate-fade-in"
              >
                <div class="flex items-center justify-between">
                  <span class="text-xs font-semibold text-foreground"
                    >{activity.agent}</span
                  >
                  <span class="text-[10px] text-muted-foreground"
                    >{activity.timestamp}</span
                  >
                </div>
                <p class="text-xs text-muted-foreground">{activity.text}</p>
                <div>
                  <span
                    class="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium
                               {activity.status === 'Researching'
                      ? 'bg-blue-500/20 text-blue-400'
                      : ''}
                               {activity.status === 'Discussing'
                      ? 'bg-purple-500/20 text-purple-400'
                      : ''}
                               {activity.status === 'Writing'
                      ? 'bg-green-500/20 text-green-400'
                      : ''}
                               {activity.status === 'Reviewing'
                      ? 'bg-orange-500/20 text-orange-400'
                      : ''}
                               {activity.status === 'Complete'
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : ''}"
                  >
                    {activity.status}
                  </span>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>

    <!-- Output Panel (Expandable) -->
    {#if showOutput && proposalResult}
      <div class="mt-6 glass-card p-8 space-y-6 animate-fade-in">
        <div class="flex items-center justify-between">
          <h2 class="text-2xl font-bold flex items-center gap-2">
            <FileText class="w-6 h-6 text-green-400" />
            Generated Research Proposal
          </h2>
          <div class="flex gap-2">
            <Button variant="outline">
              <Download class="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button>
              <FileText class="w-4 h-4 mr-2" />
              Apply to Grant Writer
            </Button>
          </div>
        </div>

        <div
          class="space-y-4 text-sm whitespace-pre-line p-4 bg-muted/30 rounded-lg"
        >
          {proposalResult}
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  @keyframes fade-in {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fade-in {
    animation: fade-in 0.3s ease-out;
  }

  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }

  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: hsl(var(--primary) / 0.3);
    border-radius: 3px;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: hsl(var(--primary) / 0.5);
  }
</style>
