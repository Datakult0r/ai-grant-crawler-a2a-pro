<script lang="ts">
  import "../app.css";
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import {
    LayoutDashboard,
    GitMerge,
    FileText,
    KanbanSquare,
    Bell,
    TrendingUp,
    FileStack,
    Users,
    Brain,
    LogOut,
    User,
  } from "lucide-svelte";
  import { auth, isAuthenticated, currentUser } from "$lib/stores/auth";
  import { Button } from "$lib/components/ui/button";
  import Toast from "$lib/components/Toast.svelte";

  let { children } = $props();

  const navItems = [
    { icon: LayoutDashboard, label: "Discovery", href: "/" },
    { icon: GitMerge, label: "Matcher", href: "/matcher" },
    { icon: FileText, label: "Writer", href: "/writer" },
    { icon: Brain, label: "Thinktank", href: "/thinktank" },
    { icon: KanbanSquare, label: "Tracker", href: "/tracker" },
    { icon: Bell, label: "Alerts", href: "/alerts" },
    { icon: TrendingUp, label: "Predictor", href: "/predictor" },
    { icon: FileStack, label: "Documents", href: "/documents" },
    { icon: Users, label: "Team", href: "/team" },
  ];

  let currentPath = $derived($page.url.pathname);
  let authLoading = $state(true);

  const publicRoutes = ["/login", "/signup"];
  const isPublicRoute = $derived(publicRoutes.includes(currentPath));

  onMount(async () => {
    await auth.initialize();
    authLoading = false;
  });

  async function handleSignOut() {
    await auth.signOut();
    goto("/login");
  }
</script>

{#if isPublicRoute}
  <!-- Public routes (login/signup) - no sidebar -->
  {@render children()}
{:else}
  <div class="flex h-screen bg-background overflow-hidden">
    <!-- Sidebar -->
    <aside
      class="w-20 glass-card-strong border-r border-border flex flex-col items-center py-6 gap-6"
    >
      <!-- Logo -->
      <div
        class="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary neon-glow-purple flex items-center justify-center interactive"
      >
        <span class="text-2xl font-bold text-primary-foreground">G</span>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 flex flex-col gap-3">
        {#each navItems as item}
          <a
            href={item.href}
            class="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200
                   {currentPath === item.href
              ? 'bg-primary text-primary-foreground neon-glow-purple scale-105'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted hover:scale-105'}"
            title={item.label}
          >
            <item.icon class="w-5 h-5" />
          </a>
        {/each}
      </nav>

      <!-- User Menu -->
      {#if $isAuthenticated}
        <div class="flex flex-col items-center gap-2">
          <div
            class="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 interactive"
            title={$currentUser?.email}
          >
            <User class="w-5 h-5 text-primary" />
          </div>
          <button
            onclick={handleSignOut}
            class="w-10 h-10 rounded-xl flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all interactive"
            title="Sign out"
          >
            <LogOut class="w-4 h-4" />
          </button>
        </div>
      {:else if !authLoading}
        <a
          href="/login"
          class="w-10 h-10 rounded-xl flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all interactive"
          title="Sign in"
        >
          <User class="w-5 h-5" />
        </a>
      {/if}
    </aside>

    <!-- Main Content -->
    <main class="flex-1 overflow-auto">
      {@render children()}
    </main>

    <!-- Toast Notifications -->
    <Toast />
  </div>
{/if}
