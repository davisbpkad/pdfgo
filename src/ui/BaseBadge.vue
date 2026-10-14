<script setup>
defineProps({
  color: {
    type: String,
    default: 'accent' // 'accent' | 'accent2' | 'accent3' | 'danger' | 'ink'
  }
});

const colorClasses = {
  accent: 'bg-accent text-black border-ink shadow-[1.5px_1.5px_0_0_#000000]',
  accent2: 'bg-accent-2 text-black border-ink shadow-[1.5px_1.5px_0_0_#000000]',
  accent3: 'bg-accent-3 text-black border-ink shadow-[1.5px_1.5px_0_0_#000000]',
  warning: 'bg-warning text-black border-ink shadow-[1.5px_1.5px_0_0_#000000]',
  danger: 'bg-danger text-black border-ink shadow-[1.5px_1.5px_0_0_#000000]',
  ink: 'bg-ink text-paper border-ink shadow-[1.5px_1.5px_0_0_#000000]'
};
</script>

<template>
  <span
    class="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider border rounded-sm select-none"
    :class="colorClasses[color] || colorClasses.accent"
  >
    <slot />
  </span>
</template>
