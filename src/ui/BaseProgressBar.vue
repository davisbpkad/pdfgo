<script setup>
defineProps({
  progress: {
    type: Number,
    default: 0
  },
  label: {
    type: String,
    default: ''
  }
});
</script>

<template>
  <div class="w-full space-y-1.5 select-none">
    <div v-if="label" class="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-ink">
      <span>{{ label }}</span>
      <span class="px-2 py-0.5 border border-ink bg-accent text-black text-[11px] font-black rounded-sm shadow-[1.5px_1.5px_0_0_#000000]">
        {{ Math.round(progress) }}%
      </span>
    </div>
    <div
      class="w-full h-5 border-2 border-ink bg-neutral-200 dark:bg-neutral-700/70 rounded-sm p-0.5 overflow-hidden shadow-hard-sm"
      role="progressbar"
      :aria-valuenow="Math.round(progress)"
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <div
        class="h-full bg-accent text-black font-extrabold text-[10px] rounded-xs transition-all duration-200 ease-out flex items-center justify-end pr-1 min-w-[12px]"
        :style="{ width: `${Math.min(100, Math.max(0, progress))}%` }"
      />
    </div>
  </div>
</template>
