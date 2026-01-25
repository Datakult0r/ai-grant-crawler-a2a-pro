<script lang="ts">
  import { onMount } from 'svelte';
  import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { 
    BarChart3, 
    TrendingUp, 
    Clock, 
    Target, 
    FileText, 
    Loader2,
    ArrowUp,
    ArrowDown,
    Minus
  } from 'lucide-svelte';
  import { env } from '$env/dynamic/public';

  const API_BASE = env.PUBLIC_API_URL || 'http://localhost:3000/api';

  interface DashboardStats {
    overview: {
      totalGrants: number;
      activeGrants: number;
      newGrantsThisWeek: number;
      totalProposals: number;
      proposalsThisMonth: number;
      avgRelevanceScore: number;
    };
    proposalsByStatus: {
      draft: number;
      submitted: number;
      approved: number;
      rejected: number;
    };
  }

  interface SuccessRate {
    source: string;
    total: number;
    submitted: number;
    approved: number;
    successRate: number;
    submissionRate: number;
  }

  interface GenerationTime {
    fastTrack: {
      count: number;
      avgTimeSeconds: number;
      avgTimeFormatted: string;
    };
    researchTrack: {
      count: number;
      avgTimeSeconds: number;
      avgTimeFormatted: string;
    };
  }

  interface RelevanceDistribution {
    distribution: Record<string, number>;
  }

  interface GrantsBySource {
    sources: Array<{ source: string; count: number }>;
  }

  interface TrendData {
    trends: Array<{ date: string; grants: number; proposals: number }>;
    period: number;
  }

  let dashboardStats = $state<DashboardStats | null>(null);
  let successRates = $state<SuccessRate[]>([]);
  let generationTime = $state<GenerationTime | null>(null);
  let relevanceDistribution = $state<Record<string, number>>({});
  let grantsBySource = $state<Array<{ source: string; count: number }>>([]);
  let trends = $state<TrendData | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);

  async function fetchAnalytics() {
    loading = true;
    error = null;
    
    try {
      const [dashboardRes, successRes, genTimeRes, relevanceRes, sourcesRes, trendsRes] = await Promise.all([
        fetch(`${API_BASE}/analytics/dashboard`),
        fetch(`${API_BASE}/analytics/success-rate`),
        fetch(`${API_BASE}/analytics/generation-time`),
        fetch(`${API_BASE}/analytics/relevance-distribution`),
        fetch(`${API_BASE}/analytics/grants-by-source`),
        fetch(`${API_BASE}/analytics/trends?period=30`)
      ]);

      if (dashboardRes.ok) dashboardStats = await dashboardRes.json();
      if (successRes.ok) {
        const data = await successRes.json();
        successRates = data.successRates || [];
      }
      if (genTimeRes.ok) generationTime = await genTimeRes.json();
      if (relevanceRes.ok) {
        const data = await relevanceRes.json();
        relevanceDistribution = data.distribution || {};
      }
      if (sourcesRes.ok) {
        const data = await sourcesRes.json();
        grantsBySource = data.sources || [];
      }
      if (trendsRes.ok) trends = await trendsRes.json();
    } catch (e) {
      console.error('Failed to fetch analytics:', e);
      error = 'Failed to load analytics data';
    } finally {
      loading = false;
    }
  }

  function getMaxDistribution(): number {
    return Math.max(...Object.values(relevanceDistribution), 1);
  }

  function getMaxSourceCount(): number {
    return Math.max(...grantsBySource.map(s => s.count), 1);
  }

  function getTrendChange(data: TrendData | null, key: 'grants' | 'proposals'): { value: number; direction: 'up' | 'down' | 'neutral' } {
    if (!data || data.trends.length < 14) return { value: 0, direction: 'neutral' };
    
    const recent = data.trends.slice(-7).reduce((sum, d) => sum + d[key], 0);
    const previous = data.trends.slice(-14, -7).reduce((sum, d) => sum + d[key], 0);
    
    if (previous === 0) return { value: recent > 0 ? 100 : 0, direction: recent > 0 ? 'up' : 'neutral' };
    
    const change = Math.round(((recent - previous) / previous) * 100);
    return {
      value: Math.abs(change),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
    };
  }

  onMount(fetchAnalytics);
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center gap-3">
    <div class="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
      <BarChart3 class="w-5 h-5 text-primary" />
    </div>
    <div>
      <h1 class="text-2xl font-bold text-foreground">Analytics Dashboard</h1>
      <p class="text-muted-foreground">Insights into grant application performance</p>
    </div>
  </div>

  {#if loading}
    <div class="flex items-center justify-center py-20">
      <Loader2 class="w-8 h-8 animate-spin text-primary" />
    </div>
  {:else if error}
    <Card class="glass-card">
      <CardContent class="pt-6">
        <p class="text-destructive text-center">{error}</p>
      </CardContent>
    </Card>
  {:else}
    <!-- Overview Stats -->
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <Card class="glass-card">
        <CardContent class="pt-6">
          <div class="text-2xl font-bold text-foreground">{dashboardStats?.overview.totalGrants || 0}</div>
          <p class="text-sm text-muted-foreground">Total Grants</p>
        </CardContent>
      </Card>
      <Card class="glass-card">
        <CardContent class="pt-6">
          <div class="text-2xl font-bold text-accent">{dashboardStats?.overview.activeGrants || 0}</div>
          <p class="text-sm text-muted-foreground">Active Grants</p>
        </CardContent>
      </Card>
      <Card class="glass-card">
        <CardContent class="pt-6">
          <div class="flex items-center gap-2">
            <span class="text-2xl font-bold text-primary">{dashboardStats?.overview.newGrantsThisWeek || 0}</span>
            {#if trends}
              {@const change = getTrendChange(trends, 'grants')}
              {#if change.direction === 'up'}
                <ArrowUp class="w-4 h-4 text-accent" />
              {:else if change.direction === 'down'}
                <ArrowDown class="w-4 h-4 text-destructive" />
              {:else}
                <Minus class="w-4 h-4 text-muted-foreground" />
              {/if}
            {/if}
          </div>
          <p class="text-sm text-muted-foreground">New This Week</p>
        </CardContent>
      </Card>
      <Card class="glass-card">
        <CardContent class="pt-6">
          <div class="text-2xl font-bold text-foreground">{dashboardStats?.overview.totalProposals || 0}</div>
          <p class="text-sm text-muted-foreground">Total Proposals</p>
        </CardContent>
      </Card>
      <Card class="glass-card">
        <CardContent class="pt-6">
          <div class="text-2xl font-bold text-primary">{dashboardStats?.overview.proposalsThisMonth || 0}</div>
          <p class="text-sm text-muted-foreground">This Month</p>
        </CardContent>
      </Card>
      <Card class="glass-card">
        <CardContent class="pt-6">
          <div class="text-2xl font-bold text-accent">{dashboardStats?.overview.avgRelevanceScore || 0}%</div>
          <p class="text-sm text-muted-foreground">Avg Relevance</p>
        </CardContent>
      </Card>
    </div>

    <!-- Main Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Proposal Status Distribution -->
      <Card class="glass-card">
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <FileText class="w-5 h-5 text-primary" />
            Proposal Status
          </CardTitle>
          <CardDescription>Distribution of proposals by status</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            {#each Object.entries(dashboardStats?.proposalsByStatus || {}) as [status, count]}
              {@const total = Object.values(dashboardStats?.proposalsByStatus || {}).reduce((a, b) => a + b, 0) || 1}
              {@const percentage = Math.round((count / total) * 100)}
              <div class="space-y-2">
                <div class="flex justify-between text-sm">
                  <span class="capitalize text-foreground">{status}</span>
                  <span class="text-muted-foreground">{count} ({percentage}%)</span>
                </div>
                <div class="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    class="h-full rounded-full transition-all duration-500 {
                      status === 'approved' ? 'bg-accent' :
                      status === 'submitted' ? 'bg-primary' :
                      status === 'rejected' ? 'bg-destructive' :
                      'bg-muted-foreground'
                    }"
                    style="width: {percentage}%"
                  ></div>
                </div>
              </div>
            {/each}
          </div>
        </CardContent>
      </Card>

      <!-- Relevance Score Distribution -->
      <Card class="glass-card">
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Target class="w-5 h-5 text-primary" />
            Relevance Distribution
          </CardTitle>
          <CardDescription>Grant relevance score ranges</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="flex items-end gap-2 h-40">
            {#each Object.entries(relevanceDistribution) as [range, count]}
              {@const maxCount = getMaxDistribution()}
              {@const height = (count / maxCount) * 100}
              <div class="flex-1 flex flex-col items-center gap-2">
                <div class="w-full bg-muted rounded-t relative" style="height: {height}%">
                  <div class="absolute inset-0 bg-gradient-to-t from-primary to-primary/50 rounded-t"></div>
                  <div class="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-foreground font-medium">
                    {count}
                  </div>
                </div>
                <span class="text-xs text-muted-foreground">{range}</span>
              </div>
            {/each}
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Generation Time & Success Rate Row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Generation Time -->
      <Card class="glass-card">
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Clock class="w-5 h-5 text-primary" />
            Proposal Generation Time
          </CardTitle>
          <CardDescription>Average time by generation mode</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-2 gap-4">
            <div class="p-4 rounded-lg bg-muted/20 border border-border">
              <div class="flex items-center gap-2 mb-2">
                <Badge class="bg-primary/20 text-primary">Fast Track</Badge>
              </div>
              <div class="text-3xl font-bold text-foreground">
                {generationTime?.fastTrack.avgTimeFormatted || '0s'}
              </div>
              <p class="text-sm text-muted-foreground mt-1">
                {generationTime?.fastTrack.count || 0} proposals
              </p>
            </div>
            <div class="p-4 rounded-lg bg-muted/20 border border-border">
              <div class="flex items-center gap-2 mb-2">
                <Badge class="bg-accent/20 text-accent">Research Track</Badge>
              </div>
              <div class="text-3xl font-bold text-foreground">
                {generationTime?.researchTrack.avgTimeFormatted || '0s'}
              </div>
              <p class="text-sm text-muted-foreground mt-1">
                {generationTime?.researchTrack.count || 0} proposals
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Success Rate by Source -->
      <Card class="glass-card">
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <TrendingUp class="w-5 h-5 text-primary" />
            Success Rate by Source
          </CardTitle>
          <CardDescription>Proposal approval rates by grant source</CardDescription>
        </CardHeader>
        <CardContent>
          {#if successRates.length === 0}
            <p class="text-muted-foreground text-center py-4">No data available yet</p>
          {:else}
            <div class="space-y-3">
              {#each successRates.slice(0, 5) as rate}
                <div class="flex items-center justify-between p-2 rounded-lg bg-muted/10">
                  <div class="flex-1">
                    <p class="text-sm font-medium text-foreground">{rate.source}</p>
                    <p class="text-xs text-muted-foreground">{rate.total} proposals</p>
                  </div>
                  <div class="flex items-center gap-3">
                    <div class="text-right">
                      <p class="text-sm font-bold text-accent">{rate.successRate}%</p>
                      <p class="text-xs text-muted-foreground">approved</p>
                    </div>
                    <div class="w-16 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        class="h-full bg-accent rounded-full"
                        style="width: {rate.successRate}%"
                      ></div>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </CardContent>
      </Card>
    </div>

    <!-- Grants by Source -->
    <Card class="glass-card">
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <BarChart3 class="w-5 h-5 text-primary" />
          Grants by Source
        </CardTitle>
        <CardDescription>Distribution of grants across different sources</CardDescription>
      </CardHeader>
      <CardContent>
        {#if grantsBySource.length === 0}
          <p class="text-muted-foreground text-center py-4">No data available yet</p>
        {:else}
          <div class="space-y-3">
            {#each grantsBySource.slice(0, 8) as source}
              {@const maxCount = getMaxSourceCount()}
              {@const percentage = (source.count / maxCount) * 100}
              <div class="space-y-1">
                <div class="flex justify-between text-sm">
                  <span class="text-foreground">{source.source}</span>
                  <span class="text-muted-foreground">{source.count} grants</span>
                </div>
                <div class="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    class="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                    style="width: {percentage}%"
                  ></div>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </CardContent>
    </Card>

    <!-- 30-Day Trend (Simple visualization) -->
    {#if trends && trends.trends.length > 0}
      <Card class="glass-card">
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <TrendingUp class="w-5 h-5 text-primary" />
            30-Day Activity Trend
          </CardTitle>
          <CardDescription>Grants discovered and proposals generated over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="flex items-end gap-1 h-32">
            {#each trends.trends as day, i}
              {@const maxActivity = Math.max(...trends.trends.map(d => d.grants + d.proposals), 1)}
              {@const height = ((day.grants + day.proposals) / maxActivity) * 100}
              <div 
                class="flex-1 bg-gradient-to-t from-primary/50 to-primary rounded-t transition-all duration-300 hover:from-primary/70 hover:to-primary/90"
                style="height: {Math.max(height, 2)}%"
                title="{day.date}: {day.grants} grants, {day.proposals} proposals"
              ></div>
            {/each}
          </div>
          <div class="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>{trends.trends[0]?.date || ''}</span>
            <span>{trends.trends[trends.trends.length - 1]?.date || ''}</span>
          </div>
          <div class="flex items-center justify-center gap-6 mt-4">
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded bg-primary"></div>
              <span class="text-sm text-muted-foreground">Grants + Proposals</span>
            </div>
          </div>
        </CardContent>
      </Card>
    {/if}
  {/if}
</div>
