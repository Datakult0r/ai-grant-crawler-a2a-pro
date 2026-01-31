<script lang="ts">
  import AdminGrantSources from "$lib/components/AdminGrantSources.svelte";
  import { Settings } from 'lucide-svelte';
</script>

<div class="space-y-6">
  <div class="flex items-center gap-3">
    <div class="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
      <Settings class="w-5 h-5 text-primary" />
    </div>
    <div>
      <h1 class="text-2xl font-bold text-foreground">Grant Source Management</h1>
      <p class="text-muted-foreground">Configure and manage grant discovery sources</p>
    </div>
  </div>
  
  <AdminGrantSources />
</div>
