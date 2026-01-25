<script lang="ts">
    import { toasts, type Toast } from '$lib/stores/toast';
    import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-svelte';
    import { fly } from 'svelte/transition';

    const iconMap = {
        success: CheckCircle,
        error: AlertCircle,
        warning: AlertTriangle,
        info: Info,
    };

    const colorMap = {
        success: {
            bg: 'bg-green-500/10',
            border: 'border-green-500/30',
            icon: 'text-green-400',
            title: 'text-green-400',
        },
        error: {
            bg: 'bg-red-500/10',
            border: 'border-red-500/30',
            icon: 'text-red-400',
            title: 'text-red-400',
        },
        warning: {
            bg: 'bg-yellow-500/10',
            border: 'border-yellow-500/30',
            icon: 'text-yellow-400',
            title: 'text-yellow-400',
        },
        info: {
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/30',
            icon: 'text-blue-400',
            title: 'text-blue-400',
        },
    };

    function handleDismiss(id: string) {
        toasts.remove(id);
    }
</script>

<div class="fixed bottom-4 right-4 z-50 flex flex-col gap-3 max-w-md">
    {#each $toasts as toast (toast.id)}
        <div
            transition:fly={{ x: 100, duration: 300 }}
            class="glass-card p-4 rounded-xl border {colorMap[toast.type].bg} {colorMap[toast.type].border} shadow-lg"
        >
            <div class="flex items-start gap-3">
                <div class="flex-shrink-0 {colorMap[toast.type].icon}">
                    <svelte:component this={iconMap[toast.type]} class="w-5 h-5" />
                </div>
                <div class="flex-1 min-w-0">
                    <p class="font-semibold text-sm {colorMap[toast.type].title}">
                        {toast.title}
                    </p>
                    {#if toast.message}
                        <p class="text-xs text-muted-foreground mt-1">
                            {toast.message}
                        </p>
                    {/if}
                </div>
                <button
                    onclick={() => handleDismiss(toast.id)}
                    class="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <X class="w-4 h-4" />
                </button>
            </div>
        </div>
    {/each}
</div>
