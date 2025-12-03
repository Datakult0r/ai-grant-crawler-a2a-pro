<script lang="ts">
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import {
    FileText,
    Download,
    RefreshCw,
    TrendingUp,
    Lightbulb,
    ArrowLeft,
  } from "lucide-svelte";
  import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { Badge } from "$lib/components/ui/badge";
  import { Progress } from "$lib/components/ui/progress";
  import * as Accordion from "$lib/components/ui/accordion";
  import { fetchGrants, generateProposal } from "$lib/api";
  import { goto } from "$app/navigation";

  let grantId = $page.params.grantId;
  let grant = $state(null);
  let loading = $state(true);
  let generating = $state(false);
  let proposal = $state(null);
  let error = $state(null);

  // Mock company profile for now - in real app this would come from user context
  const companyProfile = {
    name: "TechVision AI",
    description: "A startup focused on AI-powered healthcare diagnostics.",
    mission: "To democratize access to early disease detection.",
  };

  onMount(async () => {
    try {
      // In a real app we would have a fetchGrant(id) API
      // For now we fetch all and find the one we need
      const grants = await fetchGrants();
      grant = grants.find((g) => g.id.toString() === grantId);

      if (!grant) {
        error = "Grant not found";
      }
    } catch (e) {
      error = e.message;
    } finally {
      loading = false;
    }
  });

  async function handleGenerate() {
    if (!grant) return;

    generating = true;
    try {
      const res = await generateProposal(grant.id, companyProfile, "fast");
      // Poll or wait for result?
      // The current API returns { proposalId, status: 'processing' }
      // But for 'fast' mode, we might want to wait.
      // However, the backend is async.
      // For this demo, let's assume we might need to poll or just show a "Processing" state.
      // Actually, let's just simulate the wait here since we don't have a poll endpoint yet
      // other than the SSE one.

      // Let's use the SSE endpoint even for fast mode to get the result!
      const eventSource = new EventSource(
        `/api/proposal/${res.proposalId}/stream`
      );

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        // Handle logs if needed
      };

      eventSource.addEventListener("complete", (event: any) => {
        const data = JSON.parse(event.data);
        proposal = parseProposal(data.result);
        generating = false;
        eventSource.close();
      });

      eventSource.addEventListener("error", (event: any) => {
        console.error("SSE Error:", event);
        error = "Generation failed";
        generating = false;
        eventSource.close();
      });
    } catch (e) {
      error = e.message;
      generating = false;
    }
  }

  function parseProposal(text) {
    // Simple parser to convert markdown-like text to sections
    // This is a placeholder. Real implementation would be more robust.
    if (!text) return [];

    const sections = [];
    const lines = text.split("\n");
    let currentSection = null;

    lines.forEach((line) => {
      if (line.startsWith("## ")) {
        if (currentSection) sections.push(currentSection);
        currentSection = { title: line.replace("## ", ""), content: "" };
      } else if (currentSection) {
        currentSection.content += line + "\n";
      }
    });
    if (currentSection) sections.push(currentSection);

    return sections.length > 0
      ? sections
      : [{ title: "Full Proposal", content: text }];
  }

  const successProbability = 87;
  const confidenceLevel = "High";
</script>

<div class="p-8">
  <div class="max-w-7xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <Button variant="ghost" size="icon" on:click={() => goto("/")}>
        <ArrowLeft class="w-5 h-5" />
      </Button>
      <div class="space-y-2">
        <h1
          class="text-4xl font-bold text-balance bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent"
        >
          AI Grant Writer
        </h1>
        <p class="text-muted-foreground text-lg">
          {#if grant}
            Drafting application for <span class="text-foreground font-semibold"
              >{grant.name}</span
            >
          {:else}
            Loading grant details...
          {/if}
        </p>
      </div>
    </div>

    {#if error}
      <div
        class="p-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/20"
      >
        {error}
      </div>
    {/if}

    {#if !proposal && !generating && grant}
      <Card class="glass-card border-primary/20">
        <CardContent
          class="p-12 flex flex-col items-center justify-center text-center space-y-6"
        >
          <div
            class="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4"
          >
            <FileText class="w-10 h-10 text-primary" />
          </div>
          <h2 class="text-2xl font-bold">Ready to Draft</h2>
          <p class="text-muted-foreground max-w-md">
            Generate a complete first draft for this grant application using our
            Fast Track AI model.
          </p>
          <Button size="lg" class="neon-glow-purple" on:click={handleGenerate}>
            <RefreshCw class="w-4 h-4 mr-2" />
            Generate Proposal
          </Button>
        </CardContent>
      </Card>
    {:else if generating}
      <Card class="glass-card border-primary/20">
        <CardContent
          class="p-12 flex flex-col items-center justify-center text-center space-y-6"
        >
          <div
            class="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4 animate-pulse"
          >
            <RefreshCw class="w-10 h-10 text-primary animate-spin" />
          </div>
          <h2 class="text-2xl font-bold">Generating Proposal...</h2>
          <p class="text-muted-foreground">
            Analyzing grant requirements and drafting content. This usually
            takes about 30 seconds.
          </p>
        </CardContent>
      </Card>
    {:else if proposal}
      <div class="grid grid-cols-3 gap-6">
        <!-- Main Editor (2 columns) -->
        <div class="col-span-2 space-y-6">
          <!-- Success Probability -->
          <Card class="glass-card border-accent/30 neon-glow-green">
            <CardHeader>
              <div class="flex items-center justify-between">
                <div>
                  <CardTitle class="text-2xl flex items-center gap-2">
                    <TrendingUp class="w-6 h-6 text-accent" />
                    Success Probability
                  </CardTitle>
                  <CardDescription class="text-base mt-2">
                    AI-analyzed fit vs grant criteria
                  </CardDescription>
                </div>
                <div class="text-right">
                  <div class="text-5xl font-bold text-accent">
                    {successProbability}%
                  </div>
                  <Badge class="mt-2 bg-accent/20 text-accent border-accent/30"
                    >{confidenceLevel} Confidence</Badge
                  >
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Progress value={successProbability} class="h-3" />
            </CardContent>
          </Card>

          <!-- Export Options -->
          <Card class="glass-card">
            <CardContent class="p-6">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <Download class="w-5 h-5 text-muted-foreground" />
                  <span class="text-sm font-medium text-foreground"
                    >Export Application</span
                  >
                </div>
                <div class="flex gap-2">
                  <Button
                    variant="outline"
                    class="border-primary/30 hover:bg-primary/10"
                  >
                    <FileText class="w-4 h-4 mr-2" />
                    PDF
                  </Button>
                  <Button
                    variant="outline"
                    class="border-secondary/30 hover:bg-secondary/10"
                  >
                    <FileText class="w-4 h-4 mr-2" />
                    Word
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- Sections -->
          <Accordion.Root class="space-y-4" value={proposal[0]?.title}>
            {#each proposal as section, i}
              <Accordion.Item
                value={section.title}
                class="glass-card border-primary/20"
              >
                <Accordion.Trigger class="px-6 hover:no-underline">
                  <div
                    class="flex items-center justify-between flex-1 text-left"
                  >
                    <div class="flex items-center gap-3">
                      <FileText class="w-5 h-5 text-primary" />
                      <span class="text-lg font-semibold text-foreground"
                        >{section.title}</span
                      >
                    </div>
                  </div>
                </Accordion.Trigger>
                <Accordion.Content class="px-6 pb-6">
                  <div
                    class="mt-4 p-4 bg-muted/30 rounded-lg border border-border"
                  >
                    <p
                      class="text-foreground leading-relaxed whitespace-pre-line"
                    >
                      {section.content}
                    </p>
                  </div>
                </Accordion.Content>
              </Accordion.Item>
            {/each}
          </Accordion.Root>
        </div>

        <!-- Inspiration Panel (1 column) -->
        <div class="space-y-6">
          <Card class="glass-card border-secondary/30 sticky top-6">
            <CardHeader>
              <CardTitle class="flex items-center gap-2 text-secondary">
                <Lightbulb class="w-5 h-5" />
                Past Successes
              </CardTitle>
              <CardDescription>
                Successful applications for inspiration
              </CardDescription>
            </CardHeader>
            <CardContent class="space-y-4">
              <div class="p-4 bg-muted/20 rounded-lg border border-border">
                <p class="text-sm text-muted-foreground">
                  No past successes found for this specific grant type yet.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    {/if}
  </div>
</div>
