<script lang="ts">
  import { onMount } from "svelte";
  import { askJules, checkJulesHealth } from "$lib/api";

  let message = "";
  let chatHistory: { role: "user" | "jules"; content: string }[] = [];
  let healthStatus: any = null;
  let loading = false;

  async function sendMessage() {
    if (!message.trim()) return;

    chatHistory = [...chatHistory, { role: "user", content: message }];
    const currentMessage = message;
    message = "";
    loading = true;

    try {
      const res = await askJules(currentMessage);
      chatHistory = [...chatHistory, { role: "jules", content: res.response }];
    } catch (error) {
      chatHistory = [
        ...chatHistory,
        { role: "jules", content: "Error: Could not reach Jules." },
      ];
    } finally {
      loading = false;
    }
  }

  async function runHealthCheck() {
    try {
      healthStatus = await checkJulesHealth();
    } catch (error) {
      healthStatus = { error: "Failed to check health" };
    }
  }

  onMount(() => {
    runHealthCheck();
  });
</script>

<div class="bg-gray-900 text-white p-6 rounded-lg shadow-xl max-w-4xl mx-auto">
  <div class="flex justify-between items-center mb-6">
    <h2 class="text-2xl font-bold text-blue-400">
      Jules - Integration Engineer
    </h2>
    <div class="flex items-center gap-2">
      <span class="text-sm text-gray-400">System Status:</span>
      {#if healthStatus}
        <span
          class="px-2 py-1 rounded text-xs {healthStatus.api === 'healthy'
            ? 'bg-green-900 text-green-300'
            : 'bg-red-900 text-red-300'}"
        >
          {healthStatus.api === "healthy" ? "ONLINE" : "ISSUES"}
        </span>
      {:else}
        <span class="text-xs text-gray-500">Checking...</span>
      {/if}
    </div>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <!-- Chat Area -->
    <div
      class="md:col-span-2 bg-gray-800 rounded-lg p-4 h-[500px] flex flex-col"
    >
      <div class="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
        {#if chatHistory.length === 0}
          <div class="text-center text-gray-500 mt-20">
            <p>👋 Hi, I'm Jules.</p>
            <p class="text-sm mt-2">
              I can help you debug integration issues, check API contracts, and
              monitor system health.
            </p>
          </div>
        {/if}
        {#each chatHistory as chat}
          <div
            class="flex {chat.role === 'user'
              ? 'justify-end'
              : 'justify-start'}"
          >
            <div
              class="max-w-[80%] rounded-lg p-3 {chat.role === 'user'
                ? 'bg-blue-600'
                : 'bg-gray-700'}"
            >
              <p class="whitespace-pre-wrap text-sm">{chat.content}</p>
            </div>
          </div>
        {/each}
        {#if loading}
          <div class="flex justify-start">
            <div class="bg-gray-700 rounded-lg p-3 animate-pulse">
              <span class="text-xs text-gray-400">Jules is thinking...</span>
            </div>
          </div>
        {/if}
      </div>

      <div class="flex gap-2">
        <input
          type="text"
          bind:value={message}
          on:keydown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Ask Jules to check something..."
          class="flex-1 bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
        />
        <button
          on:click={sendMessage}
          disabled={loading}
          class="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded font-medium disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>

    <!-- Status Panel -->
    <div class="bg-gray-800 rounded-lg p-4">
      <h3 class="font-semibold mb-4 text-gray-300">System Health</h3>
      {#if healthStatus}
        <div class="space-y-3">
          {#each Object.entries(healthStatus) as [key, value]}
            <div
              class="flex justify-between items-center border-b border-gray-700 pb-2"
            >
              <span class="capitalize text-gray-400">{key}</span>
              <span
                class="text-sm font-mono {value === 'connected' ||
                value === 'healthy' ||
                value === 'idle'
                  ? 'text-green-400'
                  : 'text-yellow-400'}"
              >
                {String(value)}
              </span>
            </div>
          {/each}
        </div>
        <button
          on:click={runHealthCheck}
          class="mt-6 w-full bg-gray-700 hover:bg-gray-600 text-sm py-2 rounded transition-colors"
        >
          Refresh Status
        </button>
      {:else}
        <div class="text-center text-gray-500 py-10">Loading status...</div>
      {/if}

      <div class="mt-8">
        <h3 class="font-semibold mb-2 text-gray-300">Quick Actions</h3>
        <div class="space-y-2">
          <button
            on:click={() => {
              message = "Check API consistency between frontend and backend";
              sendMessage();
            }}
            class="w-full text-left text-sm text-blue-400 hover:text-blue-300 py-1"
          >
            → Check API Consistency
          </button>
          <button
            on:click={() => {
              message = "Analyze recent error logs";
              sendMessage();
            }}
            class="w-full text-left text-sm text-blue-400 hover:text-blue-300 py-1"
          >
            → Analyze Error Logs
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
