<script setup>
defineProps({
  color: {
    type: String,
    default: 'accent' // 'accent' | 'accent2' | 'accent3' | 'danger' | 'ink'
  }
});

const colorClasses = {
  accent: 'bg-accent text-ink border-ink',
  accent2: 'bg-accent-2 text-ink border-ink',
  accent3: 'bg-accent-3 text-ink border-ink',
  danger: 'bg-danger text-paper border-ink',
  ink: 'bg-ink text-paper border-ink'
};
</script>

<template>
  <span
    class="inline-flex items-center px-2 py-0.5 text-xs font-bold uppercase tracking-wider border-2"
    :class="colorClasses[color] || colorClasses.accent"
  >
    <slot />
  </span>
</template>
