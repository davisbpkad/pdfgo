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
    class="border-3 border-ink bg-paper transition-all"
    :class="[
      elevated ? 'shadow-hard' : '',
      padding
    ]"
  >
    <slot />
  </div>
</template>
