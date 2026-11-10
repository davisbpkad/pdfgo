<script setup>
defineProps({
  variant: {
    type: String,
    default: 'primary' // 'primary' | 'secondary' | 'danger' | 'ghost'
  },
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    default: 'button'
  }
});

defineEmits(['click']);

const variantClasses = {
  primary: 'bg-[var(--ui-primary)] hover:brightness-110 text-white border border-transparent shadow-hard-sm',
  secondary: 'bg-paper hover:bg-accent text-ink border border-[var(--ui-border)]',
  danger: 'bg-danger hover:opacity-90 text-black border border-transparent',
  ghost: 'bg-transparent hover:bg-accent text-ink border border-transparent'
};
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    class="inline-flex items-center justify-center gap-2 px-4 py-2 font-semibold text-xs md:text-sm rounded-lg transition-colors duration-150 cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed"
    :class="variantClasses[variant] || variantClasses.primary"
    @click="$emit('click', $event)"
  >
    <svg v-if="loading" class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
    </svg>
    <slot />
  </button>
</template>
