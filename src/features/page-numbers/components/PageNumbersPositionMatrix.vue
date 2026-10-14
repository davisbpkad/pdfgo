<script setup>
defineProps({
  modelValue: {
    type: String,
    default: 'bottom-center'
  }
});

const emit = defineEmits(['update:modelValue']);

const positions = [
  { id: 'top-left', label: '↖' },
  { id: 'top-center', label: '↑' },
  { id: 'top-right', label: '↗' },
  { id: 'middle-left', label: '←' },
  { id: 'middle-center', label: '•' },
  { id: 'middle-right', label: '→' },
  { id: 'bottom-left', label: '↙' },
  { id: 'bottom-center', label: '↓' },
  { id: 'bottom-right', label: '↘' }
];
</script>

<template>
  <div class="grid grid-cols-3 gap-1.5 w-32 border-2 border-ink p-1 bg-paper-dark shadow-hard-sm">
    <button
      v-for="p in positions"
      :key="p.id"
      type="button"
      :title="p.id"
      class="w-9 h-9 border border-ink text-sm font-bold flex items-center justify-center transition-all cursor-pointer"
      :class="modelValue === p.id ? 'bg-accent shadow-hard-sm text-ink' : 'bg-paper text-ink/60 hover:bg-paper-dark'"
      @click="emit('update:modelValue', p.id)"
    >
      {{ p.label }}
    </button>
  </div>
</template>
