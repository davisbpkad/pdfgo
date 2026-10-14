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
    class="border-2 border-ink bg-paper rounded-sm transition-all duration-150"
    :class="[
      elevated ? 'shadow-hard hover:shadow-hard-lg hover:-translate-x-0.5 hover:-translate-y-0.5' : '',
      padding
    ]"
  >
    <slot />
  </div>
</template>
