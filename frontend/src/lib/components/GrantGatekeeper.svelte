<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { Zap, Brain, X } from "lucide-svelte";
  import { Button } from "$lib/components/ui/button";
  import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
  } from "$lib/components/ui/card";
  import { Badge } from "$lib/components/ui/badge";

  export let open = false;
  export let grant: any = null;

  const dispatch = createEventDispatcher();

  function close() {
    dispatch("close");
  }

  function selectMode(mode: "fast" | "research") {
    dispatch("select", { mode, grant });
    close();
  }
</script>

{#if open && grant}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in-0"
  >
    <div
      class="relative w-full max-w-3xl p-4 animate-in zoom-in-95 duration-300"
    >
      <Card class="glass-card border-primary/20 shadow-2xl">
        <button
          class="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          on:click={close}
        >
          <X class="h-4 w-4" />
          <span class="sr-only">Close</span>
        </button>

        <CardHeader class="text-center pb-2">
          <CardTitle
            class="text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent"
          >
            Select Proposal Strategy
          </CardTitle>
          <CardDescription class="text-lg">
            Choose how you want to generate the proposal for <span
              class="font-semibold text-foreground">{grant.name}</span
            >
          </CardDescription>
        </CardHeader>

        <CardContent class="grid gap-6 md:grid-cols-2 p-8">
          <!-- Fast Track -->
          <button
            class="group relative flex flex-col items-start gap-4 rounded-xl border border-muted p-6 text-left transition-all hover:bg-accent/5 hover:border-primary/50 hover:shadow-lg hover:scale-[1.02]"
            on:click={() => selectMode("fast")}
          >
            <div
              class="absolute -top-3 -right-3 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Badge class="bg-primary text-primary-foreground"
                >Recommended for Speed</Badge
              >
            </div>
            <div
              class="rounded-full bg-primary/10 p-3 ring-1 ring-primary/20 group-hover:bg-primary/20 group-hover:ring-primary/40 transition-all"
            >
              <Zap class="h-8 w-8 text-primary" />
            </div>
            <div class="space-y-2">
              <h3 class="font-bold text-xl">Fast Track</h3>
              <p class="text-sm text-muted-foreground leading-relaxed">
                Instant proposal generation using Gemini 2.5 Pro. Best for quick
                drafts, initial screening, and simple grants.
              </p>
            </div>
            <div class="mt-auto pt-4 w-full">
              <div
                class="flex items-center justify-between text-xs text-muted-foreground mb-2"
              >
                <span>Time</span>
                <span class="font-medium text-foreground">~30 seconds</span>
              </div>
              <div
                class="flex items-center justify-between text-xs text-muted-foreground"
              >
                <span>Cost</span>
                <span class="font-medium text-foreground">Low</span>
              </div>
            </div>
          </button>

          <!-- Research Track -->
          <button
            class="group relative flex flex-col items-start gap-4 rounded-xl border border-muted p-6 text-left transition-all hover:bg-accent/5 hover:border-secondary/50 hover:shadow-lg hover:scale-[1.02]"
            on:click={() => selectMode("research")}
          >
            <div
              class="absolute -top-3 -right-3 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Badge class="bg-secondary text-secondary-foreground"
                >Deep Analysis</Badge
              >
            </div>
            <div
              class="rounded-full bg-secondary/10 p-3 ring-1 ring-secondary/20 group-hover:bg-secondary/20 group-hover:ring-secondary/40 transition-all"
            >
              <Brain class="h-8 w-8 text-secondary" />
            </div>
            <div class="space-y-2">
              <h3 class="font-bold text-xl">Research Track</h3>
              <p class="text-sm text-muted-foreground leading-relaxed">
                Autonomous AI research team performs literature review,
                innovation analysis, and deep drafting. Best for complex,
                high-value grants.
              </p>
            </div>
            <div class="mt-auto pt-4 w-full">
              <div
                class="flex items-center justify-between text-xs text-muted-foreground mb-2"
              >
                <span>Time</span>
                <span class="font-medium text-foreground">~5-10 minutes</span>
              </div>
              <div
                class="flex items-center justify-between text-xs text-muted-foreground"
              >
                <span>Cost</span>
                <span class="font-medium text-foreground">High</span>
              </div>
            </div>
          </button>
        </CardContent>
      </Card>
    </div>
  </div>
{/if}
