<script lang="ts">
  import { Sparkles, ArrowRight, CheckCircle2 } from 'lucide-svelte';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import { Progress } from '$lib/components/ui/progress';

  const matches = [
    {
      id: 1,
      grantProblem: 'Develop AI solutions for healthcare diagnostics with emphasis on early disease detection',
      aiSolution: 'Computer vision GenAI model for medical image analysis with 98% accuracy in tumor detection',
      matchScore: 94,
      category: 'high'
    },
    {
      id: 2,
      grantProblem: 'Create sustainable smart city infrastructure with real-time monitoring capabilities',
      aiSolution: 'IoT + AI predictive maintenance system with GenAI-powered anomaly detection',
      matchScore: 87,
      category: 'high'
    },
    {
      id: 3,
      grantProblem: 'Improve customer service automation while maintaining personalization',
      aiSolution: 'Large Language Model chatbot with RAG for personalized customer interactions',
      matchScore: 91,
      category: 'high'
    },
    {
      id: 4,
      grantProblem: 'Enhance manufacturing quality control through automated inspection',
      aiSolution: 'Vision AI defect detection system with real-time quality scoring',
      matchScore: 76,
      category: 'medium'
    },
    {
      id: 5,
      grantProblem: 'Develop climate change adaptation strategies using data analytics',
      aiSolution: 'GenAI climate modeling system with predictive environmental analytics',
      matchScore: 68,
      category: 'medium'
    },
    {
      id: 6,
      grantProblem: 'Create educational tools for personalized learning experiences',
      aiSolution: 'Adaptive GenAI tutoring system with multi-modal learning support',
      matchScore: 42,
      category: 'low'
    }
  ];

  let activeTab = $state('high');
  let analyzing = true;

  function getMatchColor(score: number) {
    if (score >= 80) return 'text-accent';
    if (score >= 50) return 'text-yellow-500';
    return 'text-destructive';
  }

  function getMatchBorderColor(score: number) {
    if (score >= 80) return 'border-accent/30';
    if (score >= 50) return 'border-yellow-500/30';
    return 'border-destructive/30';
  }

  const filteredMatches = $derived(matches.filter(m => m.category === activeTab));
</script>

<div class="p-8 space-y-6">
  <!-- Header -->
  <div class="space-y-2">
    <h1 class="text-4xl font-bold text-balance bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
      Problem-Solution Matcher
    </h1>
    <p class="text-muted-foreground text-lg">
      AI agent analyzes grant problems and matches to GenAI solutions
    </p>
  </div>

  <!-- AI Agent Status -->
  {#if analyzing}
    <Card class="glass-card border-accent/30 neon-glow-green">
      <CardContent class="p-6">
        <div class="flex items-center gap-4">
          <div class="flex items-center justify-center w-12 h-12 rounded-full bg-accent/20">
            <Sparkles class="w-6 h-6 text-accent animate-pulse" />
          </div>
          <div class="flex-1">
            <p class="font-semibold text-foreground">AI Agent Thinking...</p>
            <p class="text-sm text-muted-foreground">Analyzing grant requirements and matching to GenAI capabilities</p>
          </div>
          <Progress value={75} class="w-32" />
        </div>
      </CardContent>
    </Card>
  {:else}
    <Card class="glass-card border-primary/30">
      <CardContent class="p-6">
        <div class="flex items-center gap-4">
          <div class="flex items-center justify-center w-12 h-12 rounded-full bg-primary/20">
            <CheckCircle2 class="w-6 h-6 text-primary" />
          </div>
          <div>
            <p class="font-semibold text-foreground">Analysis Complete</p>
            <p class="text-sm text-muted-foreground">Found {matches.length} potential matches across all categories</p>
          </div>
        </div>
      </CardContent>
    </Card>
  {/if}

  <!-- Filter Tabs -->
  <!-- Replaced Tabs component with custom tab buttons to avoid Svelte 4 event syntax -->
  <Card class="glass-card border-primary/20">
    <CardContent class="p-2">
      <div class="flex gap-2">
        <button
          onclick={() => activeTab = 'high'}
          class="flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors
                 {activeTab === 'high' 
                   ? 'bg-accent/20 text-accent' 
                   : 'text-muted-foreground hover:text-foreground hover:bg-muted'}"
        >
          High Match ({'>'}80%)
          <Badge class="ml-2 bg-accent/20 text-accent border-accent/30">{matches.filter(m => m.category === 'high').length}</Badge>
        </button>
        <button
          onclick={() => activeTab = 'medium'}
          class="flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors
                 {activeTab === 'medium' 
                   ? 'bg-yellow-500/20 text-yellow-500' 
                   : 'text-muted-foreground hover:text-foreground hover:bg-muted'}"
        >
          Medium (50-80%)
          <Badge class="ml-2 bg-yellow-500/20 text-yellow-500 border-yellow-500/30">{matches.filter(m => m.category === 'medium').length}</Badge>
        </button>
        <button
          onclick={() => activeTab = 'low'}
          class="flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors
                 {activeTab === 'low' 
                   ? 'bg-destructive/20 text-destructive' 
                   : 'text-muted-foreground hover:text-foreground hover:bg-muted'}"
        >
          Low ({'<'}50%)
          <Badge class="ml-2 bg-destructive/20 text-destructive border-destructive/30">{matches.filter(m => m.category === 'low').length}</Badge>
        </button>
      </div>
    </CardContent>
  </Card>

  <!-- Matches Grid -->
  <div class="space-y-4">
    {#each filteredMatches as match}
      <Card class="glass-card hover:border-primary/50 transition-all duration-300 {getMatchBorderColor(match.matchScore)}">
        <CardContent class="p-6">
          <div class="grid grid-cols-[1fr,auto,1fr,auto] gap-6 items-center">
            <!-- Grant Problem -->
            <div class="space-y-2">
              <div class="flex items-center gap-2 mb-3">
                <div class="w-2 h-2 rounded-full bg-secondary"></div>
                <span class="text-xs font-semibold text-secondary uppercase tracking-wider">Grant Problem</span>
              </div>
              <p class="text-sm text-foreground leading-relaxed">
                {match.grantProblem}
              </p>
            </div>

            <!-- Arrow -->
            <ArrowRight class="w-6 h-6 {getMatchColor(match.matchScore)}" />

            <!-- AI Solution -->
            <div class="space-y-2">
              <div class="flex items-center gap-2 mb-3">
                <div class="w-2 h-2 rounded-full bg-primary"></div>
                <span class="text-xs font-semibold text-primary uppercase tracking-wider">AI Solution</span>
              </div>
              <p class="text-sm text-foreground leading-relaxed">
                {match.aiSolution}
              </p>
            </div>

            <!-- Match Score & Action -->
            <div class="flex flex-col items-center gap-4">
              <!-- Circular Progress -->
              <div class="relative w-24 h-24">
                <svg class="transform -rotate-90 w-24 h-24">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    stroke-width="6"
                    fill="none"
                    class="text-muted"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    stroke-width="6"
                    fill="none"
                    stroke-dasharray="{2 * Math.PI * 40}"
                    stroke-dashoffset="{2 * Math.PI * 40 * (1 - match.matchScore / 100)}"
                    class="{getMatchColor(match.matchScore)}"
                    stroke-linecap="round"
                  />
                </svg>
                <div class="absolute inset-0 flex items-center justify-center">
                  <span class="text-2xl font-bold {getMatchColor(match.matchScore)}">{match.matchScore}%</span>
                </div>
              </div>

              <Button class="bg-primary hover:bg-primary/90 neon-glow-purple whitespace-nowrap">
                <Sparkles class="w-4 h-4 mr-2" />
                Generate Pitch
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    {/each}
  </div>
</div>
