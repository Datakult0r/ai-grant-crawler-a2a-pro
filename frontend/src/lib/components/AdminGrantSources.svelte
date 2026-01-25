<script lang="ts">
  import { onMount } from "svelte";
  import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import { 
    Plus, 
    Trash2, 
    Globe, 
    Clock, 
    CheckCircle2, 
    XCircle, 
    Loader2,
    RefreshCw
  } from 'lucide-svelte';
  import { env } from '$env/dynamic/public';

  const API_BASE = env.PUBLIC_API_URL || 'http://localhost:3000/api';

  interface Source {
    id: number;
    url: string;
    name: string;
    type: string;
    status: string;
    scrape_frequency: string;
    last_crawled_at: string | null;
    created_at: string;
  }

  interface Stats {
    total: number;
    active: number;
    inactive: number;
    lastCrawled: string | null;
  }

  let sources = $state<Source[]>([]);
  let stats = $state<Stats | null>(null);
  let loading = $state(true);
  let saving = $state<number | null>(null);
  
  let newUrl = $state('');
  let newName = $state('');
  let newFrequency = $state('daily');
  let showAddForm = $state(false);
  let addingSource = $state(false);

  async function fetchSources() {
    loading = true;
    try {
      const res = await fetch(`${API_BASE}/admin/sources`);
      if (res.ok) sources = await res.json();
    } catch (e) {
      console.error('Failed to fetch sources:', e);
    } finally {
      loading = false;
    }
  }

  async function fetchStats() {
    try {
      const res = await fetch(`${API_BASE}/admin/sources/stats`);
      if (res.ok) stats = await res.json();
    } catch (e) {
      console.error('Failed to fetch stats:', e);
    }
  }

  async function addSource() {
    if (!newUrl) return;
    addingSource = true;
    try {
      const res = await fetch(`${API_BASE}/admin/sources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          url: newUrl, 
          name: newName || new URL(newUrl).hostname, 
          type: "manual",
          scrape_frequency: newFrequency
        }),
      });
      if (res.ok) {
        newUrl = '';
        newName = '';
        newFrequency = 'daily';
        showAddForm = false;
        await fetchSources();
        await fetchStats();
      }
    } catch (e) {
      console.error('Failed to add source:', e);
    } finally {
      addingSource = false;
    }
  }

  async function toggleStatus(source: Source) {
    saving = source.id;
    const newStatus = source.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await fetch(`${API_BASE}/admin/sources/${source.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        source.status = newStatus;
        sources = [...sources];
        await fetchStats();
      }
    } catch (e) {
      console.error('Failed to toggle status:', e);
    } finally {
      saving = null;
    }
  }

  async function updateFrequency(source: Source, frequency: string) {
    saving = source.id;
    try {
      const res = await fetch(`${API_BASE}/admin/sources/${source.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scrape_frequency: frequency }),
      });
      if (res.ok) {
        source.scrape_frequency = frequency;
        sources = [...sources];
      }
    } catch (e) {
      console.error('Failed to update frequency:', e);
    } finally {
      saving = null;
    }
  }

  async function deleteSource(id: number) {
    if (!confirm('Are you sure you want to delete this source?')) return;
    saving = id;
    try {
      const res = await fetch(`${API_BASE}/admin/sources/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        sources = sources.filter(s => s.id !== id);
        await fetchStats();
      }
    } catch (e) {
      console.error('Failed to delete source:', e);
    } finally {
      saving = null;
    }
  }

  onMount(() => {
    fetchSources();
    fetchStats();
  });
</script>

<div class="space-y-6">
  <!-- Stats Cards -->
  {#if stats}
    <div class="grid grid-cols-4 gap-4">
      <Card class="glass-card">
        <CardContent class="pt-6">
          <div class="text-2xl font-bold text-foreground">{stats.total}</div>
          <p class="text-sm text-muted-foreground">Total Sources</p>
        </CardContent>
      </Card>
      <Card class="glass-card">
        <CardContent class="pt-6">
          <div class="text-2xl font-bold text-accent">{stats.active}</div>
          <p class="text-sm text-muted-foreground">Active</p>
        </CardContent>
      </Card>
      <Card class="glass-card">
        <CardContent class="pt-6">
          <div class="text-2xl font-bold text-destructive">{stats.inactive}</div>
          <p class="text-sm text-muted-foreground">Inactive</p>
        </CardContent>
      </Card>
      <Card class="glass-card">
        <CardContent class="pt-6">
          <div class="text-sm font-medium text-foreground">
            {stats.lastCrawled ? new Date(stats.lastCrawled).toLocaleDateString() : 'Never'}
          </div>
          <p class="text-sm text-muted-foreground">Last Crawled</p>
        </CardContent>
      </Card>
    </div>
  {/if}

  <!-- Sources List -->
  <Card class="glass-card">
    <CardHeader>
      <div class="flex items-center justify-between">
        <div>
          <CardTitle class="flex items-center gap-2">
            <Globe class="w-5 h-5 text-primary" />
            Grant Discovery Sources
          </CardTitle>
          <CardDescription>Manage the sources for automatic grant discovery</CardDescription>
        </div>
        <div class="flex gap-2">
          <Button variant="outline" onclick={fetchSources} class="border-primary/30">
            <RefreshCw class="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onclick={() => showAddForm = !showAddForm} class="bg-primary hover:bg-primary/90">
            <Plus class="w-4 h-4 mr-2" />
            Add Source
          </Button>
        </div>
      </div>
    </CardHeader>
    <CardContent class="space-y-4">
      <!-- Add Source Form -->
      {#if showAddForm}
        <div class="p-4 rounded-lg bg-muted/20 border border-border space-y-4">
          <h3 class="font-medium text-foreground">Add New Source</h3>
          <div class="grid grid-cols-3 gap-4">
            <div class="space-y-2">
              <label for="newUrl" class="text-sm text-muted-foreground">Source URL</label>
              <input
                id="newUrl"
                type="url"
                bind:value={newUrl}
                placeholder="https://grants.gov/search"
                class="w-full p-2 rounded-lg bg-muted/50 border border-border focus:border-primary outline-none"
              />
            </div>
            <div class="space-y-2">
              <label for="newName" class="text-sm text-muted-foreground">Name (Optional)</label>
              <input
                id="newName"
                type="text"
                bind:value={newName}
                placeholder="Grants.gov"
                class="w-full p-2 rounded-lg bg-muted/50 border border-border focus:border-primary outline-none"
              />
            </div>
            <div class="space-y-2">
              <label for="newFrequency" class="text-sm text-muted-foreground">Scrape Frequency</label>
              <select
                id="newFrequency"
                bind:value={newFrequency}
                class="w-full p-2 rounded-lg bg-muted/50 border border-border focus:border-primary outline-none"
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
          <div class="flex justify-end gap-2">
            <Button variant="outline" onclick={() => showAddForm = false}>Cancel</Button>
            <Button onclick={addSource} disabled={!newUrl || addingSource} class="bg-primary hover:bg-primary/90">
              {#if addingSource}
                <Loader2 class="w-4 h-4 mr-2 animate-spin" />
                Adding...
              {:else}
                <Plus class="w-4 h-4 mr-2" />
                Add Source
              {/if}
            </Button>
          </div>
        </div>
      {/if}

      <!-- Sources Table -->
      {#if loading}
        <div class="flex items-center justify-center py-8">
          <Loader2 class="w-6 h-6 animate-spin text-primary" />
        </div>
      {:else if sources.length === 0}
        <div class="text-center py-8 text-muted-foreground">
          No sources configured. Add your first grant source to start discovering grants.
        </div>
      {:else}
        <div class="space-y-3">
          {#each sources as source}
            <div class="flex items-center justify-between p-4 rounded-lg bg-muted/20 border border-border hover:border-primary/30 transition-colors">
              <div class="flex items-center gap-4 flex-1">
                <button
                  onclick={() => toggleStatus(source)}
                  disabled={saving === source.id}
                  class="w-10 h-10 rounded-lg flex items-center justify-center transition-colors {source.status === 'active' ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground'}"
                  title={source.status === 'active' ? 'Click to disable' : 'Click to enable'}
                >
                  {#if saving === source.id}
                    <Loader2 class="w-5 h-5 animate-spin" />
                  {:else if source.status === 'active'}
                    <CheckCircle2 class="w-5 h-5" />
                  {:else}
                    <XCircle class="w-5 h-5" />
                  {/if}
                </button>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-foreground truncate">{source.name || 'Unknown'}</p>
                  <p class="text-sm text-muted-foreground truncate">{source.url}</p>
                </div>
              </div>
              <div class="flex items-center gap-4">
                <div class="flex items-center gap-2">
                  <Clock class="w-4 h-4 text-muted-foreground" />
                  <select
                    value={source.scrape_frequency || 'daily'}
                    onchange={(e) => updateFrequency(source, e.currentTarget.value)}
                    disabled={saving === source.id}
                    class="p-1 rounded bg-muted/50 border border-border text-sm focus:border-primary outline-none"
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <Badge class={source.status === 'active' ? 'bg-accent/20 text-accent border-accent/30' : 'bg-muted text-muted-foreground'}>
                  {source.status}
                </Badge>
                <div class="text-sm text-muted-foreground w-24 text-right">
                  {source.last_crawled_at ? new Date(source.last_crawled_at).toLocaleDateString() : 'Never'}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onclick={() => deleteSource(source.id)}
                  disabled={saving === source.id}
                  class="text-destructive hover:bg-destructive/10"
                >
                  <Trash2 class="w-4 h-4" />
                </Button>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </CardContent>
  </Card>
</div>
