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
    class="w-full px-3 py-2 border-3 border-ink bg-paper text-ink font-medium placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
    @input="$emit('update:modelValue', $event.target.value)"
    @keydown.enter="$emit('keydown.enter', $event)"
  />
</template>
