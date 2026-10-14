<script setup>
defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  type: {
    type: String,
    default: 'text'
  },
  placeholder: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

defineEmits(['update:modelValue', 'keydown.enter']);
</script>

<template>
  <input
    :type="type"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    class="w-full px-3.5 py-2 border-2 border-ink bg-paper text-ink rounded-sm font-medium placeholder:text-ink/40 shadow-hard-sm focus:outline-none focus:shadow-hard focus:-translate-x-0.5 focus:-translate-y-0.5 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
    @input="$emit('update:modelValue', $event.target.value)"
    @keydown.enter="$emit('keydown.enter', $event)"
  />
</template>
