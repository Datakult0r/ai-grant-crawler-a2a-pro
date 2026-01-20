<script lang="ts">
  import { Plus, MoreVertical, Loader2, GripVertical } from 'lucide-svelte';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import { onMount } from 'svelte';
  import { fetchTracker, updateProposalStatus } from '$lib/api';

  type Application = {
    id: number;
    grant: string;
    amount: string;
    submitted: string;
    status: 'draft' | 'applied' | 'review' | 'awarded' | 'rejected';
  };

  let applications = $state<Record<string, Application[]>>({
    draft: [],
    applied: [],
    review: [],
    awarded: [],
    rejected: []
  });
  let loading = $state(true);
  let error = $state<string | null>(null);
  let draggedApp = $state<Application | null>(null);
  let dragOverColumn = $state<string | null>(null);
  let updating = $state(false);

  onMount(async () => {
    try {
      const data = await fetchTracker();
      applications = data.applications || {
        draft: [],
        applied: [],
        review: [],
        awarded: [],
        rejected: []
      };
    } catch (e) {
      console.error('Failed to fetch tracker data:', e);
      error = e instanceof Error ? e.message : 'Failed to load tracker';
      // Use demo data on error
      applications = {
        draft: [],
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
    } finally {
      loading = false;
    }
  });

  const columns = $derived([
    { id: 'draft', title: 'Draft', color: 'bg-muted/20 border-muted/30', count: applications.draft?.length || 0 },
    { id: 'applied', title: 'Applied', color: 'bg-secondary/20 border-secondary/30', count: applications.applied?.length || 0 },
    { id: 'review', title: 'Under Review', color: 'bg-yellow-500/20 border-yellow-500/30', count: applications.review?.length || 0 },
    { id: 'awarded', title: 'Awarded', color: 'bg-accent/20 border-accent/30', count: applications.awarded?.length || 0 },
    { id: 'rejected', title: 'Rejected', color: 'bg-destructive/20 border-destructive/30', count: applications.rejected?.length || 0 }
  ]);

  // Drag and drop handlers
  function handleDragStart(e: DragEvent, app: Application, columnId: string) {
    if (!e.dataTransfer) return;
    draggedApp = app;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({ appId: app.id, fromColumn: columnId }));
    
    // Add visual feedback
    const target = e.target as HTMLElement;
    setTimeout(() => target.classList.add('opacity-50'), 0);
  }

  function handleDragEnd(e: DragEvent) {
    draggedApp = null;
    dragOverColumn = null;
    const target = e.target as HTMLElement;
    target.classList.remove('opacity-50');
  }

  function handleDragOver(e: DragEvent, columnId: string) {
    e.preventDefault();
    if (!e.dataTransfer) return;
    e.dataTransfer.dropEffect = 'move';
    dragOverColumn = columnId;
  }

  function handleDragLeave(e: DragEvent) {
    // Only clear if leaving the column entirely
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!relatedTarget?.closest('[data-column]')) {
      dragOverColumn = null;
    }
  }

  async function handleDrop(e: DragEvent, toColumnId: string) {
    e.preventDefault();
    dragOverColumn = null;
    
    if (!e.dataTransfer || !draggedApp) return;
    
    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    const fromColumnId = data.fromColumn;
    const appId = data.appId;
    
    if (fromColumnId === toColumnId) return;
    
    // Find the app in the source column
    const app = applications[fromColumnId]?.find((a: Application) => a.id === appId);
    if (!app) return;
    
    // Optimistically update UI
    const updatedApp = { ...app, status: toColumnId as Application['status'] };
    applications = {
      ...applications,
      [fromColumnId]: applications[fromColumnId].filter((a: Application) => a.id !== appId),
      [toColumnId]: [...(applications[toColumnId] || []), updatedApp]
    };
    
    // Update backend
    updating = true;
    try {
      await updateProposalStatus(appId, toColumnId);
    } catch (err) {
      console.error('Failed to update status:', err);
      // Revert on error
      applications = {
        ...applications,
        [fromColumnId]: [...applications[fromColumnId], app],
        [toColumnId]: applications[toColumnId].filter((a: Application) => a.id !== appId)
      };
    } finally {
      updating = false;
    }
  }
</script>

<div class="p-8 space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div class="space-y-2">
      <h1 class="text-4xl font-bold text-balance bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
        Application Tracker
      </h1>
      <p class="text-muted-foreground text-lg">
        Drag and drop cards to update application status
      </p>
    </div>
    <div class="flex items-center gap-3">
      {#if updating}
        <Badge variant="outline" class="text-xs animate-pulse">
          <Loader2 class="w-3 h-3 mr-1 animate-spin" />
          Saving...
        </Badge>
      {/if}
      <Button class="bg-primary hover:bg-primary/90 neon-glow-purple">
        <Plus class="w-4 h-4 mr-2" />
        New Application
      </Button>
    </div>
  </div>

  <!-- Loading State -->
  {#if loading}
    <Card class="glass-card border-primary/30">
      <CardContent class="p-8 flex flex-col items-center justify-center gap-4">
        <Loader2 class="w-8 h-8 text-primary animate-spin" />
        <p class="text-muted-foreground">Loading applications...</p>
      </CardContent>
    </Card>
  {:else}
    <!-- Kanban Board -->
    <div class="grid grid-cols-5 gap-4">
      {#each columns as column}
        <div 
          class="space-y-4"
          data-column={column.id}
          ondragover={(e) => handleDragOver(e, column.id)}
          ondragleave={handleDragLeave}
          ondrop={(e) => handleDrop(e, column.id)}
        >
          <!-- Column Header -->
          <Card class="glass-card {column.color} {dragOverColumn === column.id ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}">
            <CardHeader class="p-4">
              <div class="flex items-center justify-between">
                <CardTitle class="text-sm font-semibold text-foreground">{column.title}</CardTitle>
                <Badge variant="outline" class="text-xs">{column.count}</Badge>
              </div>
            </CardHeader>
          </Card>

          <!-- Drop Zone -->
          <div 
            class="space-y-3 min-h-[200px] rounded-lg transition-all duration-200 {dragOverColumn === column.id ? 'bg-primary/10 border-2 border-dashed border-primary/50' : ''}"
          >
            {#each applications[column.id] || [] as app (app.id)}
              <Card 
                class="glass-card hover:border-primary/50 transition-all duration-300 cursor-grab active:cursor-grabbing group {draggedApp?.id === app.id ? 'opacity-50' : ''}"
                draggable="true"
                ondragstart={(e) => handleDragStart(e, app, column.id)}
                ondragend={handleDragEnd}
              >
                <CardContent class="p-4 space-y-3">
                  <div class="flex items-start justify-between">
                    <div class="flex items-start gap-2">
                      <GripVertical class="w-4 h-4 text-muted-foreground/50 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <h3 class="font-semibold text-sm text-foreground leading-tight group-hover:text-primary transition-colors">
                        {app.grant}
                      </h3>
                    </div>
                    <button class="text-muted-foreground hover:text-foreground">
                      <MoreVertical class="w-4 h-4" />
                    </button>
                  </div>
                  <div class="flex items-center justify-between pl-6">
                    <span class="text-xs text-muted-foreground">Submitted</span>
                    <span class="text-xs font-medium text-foreground">{app.submitted}</span>
                  </div>
                  <Badge class="w-full justify-center bg-primary/20 text-primary border-primary/30">
                    {app.amount}
                  </Badge>
                </CardContent>
              </Card>
            {/each}
            
            <!-- Empty state -->
            {#if (applications[column.id]?.length || 0) === 0}
              <div class="flex items-center justify-center h-24 text-muted-foreground/50 text-sm">
                Drop applications here
              </div>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
