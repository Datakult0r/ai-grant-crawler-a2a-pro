<script lang="ts">
  import { FileText, Download, RefreshCw, CheckCircle2, Loader2, FileDown, ChevronDown } from 'lucide-svelte';
  import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import { onMount } from 'svelte';
  import { fetchDocuments, downloadDocument, exportDocumentPdf, exportDocumentDocx } from '$lib/api';

  let documentTypes = $state([
    {
      id: 'cv',
      title: 'Team CVs',
      description: 'Generate formatted CVs for all team members',
      status: 'ready',
      count: 8
    },
    {
      id: 'financials',
      title: 'Financial Statements',
      description: 'Company financial reports and projections',
      status: 'ready',
      count: 3
    },
    {
      id: 'technical',
      title: 'Technical Specifications',
      description: 'Detailed technical documentation and architecture',
      status: 'ready',
      count: 5
    },
    {
      id: 'letters',
      title: 'Support Letters',
      description: 'Letters of support from partners and stakeholders',
      status: 'generating',
      count: 2
    }
  ]);

  let generatedDocs = $state([
    { id: 0, name: 'Team_CV_Ana_Silva.pdf', size: '245 KB', date: '2024-11-20' },
    { id: 0, name: 'Financial_Projection_2025.xlsx', size: '892 KB', date: '2024-11-20' },
    { id: 0, name: 'Technical_Architecture.pdf', size: '1.2 MB', date: '2024-11-19' },
    { id: 0, name: 'Budget_Breakdown.xlsx', size: '156 KB', date: '2024-11-19' },
    { id: 0, name: 'Team_CV_Joao_Santos.pdf', size: '238 KB', date: '2024-11-18' }
  ]);

  let loading = $state(true);

  onMount(async () => {
    try {
      const data = await fetchDocuments();
      if (data.documentTypes) {
        documentTypes = data.documentTypes;
      }
      if (data.recentDocuments && data.recentDocuments.length > 0) {
        generatedDocs = data.recentDocuments;
      }
    } catch (e) {
      console.error('Failed to fetch documents:', e);
      // Keep demo data on error
    } finally {
      loading = false;
    }
  });

  let exporting = $state<number | null>(null);
  let showExportMenu = $state<number | null>(null);

  async function handleDownload(docId: number, docName: string) {
    try {
      const blob = await downloadDocument(docId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = docName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to download document:', e);
    }
  }

  async function handleExportPdf(docId: number, docName: string) {
    exporting = docId;
    showExportMenu = null;
    try {
      const blob = await exportDocumentPdf(docId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = docName.replace(/\.\w+$/, '.pdf');
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to export PDF:', e);
    } finally {
      exporting = null;
    }
  }

  async function handleExportDocx(docId: number, docName: string) {
    exporting = docId;
    showExportMenu = null;
    try {
      const blob = await exportDocumentDocx(docId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = docName.replace(/\.\w+$/, '.docx');
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to export Word document:', e);
    } finally {
      exporting = null;
    }
  }

  function toggleExportMenu(docId: number) {
    showExportMenu = showExportMenu === docId ? null : docId;
  }
</script>

<div class="p-8 space-y-6">
  <!-- Header -->
  <div class="space-y-2">
    <h1 class="text-4xl font-bold text-balance bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
      Auto-Document Generator
    </h1>
    <p class="text-muted-foreground text-lg">
      AI-generated CVs, financials, and technical specifications
    </p>
  </div>

  <!-- Document Types -->
  <div class="grid grid-cols-2 gap-6">
    {#each documentTypes as docType}
      <Card class="glass-card hover:border-primary/50 transition-all duration-300">
        <CardHeader>
          <div class="flex items-start justify-between">
            <div class="space-y-2">
              <CardTitle class="flex items-center gap-2">
                <FileText class="w-5 h-5 text-primary" />
                {docType.title}
              </CardTitle>
              <CardDescription>{docType.description}</CardDescription>
            </div>
            {#if docType.status === 'ready'}
              <Badge class="bg-accent/20 text-accent border-accent/30">
                <CheckCircle2 class="w-3 h-3 mr-1" />
                Ready
              </Badge>
            {:else}
              <Badge class="bg-yellow-500/20 text-yellow-500 border-yellow-500/30 animate-pulse">
                Generating...
              </Badge>
            {/if}
          </div>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="flex items-center justify-between text-sm">
            <span class="text-muted-foreground">Documents available</span>
            <span class="font-semibold text-foreground">{docType.count} files</span>
          </div>
          <div class="flex gap-2">
            <Button class="flex-1 bg-primary hover:bg-primary/90">
              <Download class="w-4 h-4 mr-2" />
              Download All
            </Button>
            <Button variant="outline" class="border-primary/30 hover:bg-primary/10">
              <RefreshCw class="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    {/each}
  </div>

  <!-- Recent Documents -->
  <Card class="glass-card">
    <CardHeader>
      <CardTitle>Recently Generated Documents</CardTitle>
      <CardDescription>Your latest AI-generated files</CardDescription>
    </CardHeader>
    <CardContent>
      <div class="space-y-3">
        {#each generatedDocs as doc}
          <div class="flex items-center justify-between p-4 bg-muted/20 rounded-lg border border-border hover:border-primary/30 transition-colors">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <FileText class="w-5 h-5 text-primary" />
              </div>
              <div>
                <p class="font-medium text-foreground">{doc.name}</p>
                <div class="flex gap-4 text-xs text-muted-foreground mt-1">
                  <span>{doc.size}</span>
                  <span>{doc.date}</span>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              {#if exporting === doc.id}
                <div class="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 class="w-4 h-4 animate-spin" />
                  Exporting...
                </div>
              {:else}
                <Button size="sm" variant="ghost" class="hover:bg-primary/10" onclick={() => handleDownload(doc.id, doc.name)}>
                  <Download class="w-4 h-4" />
                </Button>
                <div class="relative">
                  <Button size="sm" variant="outline" class="border-primary/30 hover:bg-primary/10" onclick={() => toggleExportMenu(doc.id)}>
                    <FileDown class="w-4 h-4 mr-1" />
                    Export
                    <ChevronDown class="w-3 h-3 ml-1" />
                  </Button>
                  {#if showExportMenu === doc.id}
                    <div class="absolute right-0 top-full mt-1 bg-background border border-border rounded-lg shadow-lg z-10 min-w-[140px]">
                      <button 
                        class="w-full px-4 py-2 text-left text-sm hover:bg-muted/50 rounded-t-lg flex items-center gap-2"
                        onclick={() => handleExportPdf(doc.id, doc.name)}
                      >
                        <FileText class="w-4 h-4 text-red-500" />
                        Export as PDF
                      </button>
                      <button 
                        class="w-full px-4 py-2 text-left text-sm hover:bg-muted/50 rounded-b-lg flex items-center gap-2"
                        onclick={() => handleExportDocx(doc.id, doc.name)}
                      >
                        <FileText class="w-4 h-4 text-blue-500" />
                        Export as Word
                      </button>
                    </div>
                  {/if}
                </div>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </CardContent>
  </Card>
</div>
