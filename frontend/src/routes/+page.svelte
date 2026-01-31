<script lang="ts">
  import {
    Search,
    Filter,
    TrendingUp,
    Clock,
    Target,
    Award,
    AlertCircle,
    Loader2,
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
  import { toasts } from "$lib/stores/toast";

  // Grant data from Supabase
  interface GrantData {
    id: number;
    name: string;
    source: string;
    category: string;
    funding_amount: string;
    relevance_score: number;
    deadline: string;
    source_url: string;
    description: string;
    created_at: string;
  }

  // Transformed grant for display
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

  let rawGrants = $state<GrantData[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);

  // Gatekeeper state
  let showGatekeeper = $state(false);
  let selectedGrant = $state<Grant | null>(null);

  // Source badge colors
  const sourceColors: Record<string, { bg: string; text: string; border: string }> = {
    'ANI': { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
    'IAPMEI': { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
    'COMPETE': { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
    'Horizon EU': { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
    'Horizon Europe': { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
    'EIC': { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
    'NSF': { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
  };

  function getSourceColors(source: string) {
    // Check if source contains any known source name
    for (const [key, colors] of Object.entries(sourceColors)) {
      if (source.toLowerCase().includes(key.toLowerCase())) {
        return colors;
      }
    }
    return { bg: 'bg-primary/20', text: 'text-primary', border: 'border-primary/30' };
  }

  // Calculate days until deadline
  function calculateDaysLeft(deadline: string | null): number {
    if (!deadline) return 999;
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  // Transform raw grants to display format
  function transformGrants(raw: GrantData[]): Grant[] {
    return raw.map(g => ({
      id: g.id,
      name: g.name || 'Untitled Grant',
      source: g.source || 'Unknown',
      region: g.category || 'General',
      amount: g.funding_amount || 'TBD',
      relevance: g.relevance_score || 0,
      deadline: g.deadline ? new Date(g.deadline).toLocaleDateString() : 'TBD',
      daysLeft: calculateDaysLeft(g.deadline),
    }));
  }

  // Computed grants from raw data
  let grants = $derived(transformGrants(rawGrants));

  // Calculate stats dynamically from grants data
  let stats = $derived({
    total: rawGrants.length,
    newToday: rawGrants.filter(g => {
      const created = new Date(g.created_at);
      const today = new Date();
      return created.toDateString() === today.toDateString();
    }).length,
    deadlinesWeek: grants.filter(g => g.daysLeft <= 7 && g.daysLeft > 0).length,
    successRate: rawGrants.length > 0 
      ? Math.round(rawGrants.reduce((sum, g) => sum + (g.relevance_score || 0), 0) / rawGrants.length)
      : 0,
  });

  onMount(async () => {
    try {
      rawGrants = await fetchGrants();
      if (rawGrants.length > 0) {
        toasts.success('Grants loaded', `Found ${rawGrants.length} grants`);
      }
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : String(e);
      error = errorMessage;
      toasts.error('Failed to load grants', errorMessage);
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

  let searchQuery = $state("");
  let selectedRegion = $state("all");

  // Filter grants based on search query
  let filteredGrants = $derived(
    grants.filter(g => 
      searchQuery === "" || 
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.region.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );
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

  <!-- Loading State -->
  {#if loading}
    <Card class="glass-card border-primary/30">
      <CardContent class="p-8 flex flex-col items-center justify-center gap-4">
        <Loader2 class="w-8 h-8 text-primary animate-spin" />
        <p class="text-muted-foreground">Loading grants from database...</p>
      </CardContent>
    </Card>
  {:else if error}
    <Card class="glass-card border-destructive/30">
      <CardContent class="p-8 flex flex-col items-center justify-center gap-4">
        <AlertCircle class="w-8 h-8 text-destructive" />
        <p class="text-destructive font-medium">Failed to load grants</p>
        <p class="text-muted-foreground text-sm">{error}</p>
        <Button variant="outline" onclick={() => window.location.reload()}>
          Try Again
        </Button>
      </CardContent>
    </Card>
  {:else if filteredGrants.length === 0}
    <Card class="glass-card border-secondary/30">
      <CardContent class="p-8 flex flex-col items-center justify-center gap-4">
        <Target class="w-8 h-8 text-secondary" />
        <p class="text-muted-foreground">
          {searchQuery ? 'No grants match your search' : 'No grants available yet'}
        </p>
        {#if searchQuery}
          <Button variant="outline" onclick={() => searchQuery = ""}>
            Clear Search
          </Button>
        {/if}
      </CardContent>
    </Card>
  {/if}

    <!-- Grants Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {#each filteredGrants as grant}
        {@const colors = getSourceColors(grant.source)}
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
                  <Badge variant="outline" class="{colors.border} {colors.text} {colors.bg}">
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
