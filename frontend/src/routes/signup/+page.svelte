<script lang="ts">
  import { goto } from '$app/navigation';
  import { auth } from '$lib/stores/auth';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
  import { Loader2, Mail, Lock, User, UserPlus } from 'lucide-svelte';

  let email = $state('');
  let password = $state('');
  let fullName = $state('');
  let loading = $state(false);
  let error = $state('');
  let success = $state(false);

  async function handleSubmit(e: Event) {
    e.preventDefault();
    loading = true;
    error = '';

    const result = await auth.signUp(email, password, fullName);
    
    if (result.success) {
      success = true;
    } else {
      error = result.error || 'Failed to sign up';
    }
    loading = false;
  }
</script>

<div class="min-h-screen flex items-center justify-center bg-background p-4">
  <Card class="w-full max-w-md glass-card">
    <CardHeader class="text-center">
      <div class="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-primary to-secondary neon-glow-purple flex items-center justify-center">
        <span class="text-3xl font-bold text-primary-foreground">G</span>
      </div>
      <CardTitle class="text-2xl">Create Account</CardTitle>
      <CardDescription>Get started with AI Grant Crawler</CardDescription>
    </CardHeader>
    <CardContent>
      {#if success}
        <div class="text-center space-y-4">
          <div class="w-16 h-16 mx-auto rounded-full bg-accent/20 flex items-center justify-center">
            <Mail class="w-8 h-8 text-accent" />
          </div>
          <h3 class="text-lg font-semibold">Check your email</h3>
          <p class="text-muted-foreground">
            We've sent a confirmation link to <strong>{email}</strong>. 
            Please check your inbox and click the link to activate your account.
          </p>
          <Button onclick={() => goto('/login')} variant="outline" class="mt-4">
            Back to Sign In
          </Button>
        </div>
      {:else}
        <form onsubmit={handleSubmit} class="space-y-4">
          {#if error}
            <div class="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
              {error}
            </div>
          {/if}

          <div class="space-y-2">
            <label for="fullName" class="text-sm font-medium text-foreground">Full Name</label>
            <div class="relative">
              <User class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                id="fullName"
                type="text"
                bind:value={fullName}
                placeholder="John Doe"
                class="w-full pl-10 pr-4 py-2 rounded-lg bg-muted/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
              />
            </div>
          </div>

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
                placeholder="Create a password (min 6 characters)"
                required
                minlength="6"
                class="w-full pl-10 pr-4 py-2 rounded-lg bg-muted/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
              />
            </div>
          </div>

          <Button type="submit" class="w-full bg-primary hover:bg-primary/90" disabled={loading}>
            {#if loading}
              <Loader2 class="w-4 h-4 mr-2 animate-spin" />
              Creating account...
            {:else}
              <UserPlus class="w-4 h-4 mr-2" />
              Sign Up
            {/if}
          </Button>

          <p class="text-center text-sm text-muted-foreground">
            Already have an account?
            <a href="/login" class="text-primary hover:underline">Sign in</a>
          </p>
        </form>
      {/if}
    </CardContent>
  </Card>
</div>
