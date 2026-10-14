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
  primary: 'bg-accent hover:bg-accent-strong text-black border-2 border-ink shadow-hard-sm hover:shadow-hard hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_0_#000000]',
  secondary: 'bg-paper hover:bg-neutral-100 dark:hover:bg-neutral-700 text-ink border-2 border-ink shadow-hard-sm hover:shadow-hard hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_0_#000000]',
  danger: 'bg-danger hover:opacity-90 text-black border-2 border-ink shadow-hard-sm hover:shadow-hard hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_0_#000000]',
  ghost: 'bg-transparent hover:bg-neutral-200/50 dark:hover:bg-neutral-700/50 text-ink border-2 border-transparent hover:border-ink hover:shadow-hard-sm hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none'
};
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    class="inline-flex items-center justify-center gap-2 px-4 py-2 font-bold uppercase tracking-wider text-xs md:text-sm rounded-sm transition-all duration-150 cubic-bezier(0.4, 0, 0.2, 1) cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-[2px_2px_0_0_#000000]"
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
