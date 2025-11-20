<script lang="ts">
  import { TrendingUp, Target, Users, DollarSign, Calendar } from 'lucide-svelte';
  import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
  import { Progress } from '$lib/components/ui/progress';
  import { Badge } from '$lib/components/ui/badge';

  const prediction = {
    overallScore: 84,
    factors: [
      { name: 'Technical Excellence', score: 92, weight: 30 },
      { name: 'Team Qualifications', score: 88, weight: 25 },
      { name: 'Budget Alignment', score: 76, weight: 20 },
      { name: 'Innovation Level', score: 90, weight: 15 },
      { name: 'Market Potential', score: 72, weight: 10 }
    ],
    recommendations: [
      'Strengthen budget justification with more detailed cost breakdown',
      'Add 2-3 letters of support from industry partners',
      'Include more specific KPIs and success metrics',
      'Enhance dissemination plan with concrete publication targets'
    ]
  };

  const historicalData = [
    { month: 'Jan', rate: 65 },
    { month: 'Feb', rate: 68 },
    { month: 'Mar', rate: 72 },
    { month: 'Apr', rate: 70 },
    { month: 'May', rate: 75 },
    { month: 'Jun', rate: 78 },
    { month: 'Jul', rate: 82 },
    { month: 'Aug', rate: 84 }
  ];
</script>

<div class="p-8 space-y-6">
  <!-- Header -->
  <div class="space-y-2">
    <h1 class="text-4xl font-bold text-balance bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
      Win Probability Predictor
    </h1>
    <p class="text-muted-foreground text-lg">
      AI analyzes your application fit vs grant criteria
    </p>
  </div>

  <div class="grid grid-cols-3 gap-6">
    <!-- Main Score -->
    <Card class="glass-card border-accent/30 neon-glow-green">
      <CardHeader>
        <CardTitle class="text-center">Overall Win Probability</CardTitle>
      </CardHeader>
      <CardContent class="flex flex-col items-center">
        <div class="relative w-48 h-48">
          <svg class="transform -rotate-90 w-48 h-48">
            <circle
              cx="96"
              cy="96"
              r="80"
              stroke="currentColor"
              stroke-width="12"
              fill="none"
              class="text-muted"
            />
            <circle
              cx="96"
              cy="96"
              r="80"
              stroke="currentColor"
              stroke-width="12"
              fill="none"
              stroke-dasharray="{2 * Math.PI * 80}"
              stroke-dashoffset="{2 * Math.PI * 80 * (1 - prediction.overallScore / 100)}"
              class="text-accent"
              stroke-linecap="round"
            />
          </svg>
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <span class="text-6xl font-bold text-accent">{prediction.overallScore}%</span>
            <span class="text-sm text-muted-foreground mt-2">High Confidence</span>
          </div>
        </div>
        <Badge class="mt-6 bg-accent/20 text-accent border-accent/30 px-4 py-2 text-base">
          Strong Application
        </Badge>
      </CardContent>
    </Card>

    <!-- Factor Breakdown -->
    <Card class="col-span-2 glass-card">
      <CardHeader>
        <CardTitle>Success Factor Breakdown</CardTitle>
        <CardDescription>Individual component analysis with weighted importance</CardDescription>
      </CardHeader>
      <CardContent class="space-y-6">
        {#each prediction.factors as factor}
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <span class="text-sm font-medium text-foreground">{factor.name}</span>
                <Badge variant="outline" class="text-xs">{factor.weight}% weight</Badge>
              </div>
              <span class="text-sm font-semibold {factor.score >= 80 ? 'text-accent' : factor.score >= 60 ? 'text-yellow-500' : 'text-destructive'}">
                {factor.score}%
              </span>
            </div>
            <Progress value={factor.score} class="h-2" />
          </div>
        {/each}
      </CardContent>
    </Card>
  </div>

  <!-- Recommendations -->
  <Card class="glass-card border-primary/30">
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <Target class="w-5 h-5 text-primary" />
        AI Recommendations to Improve
      </CardTitle>
      <CardDescription>Actionable insights to increase your win probability</CardDescription>
    </CardHeader>
    <CardContent>
      <div class="grid grid-cols-2 gap-4">
        {#each prediction.recommendations as rec, i}
          <div class="flex gap-3 p-4 bg-muted/20 rounded-lg border border-border">
            <div class="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
              {i + 1}
            </div>
            <p class="text-sm text-foreground leading-relaxed">{rec}</p>
          </div>
        {/each}
      </div>
    </CardContent>
  </Card>

  <!-- Historical Trend -->
  <Card class="glass-card">
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <TrendingUp class="w-5 h-5 text-secondary" />
        Success Rate Trend
      </CardTitle>
      <CardDescription>Your improving application quality over time</CardDescription>
    </CardHeader>
    <CardContent>
      <div class="flex items-end justify-between h-48 gap-2">
        {#each historicalData as data}
          <div class="flex-1 flex flex-col items-center gap-2">
            <div class="w-full bg-muted rounded-t-lg overflow-hidden relative" style="height: {data.rate}%;">
              <div class="absolute inset-0 bg-gradient-to-t from-primary to-secondary opacity-80"></div>
            </div>
            <span class="text-xs text-muted-foreground">{data.month}</span>
          </div>
        {/each}
      </div>
    </CardContent>
  </Card>
</div>
