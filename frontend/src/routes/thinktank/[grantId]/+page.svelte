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
  } from "lucide-svelte";
  import { Button } from "$lib/components/ui/button";
  import { fetchGrants, generateProposal } from "$lib/api";
  import { goto } from "$app/navigation";

  let grantId = $page.params.grantId;
  let grant = $state(null);
  let isRunning = $state(false);
  let progress = $state(0);
  let currentPhase = $state(0);
  let activities = $state<
    Array<{ text: string; agent: string; timestamp: string; status: string }>
  >([]);
  let showOutput = $state(false);
  let proposalResult = $state(null);
  let error = $state(null);
  let eventSource: EventSource | null = null;

  // Mock company profile
  const companyProfile = {
    name: "TechVision AI",
    description: "A startup focused on AI-powered healthcare diagnostics.",
    mission: "To democratize access to early disease detection.",
  };

  const phases = [
    { name: "Initial Analysis", icon: FileText, color: "text-purple-400" },
    { name: "Brainstorming", icon: Users, color: "text-blue-400" },
    { name: "Deep Research", icon: Brain, color: "text-green-400" },
    { name: "Synthesis", icon: Lightbulb, color: "text-cyan-400" },
    { name: "Writing", icon: FileText, color: "text-orange-400" },
    { name: "Peer Review", icon: CheckCircle, color: "text-pink-400" },
    { name: "Finalization", icon: Zap, color: "text-yellow-400" },
  ];

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
      grant = grants.find((g) => g.id.toString() === grantId);
      if (!grant) error = "Grant not found";
    } catch (e) {
      error = e.message;
    }
  });

  onDestroy(() => {
    if (eventSource) eventSource.close();
  });

  async function startThinktank() {
    if (!grant) return;

    isRunning = true;
    progress = 0;
    currentPhase = 0;
    activities = [];
    whiteboardIdeas = [];
    showOutput = false;

    try {
      // 1. Trigger generation
      const res = await generateProposal(grant.id, companyProfile, "research");

      // 2. Connect to SSE
      eventSource = new EventSource(`/api/proposal/${res.proposalId}/stream`);

      eventSource.onmessage = (event) => {
        // Keep alive
      };

      eventSource.addEventListener("log", (event: any) => {
        const data = JSON.parse(event.data);
        activities = [
          ...activities,
          {
            text: data.message,
            agent: data.agent,
            timestamp: data.timestamp,
            status: data.status,
          },
        ];

        // Simulate speech bubble
        if (data.agent !== "System") {
          const researcherIndex = researchers.findIndex(
            (r) => r.name.includes(data.agent) || data.agent.includes(r.name)
          );
          if (researcherIndex >= 0) {
            activeSpeaker = researcherIndex;
            speechBubble =
              data.message.substring(0, 50) +
              (data.message.length > 50 ? "..." : "");
            setTimeout(() => {
              activeSpeaker = null;
            }, 3000);
          }
        }
      });

      eventSource.addEventListener("phase", (event: any) => {
        const data = JSON.parse(event.data);
        currentPhase = data.phase;
        animateResearchersByPhase(currentPhase);
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
        eventSource.close();
      });

      eventSource.addEventListener("error", (event: any) => {
        console.error("SSE Error:", event);
        error = "Research process failed";
        isRunning = false;
        eventSource.close();
      });
    } catch (e) {
      error = e.message;
      isRunning = false;
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
      <Button variant="ghost" size="icon" on:click={() => goto("/")}>
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
                on:click={startThinktank}
                class="w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold
                                neon-glow-purple hover:scale-105 transition-all duration-200
                                flex items-center justify-center gap-2"
              >
                <Play class="w-5 h-5" />
                Start AI Thinktank
              </button>
            </div>
          {:else}
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium">Status</span>
                <Badge
                  variant="outline"
                  class="animate-pulse border-primary/50 text-primary"
                >
                  {isRunning ? "Active" : "Complete"}
                </Badge>
              </div>

              <div class="space-y-2">
                <h3 class="text-sm font-semibold">Research Phases</h3>
                {#each phases as phase, i}
                  <div class="flex items-center gap-2">
                    <div
                      class="w-8 h-8 rounded-lg flex items-center justify-center
                                        {i <= currentPhase
                        ? 'bg-primary/20 ' + phase.color
                        : 'bg-muted/30 text-muted-foreground'}"
                    >
                      <phase.icon class="w-4 h-4" />
                    </div>
                    <span
                      class="text-xs {i <= currentPhase
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

      <!-- Center - Visualization Canvas -->
      <div class="lg:col-span-6">
        <div class="glass-card p-8 min-h-[600px]">
          <div
            class="relative w-full h-[600px] bg-gradient-to-br from-background/50 to-muted/30 rounded-2xl overflow-hidden"
          >
            {#if !isRunning && !showOutput}
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="text-center text-muted-foreground">
                  <Brain class="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p>Waiting to start...</p>
                </div>
              </div>
            {:else}
              <!-- Office Environment -->
              <div class="absolute inset-0">
                <!-- Whiteboard (top left) -->
                <div
                  class="absolute top-8 left-8 w-48 h-32 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-3"
                >
                  <div class="text-xs text-purple-400 font-semibold mb-2">
                    Ideas Board
                  </div>
                  <div class="space-y-1">
                    {#each whiteboardIdeas as idea}
                      <div class="text-[10px] text-foreground/80 animate-pulse">
                        • {idea}
                      </div>
                    {/each}
                  </div>
                </div>

                <!-- Meeting Table (center) -->
                <div
                  class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
                            w-40 h-24 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-full border border-primary/30"
                ></div>

                <!-- Researchers -->
                {#each researcherPositions as researcher, i}
                  <div
                    class="absolute w-16 h-16 transition-all duration-[2000ms] ease-in-out"
                    style="left: {researcher.position.x}%; top: {researcher
                      .position.y}%; transform: translate(-50%, -50%);"
                  >
                    <!-- Avatar -->
                    <div
                      class="w-16 h-16 rounded-full {researcher.color} neon-glow-subtle flex items-center justify-center shadow-lg"
                    >
                      <span class="text-white font-bold text-xl"
                        >{researcher.name.charAt(0)}</span
                      >
                    </div>

                    <!-- Name tag -->
                    <div
                      class="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-[10px] text-center whitespace-nowrap text-foreground/80 font-medium"
                    >
                      {researcher.name.split(" ")[0]}
                    </div>

                    <!-- Speech Bubble -->
                    {#if activeSpeaker === i}
                      <div
                        class="absolute -top-16 left-1/2 transform -translate-x-1/2 w-48
                                  bg-white/95 dark:bg-background/95 backdrop-blur-sm rounded-2xl p-3
                                  border border-primary/30 shadow-lg animate-fade-in z-10"
                      >
                        <div class="text-[10px] text-foreground leading-tight">
                          {speechBubble}
                        </div>
                        <div
                          class="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white/95 dark:bg-background/95 rotate-45 border-r border-b border-primary/30"
                        ></div>
                      </div>
                    {/if}
                  </div>
                {/each}

                <!-- Progress Bar -->
                <div
                  class="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-2/3"
                >
                  <div class="mb-2 flex justify-between text-xs">
                    <span class="text-muted-foreground">Overall Progress</span>
                    <span class="text-primary font-semibold">{progress}%</span>
                  </div>
                  <div class="h-3 bg-muted/30 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-gradient-to-r from-purple-500 to-blue-500 neon-glow-purple transition-all duration-300"
                      style="width: {progress}%"
                    ></div>
                  </div>
                  {#if currentPhase < phases.length}
                    <div
                      class="mt-1 text-xs text-center {phases[currentPhase]
                        .color}"
                    >
                      {phases[currentPhase].name}
                    </div>
                  {/if}
                </div>
              </div>
            {/if}
          </div>
        </div>
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
