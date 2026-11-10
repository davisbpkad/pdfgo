<script setup>
defineProps({
  elevated: {
    type: Boolean,
    default: true
  },
  padding: {
    type: String,
    default: 'p-4 md:p-6'
  }
});
</script>

<template>
  <div
    class="border border-[var(--ui-border)] bg-paper rounded-xl transition-shadow duration-150"
    :class="[
      elevated ? 'shadow-hard' : '',
      padding
    ]"
  >
    <slot />
  </div>
</template>
