<script>
  import { onMount, onDestroy } from "svelte";

  export let grantId;
  let logs = [];
  let status = "idle";
  let currentStage = "Initializing";
  let eventSource;

  function startResearch() {
    if (eventSource) eventSource.close();
    status = "running";
    logs = [];

    eventSource = new EventSource(
      `http://localhost:3000/api/research/${grantId}/research`
    );

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "log") {
        logs = [...logs, data];
      } else if (data.type === "stage_started") {
        currentStage = data.stage;
        logs = [...logs, { type: "info", message: `--- ${data.stage} ---` }];
      } else if (data.type === "status") {
        status = data.status;
        if (status === "completed" || status === "failed") eventSource.close();
      } else if (data.type === "error") {
        logs = [...logs, { type: "error", message: data.message }];
      }
    };

    eventSource.onerror = () => {
      logs = [...logs, { type: "error", message: "Connection lost" }];
      eventSource.close();
    };
  }

  onDestroy(() => {
    if (eventSource) eventSource.close();
  });
</script>

<div
  class="bg-black text-green-400 font-mono p-4 rounded-lg h-96 overflow-y-auto border border-green-900"
>
  <div
    class="flex justify-between items-center mb-4 sticky top-0 bg-black pb-2 border-b border-green-900"
  >
    <div>
      <span class="font-bold">STATUS:</span>
      {status.toUpperCase()}
      <span class="ml-4 text-gray-400">STAGE: {currentStage}</span>
    </div>
    {#if status === "idle" || status === "completed" || status === "failed"}
      <button
        on:click={startResearch}
        class="bg-green-700 text-white px-4 py-1 rounded hover:bg-green-600 text-sm"
      >
        START AGENT LAB
      </button>
    {/if}
  </div>

  <div class="space-y-1 text-sm">
    {#each logs as log}
      <div class={log.type === "error" ? "text-red-500" : "text-green-400"}>
        <span class="opacity-50">[{new Date().toLocaleTimeString()}]</span>
        {log.message}
      </div>
    {/each}
    {#if logs.length === 0}
      <div class="text-gray-600 italic">
        Ready to initialize research protocol...
      </div>
    {/if}
  </div>
</div>
