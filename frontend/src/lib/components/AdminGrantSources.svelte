<script>
  import { onMount } from "svelte";

  let sources = [];
  let newUrl = "";
  let newName = "";

  async function fetchSources() {
    const res = await fetch("http://localhost:3000/api/admin/sources");
    if (res.ok) sources = await res.json();
  }

  async function addSource() {
    if (!newUrl) return;
    const res = await fetch("http://localhost:3000/api/admin/sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: newUrl, name: newName, type: "manual" }),
    });
    if (res.ok) {
      newUrl = "";
      newName = "";
      fetchSources();
    }
  }

  onMount(fetchSources);
</script>

<div class="p-4 bg-gray-800 text-white rounded-lg">
  <h2 class="text-xl font-bold mb-4">Grant Discovery Sources</h2>

  <div class="flex gap-2 mb-4">
    <input
      type="text"
      bind:value={newUrl}
      placeholder="Source URL (e.g. grants.gov/search)"
      class="flex-1 p-2 rounded bg-gray-700 text-white"
    />
    <input
      type="text"
      bind:value={newName}
      placeholder="Name (Optional)"
      class="w-1/3 p-2 rounded bg-gray-700 text-white"
    />
    <button
      on:click={addSource}
      class="bg-blue-600 px-4 py-2 rounded hover:bg-blue-500"
    >
      Add Source
    </button>
  </div>

  <table class="w-full text-left">
    <thead>
      <tr class="text-gray-400 border-b border-gray-700">
        <th class="p-2">Name</th>
        <th class="p-2">URL</th>
        <th class="p-2">Status</th>
        <th class="p-2">Last Crawled</th>
      </tr>
    </thead>
    <tbody>
      {#each sources as source}
        <tr class="border-b border-gray-700">
          <td class="p-2">{source.name || "Unknown"}</td>
          <td class="p-2 truncate max-w-xs">{source.url}</td>
          <td class="p-2">
            <span
              class="px-2 py-1 rounded text-xs {source.status === 'active'
                ? 'bg-green-900 text-green-300'
                : 'bg-red-900'}"
            >
              {source.status}
            </span>
          </td>
          <td class="p-2 text-sm text-gray-400">
            {source.last_crawled_at
              ? new Date(source.last_crawled_at).toLocaleDateString()
              : "Never"}
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
