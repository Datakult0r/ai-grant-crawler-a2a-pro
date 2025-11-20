<script lang="ts">
  import { Plus, MoreVertical } from 'lucide-svelte';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';

  type Application = {
    id: number;
    grant: string;
    amount: string;
    submitted: string;
    status: 'applied' | 'review' | 'awarded' | 'rejected';
  };

  const applications: Record<string, Application[]> = {
    applied: [
      { id: 1, grant: 'Horizon Europe - AI Innovation', amount: '€2.5M', submitted: '2024-11-15', status: 'applied' },
      { id: 2, grant: 'COMPETE 2030 - Digital', amount: '€800K', submitted: '2024-11-10', status: 'applied' }
    ],
    review: [
      { id: 3, grant: 'EIC Accelerator', amount: '€2M', submitted: '2024-10-20', status: 'review' },
      { id: 4, grant: 'ANI Innovation', amount: '€500K', submitted: '2024-10-15', status: 'review' }
    ],
    awarded: [
      { id: 5, grant: 'IAPMEI SME Growth', amount: '€300K', submitted: '2024-09-01', status: 'awarded' }
    ],
    rejected: [
      { id: 6, grant: 'Horizon Europe - Green', amount: '€1.5M', submitted: '2024-08-15', status: 'rejected' }
    ]
  };

  const columns = [
    { id: 'applied', title: 'Applied', color: 'bg-secondary/20 border-secondary/30', count: applications.applied.length },
    { id: 'review', title: 'Under Review', color: 'bg-yellow-500/20 border-yellow-500/30', count: applications.review.length },
    { id: 'awarded', title: 'Awarded', color: 'bg-accent/20 border-accent/30', count: applications.awarded.length },
    { id: 'rejected', title: 'Rejected', color: 'bg-destructive/20 border-destructive/30', count: applications.rejected.length }
  ];
</script>

<div class="p-8 space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div class="space-y-2">
      <h1 class="text-4xl font-bold text-balance bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
        Application Tracker
      </h1>
      <p class="text-muted-foreground text-lg">
        Manage your grant applications with drag-and-drop kanban board
      </p>
    </div>
    <Button class="bg-primary hover:bg-primary/90 neon-glow-purple">
      <Plus class="w-4 h-4 mr-2" />
      New Application
    </Button>
  </div>

  <!-- Kanban Board -->
  <div class="grid grid-cols-4 gap-4">
    {#each columns as column}
      <div class="space-y-4">
        <!-- Column Header -->
        <Card class="glass-card {column.color}">
          <CardHeader class="p-4">
            <div class="flex items-center justify-between">
              <CardTitle class="text-sm font-semibold text-foreground">{column.title}</CardTitle>
              <Badge variant="outline" class="text-xs">{column.count}</Badge>
            </div>
          </CardHeader>
        </Card>

        <!-- Cards -->
        <div class="space-y-3">
          {#each applications[column.id] as app}
            <Card class="glass-card hover:border-primary/50 transition-all duration-300 cursor-move group">
              <CardContent class="p-4 space-y-3">
                <div class="flex items-start justify-between">
                  <h3 class="font-semibold text-sm text-foreground leading-tight group-hover:text-primary transition-colors">
                    {app.grant}
                  </h3>
                  <button class="text-muted-foreground hover:text-foreground">
                    <MoreVertical class="w-4 h-4" />
                  </button>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-xs text-muted-foreground">Submitted</span>
                  <span class="text-xs font-medium text-foreground">{app.submitted}</span>
                </div>
                <Badge class="w-full justify-center bg-primary/20 text-primary border-primary/30">
                  {app.amount}
                </Badge>
              </CardContent>
            </Card>
          {/each}
        </div>
      </div>
    {/each}
  </div>
</div>
