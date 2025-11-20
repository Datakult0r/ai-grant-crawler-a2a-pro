<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';
  import { 
    LayoutDashboard, 
    GitMerge, 
    FileText, 
    KanbanSquare, 
    Bell, 
    TrendingUp, 
    FileStack, 
    Users,
    Brain
  } from 'lucide-svelte';

  let { children } = $props();

  const navItems = [
    { icon: LayoutDashboard, label: 'Discovery', href: '/' },
    { icon: GitMerge, label: 'Matcher', href: '/matcher' },
    { icon: FileText, label: 'Writer', href: '/writer' },
    { icon: Brain, label: 'Thinktank', href: '/thinktank' },
    { icon: KanbanSquare, label: 'Tracker', href: '/tracker' },
    { icon: Bell, label: 'Alerts', href: '/alerts' },
    { icon: TrendingUp, label: 'Predictor', href: '/predictor' },
    { icon: FileStack, label: 'Documents', href: '/documents' },
    { icon: Users, label: 'Team', href: '/team' }
  ];

  let currentPath = $derived($page.url.pathname);
</script>

<div class="flex h-screen bg-background overflow-hidden">
  <!-- Sidebar -->
  <aside class="w-20 glass-card border-r border-border flex flex-col items-center py-6 gap-6">
    <!-- Logo -->
    <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary neon-glow-purple flex items-center justify-center">
      <span class="text-2xl font-bold text-primary-foreground">G</span>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 flex flex-col gap-3">
      {#each navItems as item}
        <a 
          href={item.href}
          class="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200
                 {currentPath === item.href 
                   ? 'bg-primary text-primary-foreground neon-glow-purple' 
                   : 'text-muted-foreground hover:text-foreground hover:bg-muted'}"
          title={item.label}
        >
          <item.icon class="w-5 h-5" />
        </a>
      {/each}
    </nav>
  </aside>

  <!-- Main Content -->
  <main class="flex-1 overflow-auto">
    {@render children()}
  </main>
</div>
