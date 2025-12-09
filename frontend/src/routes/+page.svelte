<script lang="ts">
  import {
    Search,
    Filter,
    TrendingUp,
    Clock,
    Target,
    Award,
  } from "lucide-svelte";
  import { Button } from "$lib/components/ui/button";
  import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
  } from "$lib/components/ui/card";
  import { Badge } from "$lib/components/ui/badge";
  import { Input } from "$lib/components/ui/input";
  import { Progress } from "$lib/components/ui/progress";
  import GrantGatekeeper from "$lib/components/GrantGatekeeper.svelte";
  import { goto } from "$app/navigation";

  import { onMount } from "svelte";
  import { fetchGrants } from "$lib/api";

  // Grant data state
  interface Grant {
    id: number;
    name: string;
    source: string;
    region: string;
    amount: string;
    relevance: number;
    deadline: string;
    daysLeft: number;
  }
  let grants = $state<Grant[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);

  // Gatekeeper state
  let showGatekeeper = $state(false);
  let selectedGrant = $state<Grant | null>(null);

  onMount(async () => {
    try {
      grants = await fetchGrants();
    } catch (e) {
      console.error(e);
      if (e instanceof Error) {
        error = e.message;
      } else {
        error = String(e);
      }
    } finally {
      loading = false;
    }
  });

  function handleApply(grant: Grant) {
    selectedGrant = grant;
    showGatekeeper = true;
  }

  function handleModeSelect(
    event: CustomEvent<{ mode: string; grant: Grant }>
  ) {
    const { mode, grant } = event.detail;
    if (mode === "fast") {
      goto(`/writer/${grant.id}`);
    } else {
      goto(`/thinktank/${grant.id}`);
    }
  }

  const stats = {
    total: 537,
    newToday: 12,
    deadlinesWeek: 8,
    successRate: 68,
  };

  let searchQuery = $state("");
  let selectedRegion = $state("all");
</script>

<div class="p-8 space-y-6">
  <!-- Header -->
  <div class="space-y-2">
    <h1
      class="text-4xl font-bold text-balance bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent"
    >
      AI Funding Discovery
    </h1>
    <p class="text-muted-foreground text-lg">
      500+ grants from Portugal and EU analyzed in real-time
    </p>
  </div>

  <!-- Stats Bar -->
  <div class="grid grid-cols-4 gap-4">
    <Card class="glass-card neon-glow-purple">
      <CardContent class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-muted-foreground">Total Grants</p>
            <p class="text-3xl font-bold text-primary">{stats.total}</p>
          </div>
          <Target class="w-8 h-8 text-primary" />
        </div>
      </CardContent>
    </Card>

    <Card class="glass-card neon-glow-green">
      <CardContent class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-muted-foreground">New Today</p>
            <p class="text-3xl font-bold text-accent">+{stats.newToday}</p>
          </div>
          <TrendingUp class="w-8 h-8 text-accent" />
        </div>
      </CardContent>
    </Card>

    <Card class="glass-card neon-glow-blue">
      <CardContent class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-muted-foreground">Deadlines This Week</p>
            <p class="text-3xl font-bold text-secondary">
              {stats.deadlinesWeek}
            </p>
          </div>
          <Clock class="w-8 h-8 text-secondary" />
        </div>
      </CardContent>
    </Card>

    <Card class="glass-card neon-glow-purple">
      <CardContent class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-muted-foreground">Success Rate</p>
            <p class="text-3xl font-bold text-primary">{stats.successRate}%</p>
          </div>
          <Award class="w-8 h-8 text-primary" />
        </div>
      </CardContent>
    </Card>
  </div>

  <!-- Search and Filters -->
  <div class="flex gap-4">
    <div class="relative flex-1">
      <Search
        class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"
      />
      <Input
        bind:value={searchQuery}
        placeholder="Search grants by name, source, or keyword..."
        class="pl-10 glass-card border-primary/20 focus:border-primary"
      />
    </div>
    <Button class="bg-primary hover:bg-primary/90 neon-glow-purple">
      <Filter class="w-4 h-4 mr-2" />
      Filters
    </Button>
  </div>

  <!-- Crawler Status -->
  <Card class="glass-card border-accent/30">
    <CardContent class="p-4">
      <div class="flex items-center gap-4">
        <div
          class="w-3 h-3 rounded-full bg-accent animate-pulse-glow neon-glow-green"
        ></div>
        <span class="text-sm text-foreground"
          >Live crawler active - Last updated 2 minutes ago</span
        >
        <div class="flex-1"></div>
        <div class="flex gap-3 text-xs">
          <span class="text-muted-foreground"
            >ANI <span class="text-accent">●</span></span
          >
          <span class="text-muted-foreground"
            >IAPMEI <span class="text-accent">●</span></span
          >
          <span class="text-muted-foreground"
            >COMPETE <span class="text-accent">●</span></span
          >
          <span class="text-muted-foreground"
            >Horizon EU <span class="text-accent">●</span></span
          >
        </div>
      </div>
    </CardContent>
  </Card>

  <!-- Grants Grid -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
    {#each grants as grant}
      <Card
        class="glass-card hover:border-primary/50 transition-all duration-300 group"
      >
        <CardHeader>
          <div class="flex items-start justify-between gap-4">
            <div class="space-y-2 flex-1">
              <CardTitle
                class="text-lg group-hover:text-primary transition-colors"
              >
                {grant.name}
              </CardTitle>
              <div class="flex gap-2">
                <Badge variant="outline" class="border-primary/30 text-primary">
                  {grant.source}
                </Badge>
                <Badge
                  variant="outline"
                  class="border-secondary/30 text-secondary"
                >
                  {grant.region}
                </Badge>
              </div>
            </div>
            <Badge
              class="bg-accent/20 text-accent border-accent/30 text-lg px-3 py-1"
            >
              {grant.amount}
            </Badge>
          </div>
        </CardHeader>
        <CardContent class="space-y-4">
          <!-- AI Relevance -->
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-muted-foreground">AI Relevance Match</span>
              <span class="text-primary font-semibold">{grant.relevance}%</span>
            </div>
            <Progress value={grant.relevance} class="h-2" />
          </div>

          <!-- Deadline -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock class="w-4 h-4" />
              <span>Deadline: {grant.deadline}</span>
            </div>
            <span
              class="text-sm font-medium {grant.daysLeft < 90
                ? 'text-destructive'
                : 'text-accent'}"
            >
              {grant.daysLeft} days left
            </span>
          </div>

          <!-- Action Button -->
          <Button
            class="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 neon-glow-purple"
            onclick={() => handleApply(grant)}
          >
            Apply Now
          </Button>
        </CardContent>
      </Card>
    {/each}
  </div>
</div>

<GrantGatekeeper
  open={showGatekeeper}
  grant={selectedGrant}
  on:close={() => (showGatekeeper = false)}
  on:select={handleModeSelect}
/>
