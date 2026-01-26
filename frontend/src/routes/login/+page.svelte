<script lang="ts">
  import { goto } from '$app/navigation';
  import { auth } from '$lib/stores/auth';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
  import { Loader2, Mail, Lock, LogIn } from 'lucide-svelte';

  let email = $state('');
  let password = $state('');
  let loading = $state(false);
  let error = $state('');

  async function handleSubmit(e: Event) {
    e.preventDefault();
    loading = true;
    error = '';

    const result = await auth.signIn(email, password);
    
    if (result.success) {
      goto('/');
    } else {
      error = result.error || 'Failed to sign in';
      loading = false;
    }
  }
</script>

<div class="min-h-screen flex items-center justify-center bg-background p-4">
  <Card class="w-full max-w-md glass-card">
    <CardHeader class="text-center">
      <div class="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-primary to-secondary neon-glow-purple flex items-center justify-center">
        <span class="text-3xl font-bold text-primary-foreground">G</span>
      </div>
      <CardTitle class="text-2xl">Welcome Back</CardTitle>
      <CardDescription>Sign in to your AI Grant Crawler account</CardDescription>
    </CardHeader>
    <CardContent>
      <form onsubmit={handleSubmit} class="space-y-4">
        {#if error}
          <div class="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
            {error}
          </div>
        {/if}

        <div class="space-y-2">
          <label for="email" class="text-sm font-medium text-foreground">Email</label>
          <div class="relative">
            <Mail class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              id="email"
              type="email"
              bind:value={email}
              placeholder="you@example.com"
              required
              class="w-full pl-10 pr-4 py-2 rounded-lg bg-muted/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
            />
          </div>
        </div>

        <div class="space-y-2">
          <label for="password" class="text-sm font-medium text-foreground">Password</label>
          <div class="relative">
            <Lock class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              id="password"
              type="password"
              bind:value={password}
              placeholder="Enter your password"
              required
              class="w-full pl-10 pr-4 py-2 rounded-lg bg-muted/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
            />
          </div>
        </div>

        <Button type="submit" class="w-full bg-primary hover:bg-primary/90" disabled={loading}>
          {#if loading}
            <Loader2 class="w-4 h-4 mr-2 animate-spin" />
            Signing in...
          {:else}
            <LogIn class="w-4 h-4 mr-2" />
            Sign In
          {/if}
        </Button>

        <p class="text-center text-sm text-muted-foreground">
          Don't have an account?
          <a href="/signup" class="text-primary hover:underline">Sign up</a>
        </p>
      </form>
    </CardContent>
  </Card>
</div>
