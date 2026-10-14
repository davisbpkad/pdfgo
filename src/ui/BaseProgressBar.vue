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
  <div class="w-full space-y-1.5">
    <div v-if="label" class="flex justify-between text-xs font-bold uppercase tracking-wider text-ink">
      <span>{{ label }}</span>
      <span>{{ Math.round(progress) }}%</span>
    </div>
    <div class="w-full h-4 border-2 border-ink bg-paper p-0.5 overflow-hidden">
      <div
        class="h-full bg-accent transition-all duration-200"
        :style="{ width: `${Math.min(100, Math.max(0, progress))}%` }"
      />
    </div>
  </div>
</template>
