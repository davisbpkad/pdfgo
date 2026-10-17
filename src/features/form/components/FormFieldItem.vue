<script setup>
import { t } from '../../../app/providers/i18n.js';
defineProps({
  field: {
    type: Object,
    required: true
  },
  modelValue: {
    type: [String, Boolean, Number],
    default: ''
  }
});

defineEmits(['update:modelValue']);
</script>

<template>
  <div class="border-2 border-ink bg-paper p-3 shadow-hard-sm space-y-1.5">
    <div class="flex items-center justify-between">
      <label class="text-xs font-bold text-ink truncate block" :title="field.name">
        {{ field.name }}
      </label>
      <span class="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 border border-ink bg-paper-dark text-ink/70">
        {{ field.type }}
      </span>
    </div>

    <!-- Checkbox input -->
    <template v-if="field.type === 'checkbox'">
      <label class="flex items-center gap-2 text-xs font-bold text-ink cursor-pointer select-none pt-1">
        <input
          type="checkbox"
          :checked="Boolean(modelValue)"
          class="w-4 h-4 border-2 border-ink rounded accent-accent cursor-pointer"
          @change="$emit('update:modelValue', $event.target.checked)"
        />
        <span>Centang Pilihan</span>
      </label>
    </template>

    <!-- Dropdown / Select / Radio input -->
    <template v-else-if="field.type === 'select' || field.type === 'radio'">
      <select
        :value="modelValue"
        class="w-full text-xs font-medium p-2 border-2 border-ink bg-paper shadow-hard-sm cursor-pointer focus:outline-none"
        @change="$emit('update:modelValue', $event.target.value)"
      >
        <option v-for="opt in field.options" :key="opt" :value="opt">
          {{ opt }}
        </option>
      </select>
    </template>

    <!-- Text input -->
    <template v-else>
      <input
        type="text"
        :value="modelValue"
        :placeholder="t('tools.form.fieldPlaceholder')"
        class="w-full text-xs font-medium p-2 border-2 border-ink bg-paper shadow-hard-sm focus:outline-none"
        @input="$emit('update:modelValue', $event.target.value)"
      />
    </template>
  </div>
</template>
