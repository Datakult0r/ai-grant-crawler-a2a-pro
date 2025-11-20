<script lang="ts">
  import { FileText, Download, RefreshCw, TrendingUp, Lightbulb } from 'lucide-svelte';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import { Progress } from '$lib/components/ui/progress';
  import * as Accordion from '$lib/components/ui/accordion';

  const sections = [
    {
      id: 'executive',
      title: 'Executive Summary',
      content: 'Our GenAI-powered healthcare diagnostics platform leverages cutting-edge computer vision and large language models to revolutionize early disease detection. With a proven 98% accuracy rate in tumor detection and scalable architecture, we address the critical need for accessible, accurate, and affordable diagnostic solutions in underserved communities.',
      wordCount: 156
    },
    {
      id: 'technical',
      title: 'Technical Approach',
      content: 'The platform utilizes a multi-modal transformer architecture combining vision transformers (ViT) for medical image analysis with GPT-4-based natural language processing for report generation. Our proprietary training methodology incorporates federated learning across 15+ hospital partners, ensuring data privacy while maintaining model performance. The system achieves real-time inference (<2s per scan) through optimized deployment on edge devices.',
      wordCount: 289
    },
    {
      id: 'budget',
      title: 'Budget Breakdown',
      content: 'Total Budget: €2,450,000 over 24 months\n\n• Personnel (€1,200,000): 8 AI researchers, 4 medical experts, 2 project managers\n• Infrastructure (€650,000): Cloud computing, GPU clusters, development tools\n• Data Acquisition (€300,000): Medical imaging datasets, annotation services\n• Clinical Trials (€200,000): Pilot studies across 5 healthcare facilities\n• Dissemination (€100,000): Publications, conferences, marketing',
      wordCount: 245
    },
    {
      id: 'team',
      title: 'Team Qualifications',
      content: 'Our interdisciplinary team combines 80+ years of collective experience in AI research, medical diagnostics, and healthcare innovation. Led by Dr. Ana Silva (PhD in Computer Vision, 15+ publications in top-tier conferences) and Dr. João Santos (MD with 20 years in radiology), the team has successfully delivered 3 previous EU-funded projects with measurable impact on patient outcomes.',
      wordCount: 198
    }
  ];

  const successProbability = 87;
  const confidenceLevel = 'High';

  const inspirationCases = [
    {
      title: 'AI Medical Imaging - Horizon 2020',
      year: '2023',
      funding: '€3.2M',
      success: 'Funded'
    },
    {
      title: 'Healthcare Innovation - COMPETE',
      year: '2022',
      funding: '€1.8M',
      success: 'Funded'
    },
    {
      title: 'Diagnostic AI Platform - EIC',
      year: '2024',
      funding: '€2.5M',
      success: 'Funded'
    }
  ];
</script>

<div class="p-8">
  <div class="max-w-7xl mx-auto space-y-6">
    <!-- Header -->
    <div class="space-y-2">
      <h1 class="text-4xl font-bold text-balance bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
        AI Grant Writer
      </h1>
      <p class="text-muted-foreground text-lg">
        Auto-generate compelling grant applications with AI assistance
      </p>
    </div>

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
                <div class="text-5xl font-bold text-accent">{successProbability}%</div>
                <Badge class="mt-2 bg-accent/20 text-accent border-accent/30">{confidenceLevel} Confidence</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={successProbability} class="h-3" />
            <div class="grid grid-cols-3 gap-4 mt-4 text-sm">
              <div>
                <p class="text-muted-foreground">Technical Fit</p>
                <p class="text-lg font-semibold text-foreground">92%</p>
              </div>
              <div>
                <p class="text-muted-foreground">Budget Alignment</p>
                <p class="text-lg font-semibold text-foreground">85%</p>
              </div>
              <div>
                <p class="text-muted-foreground">Team Strength</p>
                <p class="text-lg font-semibold text-foreground">90%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Export Options -->
        <Card class="glass-card">
          <CardContent class="p-6">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Download class="w-5 h-5 text-muted-foreground" />
                <span class="text-sm font-medium text-foreground">Export Application</span>
              </div>
              <div class="flex gap-2">
                <Button variant="outline" class="border-primary/30 hover:bg-primary/10">
                  <FileText class="w-4 h-4 mr-2" />
                  PDF
                </Button>
                <Button variant="outline" class="border-secondary/30 hover:bg-secondary/10">
                  <FileText class="w-4 h-4 mr-2" />
                  Word
                </Button>
                <Button variant="outline" class="border-accent/30 hover:bg-accent/10">
                  <FileText class="w-4 h-4 mr-2" />
                  JSON
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Sections -->
        <Accordion.Root class="space-y-4" value="executive">
          {#each sections as section}
            <Accordion.Item value={section.id} class="glass-card border-primary/20">
              <Accordion.Trigger class="px-6 hover:no-underline">
                <div class="flex items-center justify-between flex-1 text-left">
                  <div class="flex items-center gap-3">
                    <FileText class="w-5 h-5 text-primary" />
                    <span class="text-lg font-semibold text-foreground">{section.title}</span>
                  </div>
                  <div class="flex items-center gap-4 mr-4">
                    <span class="text-sm text-muted-foreground">{section.wordCount} words</span>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      class="h-8 px-3 hover:bg-primary/10"
                      onclick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <RefreshCw class="w-3 h-3 mr-1" />
                      Regenerate
                    </Button>
                  </div>
                </div>
              </Accordion.Trigger>
              <Accordion.Content class="px-6 pb-6">
                <div class="mt-4 p-4 bg-muted/30 rounded-lg border border-border">
                  <p class="text-foreground leading-relaxed whitespace-pre-line">{section.content}</p>
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
            {#each inspirationCases as case_}
              <div class="p-4 bg-muted/20 rounded-lg border border-border hover:border-secondary/30 transition-colors cursor-pointer">
                <div class="flex items-start justify-between mb-2">
                  <h4 class="font-semibold text-sm text-foreground leading-tight">{case_.title}</h4>
                  <Badge class="bg-accent/20 text-accent border-accent/30 text-xs">{case_.success}</Badge>
                </div>
                <div class="flex items-center justify-between mt-3">
                  <span class="text-xs text-muted-foreground">{case_.year}</span>
                  <span class="text-sm font-semibold text-primary">{case_.funding}</span>
                </div>
              </div>
            {/each}

            <Button class="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 neon-glow-purple mt-4">
              View All Examples
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</div>
