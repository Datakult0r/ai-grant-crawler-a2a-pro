<script lang="ts">
  import { onMount } from 'svelte';
  import { Settings, Cpu, DollarSign, Clock, Zap, Brain, Code, BookOpen, FlaskConical, GraduationCap, Users, Check, RefreshCw, Loader2, ChevronDown, ChevronUp } from 'lucide-svelte';

  const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3000/api';

  let loading = $state(true);
  let saving = $state(false);
  let error = $state<string | null>(null);
  let successMessage = $state<string | null>(null);
  
  let availableModels = $state({});
  let agentRoles = $state({});
  let presets = $state({});
  let currentConfig = $state(null);
  let selectedPreset = $state('low-cost');
  let customModels = $state({});
  let showAdvanced = $state(false);
  let costEstimate = $state(null);

  const roleIcons = {
    phd_student: GraduationCap,
    postdoc: FlaskConical,
    professor: BookOpen,
    ml_engineer: Brain,
    sw_engineer: Code,
    reviewers: Users
  };

  const presetColors = {
    'low-cost': 'bg-green-500',
    'balanced': 'bg-blue-500',
    'premium': 'bg-purple-500'
  };

  async function fetchData() {
    loading = true;
    error = null;
    
    try {
      const [modelsRes, presetsRes, currentRes] = await Promise.all([
        fetch(`${API_URL}/settings/models`),
        fetch(`${API_URL}/settings/presets`),
        fetch(`${API_URL}/settings/current`)
      ]);

      if (!modelsRes.ok || !presetsRes.ok || !currentRes.ok) {
        throw new Error('Failed to fetch settings');
      }

      const modelsData = await modelsRes.json();
      const presetsData = await presetsRes.json();
      const currentData = await currentRes.json();

      availableModels = modelsData.models;
      agentRoles = modelsData.agentRoles;
      presets = presetsData.presets;
      currentConfig = currentData;
      selectedPreset = currentData.preset;
      
      // Initialize custom models from current config
      customModels = { ...currentData.models };
        } catch (err) {
          error = err instanceof Error ? err.message : String(err);
          // Use demo data if API fails
      availableModels = {
        'gemini-3-pro': { name: 'Gemini 3 Pro', provider: 'Google', costPer1kTokens: 0, quality: 'high' },
        'claude-opus-4.5': { name: 'Claude Opus 4.5', provider: 'Anthropic', costPer1kTokens: 0.015, quality: 'premium' },
        'claude-sonnet-4.5': { name: 'Claude Sonnet 4.5', provider: 'Anthropic', costPer1kTokens: 0.009, quality: 'high' },
        'gpt-5-codex': { name: 'GPT-5 Codex', provider: 'OpenAI', costPer1kTokens: 0.005, quality: 'premium' }
      };
      presets = {
        'low-cost': { name: 'Low Cost (FREE)', estimatedCost: 0, estimatedTime: '5-10 min' },
        'balanced': { name: 'Balanced', estimatedCost: 3.50, estimatedTime: '8-12 min' },
        'premium': { name: 'Premium Quality', estimatedCost: 7.00, estimatedTime: '10-15 min' }
      };
    } finally {
      loading = false;
    }
  }

    async function selectPreset(presetKey: string) {
      selectedPreset = presetKey;
      showAdvanced = false;
    
      const preset = presets[presetKey as keyof typeof presets];
      if (preset && 'models' in preset) {
        customModels = { ...(preset as { models: Record<string, string> }).models };
      }
    
      await estimateCost();
    }

    async function updateCustomModel(role: string, modelId: string) {
      customModels[role] = modelId;
      selectedPreset = 'custom';
      await estimateCost();
    }

  async function estimateCost() {
    try {
      const res = await fetch(`${API_URL}/settings/estimate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ models: customModels })
      });
      
      if (res.ok) {
        costEstimate = await res.json();
      }
    } catch (err) {
      console.error('Failed to estimate cost:', err);
    }
  }

  async function saveSettings() {
    saving = true;
    error = null;
    successMessage = null;
    
    try {
      const body = selectedPreset === 'custom' 
        ? { customModels } 
        : { preset: selectedPreset };
      
      const res = await fetch(`${API_URL}/settings/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        throw new Error('Failed to save settings');
      }

      successMessage = 'Settings saved successfully!';
      setTimeout(() => successMessage = null, 3000);
      
        // Refresh current config
        await fetchData();
      } catch (err) {
        error = err instanceof Error ? err.message : String(err);
      } finally {
        saving = false;
      }
    }

    async function resetToDefault() {
      saving = true;
      error = null;
    
      try {
        const res = await fetch(`${API_URL}/settings/reset`, {
          method: 'POST'
        });

        if (!res.ok) {
          throw new Error('Failed to reset settings');
        }

        successMessage = 'Settings reset to low-cost mode';
        setTimeout(() => successMessage = null, 3000);
      
        await fetchData();
      } catch (err) {
        error = err instanceof Error ? err.message : String(err);
      } finally {
        saving = false;
      }
    }

  onMount(() => {
    fetchData();
  });
</script>

<svelte:head>
  <title>AI Model Settings | AI Grant Crawler</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
  <div class="max-w-6xl mx-auto">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-2">
        <div class="p-2 bg-purple-500/20 rounded-lg">
          <Settings class="w-6 h-6 text-purple-400" />
        </div>
        <h1 class="text-3xl font-bold text-white">AI Model Configuration</h1>
      </div>
      <p class="text-slate-400">Configure which AI models power each agent role in the research pipeline</p>
    </div>

    {#if loading}
      <div class="flex items-center justify-center py-20">
        <Loader2 class="w-8 h-8 text-purple-400 animate-spin" />
        <span class="ml-3 text-slate-400">Loading settings...</span>
      </div>
    {:else}
      <!-- Success/Error Messages -->
      {#if successMessage}
        <div class="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center gap-3 animate-fade-in">
          <Check class="w-5 h-5 text-green-400" />
          <span class="text-green-300">{successMessage}</span>
        </div>
      {/if}

      {#if error}
        <div class="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300">
          {error}
        </div>
      {/if}

      <!-- Quality Presets -->
      <div class="mb-8">
        <h2 class="text-xl font-semibold text-white mb-4">Quality Presets</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          {#each Object.entries(presets) as [key, preset]}
            <button
              onclick={() => selectPreset(key)}
              class="relative p-6 rounded-xl border-2 transition-all duration-300 text-left group hover:scale-[1.02]
                {selectedPreset === key 
                  ? 'border-purple-500 bg-purple-500/10' 
                  : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'}"
            >
              {#if selectedPreset === key}
                <div class="absolute top-3 right-3">
                  <div class="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                    <Check class="w-4 h-4 text-white" />
                  </div>
                </div>
              {/if}
              
              <div class="flex items-center gap-3 mb-3">
                <div class="w-3 h-3 rounded-full {presetColors[key] || 'bg-slate-500'}"></div>
                <span class="font-semibold text-white">{preset.name}</span>
              </div>
              
              <p class="text-sm text-slate-400 mb-4">{preset.description || 'Configure AI models for research'}</p>
              
              <div class="flex items-center gap-4 text-sm">
                <div class="flex items-center gap-1.5">
                  <DollarSign class="w-4 h-4 text-green-400" />
                  <span class="text-slate-300">
                    {preset.estimatedCost === 0 ? 'FREE' : `$${preset.estimatedCost?.toFixed(2)}`}
                  </span>
                </div>
                <div class="flex items-center gap-1.5">
                  <Clock class="w-4 h-4 text-blue-400" />
                  <span class="text-slate-300">{preset.estimatedTime}</span>
                </div>
              </div>
            </button>
          {/each}
        </div>
      </div>

      <!-- Current Cost Estimate -->
      {#if costEstimate || currentConfig}
        <div class="mb-8 p-6 bg-slate-800/50 rounded-xl border border-slate-700">
          <h3 class="text-lg font-semibold text-white mb-4">Estimated Cost per Research Run</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="p-4 bg-slate-900/50 rounded-lg">
              <div class="text-2xl font-bold text-green-400">
                ${(costEstimate?.totalCost ?? currentConfig?.estimatedCost ?? 0).toFixed(2)}
              </div>
              <div class="text-sm text-slate-400">Total Cost</div>
            </div>
            <div class="p-4 bg-slate-900/50 rounded-lg">
              <div class="text-2xl font-bold text-blue-400">
                {((costEstimate?.totalTokens ?? 450000) / 1000).toFixed(0)}K
              </div>
              <div class="text-sm text-slate-400">Est. Tokens</div>
            </div>
            <div class="p-4 bg-slate-900/50 rounded-lg">
              <div class="text-2xl font-bold text-purple-400">6</div>
              <div class="text-sm text-slate-400">AI Agents</div>
            </div>
            <div class="p-4 bg-slate-900/50 rounded-lg">
              <div class="text-2xl font-bold text-orange-400">7</div>
              <div class="text-sm text-slate-400">Research Phases</div>
            </div>
          </div>
        </div>
      {/if}

      <!-- Advanced Configuration Toggle -->
      <div class="mb-6">
        <button
          onclick={() => showAdvanced = !showAdvanced}
          class="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          {#if showAdvanced}
            <ChevronUp class="w-5 h-5" />
          {:else}
            <ChevronDown class="w-5 h-5" />
          {/if}
          <span>Advanced: Configure Individual Agent Models</span>
        </button>
      </div>

      <!-- Advanced Agent Configuration -->
      {#if showAdvanced}
        <div class="mb-8 animate-fade-in">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {#each Object.entries(agentRoles) as [roleKey, role]}
              {@const IconComponent = roleIcons[roleKey] || Cpu}
              <div class="p-5 bg-slate-800/50 rounded-xl border border-slate-700">
                <div class="flex items-center gap-3 mb-3">
                  <div class="p-2 bg-slate-700 rounded-lg">
                    <IconComponent class="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h4 class="font-semibold text-white">{role.name}</h4>
                    <p class="text-xs text-slate-400">{role.description}</p>
                  </div>
                </div>
                
                <select
                  value={customModels[roleKey] || role.defaultModel}
                  onchange={(e) => updateCustomModel(roleKey, e.target.value)}
                  class="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                >
                  {#each Object.entries(availableModels) as [modelId, model]}
                    <option value={modelId}>
                      {model.name} ({model.provider}) - {model.costPer1kTokens === 0 ? 'FREE' : `$${model.costPer1kTokens}/1K`}
                    </option>
                  {/each}
                </select>
                
                {#if customModels[roleKey]}
                  {@const selectedModel = availableModels[customModels[roleKey]]}
                  {#if selectedModel}
                    <div class="mt-2 text-xs text-slate-400">
                      Est. cost: ${((selectedModel.costPer1kTokens * (role.estimatedTokens || 50000)) / 1000).toFixed(2)}
                    </div>
                  {/if}
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Cost Breakdown (when advanced is open) -->
      {#if showAdvanced && costEstimate?.breakdown}
        <div class="mb-8 p-6 bg-slate-800/50 rounded-xl border border-slate-700">
          <h3 class="text-lg font-semibold text-white mb-4">Cost Breakdown</h3>
          <div class="space-y-3">
            {#each costEstimate.breakdown as item}
              {@const IconComponent = roleIcons[item.role] || Cpu}
              <div class="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                <div class="flex items-center gap-3">
                  <IconComponent class="w-4 h-4 text-slate-400" />
                  <span class="text-slate-300">{item.roleName}</span>
                  <span class="text-xs text-slate-500">({item.modelName})</span>
                </div>
                <div class="flex items-center gap-4">
                  <span class="text-xs text-slate-500">{(item.tokens / 1000).toFixed(0)}K tokens</span>
                  <span class="font-mono text-green-400">
                    {item.cost === 0 ? 'FREE' : `$${item.cost.toFixed(2)}`}
                  </span>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Action Buttons -->
      <div class="flex flex-wrap gap-4">
        <button
          onclick={saveSettings}
          disabled={saving}
          class="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 hover:scale-[1.02]"
        >
          {#if saving}
            <Loader2 class="w-5 h-5 animate-spin" />
            <span>Saving...</span>
          {:else}
            <Check class="w-5 h-5" />
            <span>Save Configuration</span>
          {/if}
        </button>
        
        <button
          onclick={resetToDefault}
          disabled={saving}
          class="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200"
        >
          <RefreshCw class="w-5 h-5" />
          <span>Reset to Low-Cost</span>
        </button>
      </div>

      <!-- Info Section -->
      <div class="mt-8 p-6 bg-slate-800/30 rounded-xl border border-slate-700/50">
        <h3 class="text-lg font-semibold text-white mb-3">About AI Model Configuration</h3>
        <div class="space-y-3 text-sm text-slate-400">
          <p>
            The AI Grant Crawler uses a multi-agent research pipeline with 6 specialized AI agents working through 7 research phases. 
            Each agent has different requirements - some need strong reasoning, others need excellent coding or writing abilities.
          </p>
          <p>
            <strong class="text-slate-300">Low-Cost Mode:</strong> Uses only free Gemini models. Great for testing and budget-conscious usage.
          </p>
          <p>
            <strong class="text-slate-300">Balanced Mode:</strong> Mix of free and premium models for good quality at moderate cost.
          </p>
          <p>
            <strong class="text-slate-300">Premium Mode:</strong> Uses the optimal model for each agent role. Best quality, highest cost (~$7/run).
          </p>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .animate-fade-in {
    animation: fade-in 0.3s ease-out;
  }
</style>
