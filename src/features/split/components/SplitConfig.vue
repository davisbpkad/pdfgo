<script setup>
import { computed } from 'vue';
import BaseInput from '../../../ui/BaseInput.vue';
import { t } from '../../../app/providers/i18n.js';
import { parsePageRange } from '../logic/parsePageRange.js';

const props = defineProps({
  mode: {
    type: String,
    default: 'range'
  },
  rangeString: {
    type: String,
    default: '1-2'
  },
  nPages: {
    type: [Number, String],
    default: 1
  },
  totalPages: {
    type: Number,
    default: 1
  }
});

const emit = defineEmits(['update:mode', 'update:rangeString', 'update:nPages']);

const selectedPages = computed(() => {
  return parsePageRange(props.rangeString, props.totalPages);
});

const totalChunks = computed(() => {
  const n = Math.max(1, parseInt(props.nPages, 10) || 1);
  return Math.ceil(props.totalPages / n);
});
</script>

<template>
  <div class="space-y-4">
    <!-- Mode Switcher -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <button
        type="button"
        class="p-3 border-3 border-ink font-bold text-sm cursor-pointer transition-all flex items-center justify-center gap-2"
        :class="mode === 'range' ? 'bg-accent shadow-hard text-ink' : 'bg-paper text-ink/70 hover:bg-paper-dark'"
        @click="emit('update:mode', 'range')"
      >
        <span class="w-3 h-3 rounded-full border-2 border-ink" :class="mode === 'range' ? 'bg-ink' : 'bg-transparent'" />
        {{ t('tools.split.modeRange') }}
      </button>

      <button
        type="button"
        class="p-3 border-3 border-ink font-bold text-sm cursor-pointer transition-all flex items-center justify-center gap-2"
        :class="mode === 'everyN' ? 'bg-accent shadow-hard text-ink' : 'bg-paper text-ink/70 hover:bg-paper-dark'"
        @click="emit('update:mode', 'everyN')"
      >
        <span class="w-3 h-3 rounded-full border-2 border-ink" :class="mode === 'everyN' ? 'bg-ink' : 'bg-transparent'" />
        {{ t('tools.split.modeEveryN') }}
      </button>
    </div>

    <!-- Mode: Range -->
    <div v-if="mode === 'range'" class="p-4 border-3 border-ink bg-paper-dark space-y-2">
      <label class="block text-xs font-black uppercase tracking-wider text-ink">
        {{ t('tools.split.rangeLabel') }}
      </label>
      <BaseInput
        :model-value="rangeString"
        :placeholder="t('tools.split.rangePlaceholder')"
        @update:model-value="emit('update:rangeString', $event)"
      />
      <div class="text-xs font-bold text-ink/80 flex items-center justify-between">
        <span>{{ t('tools.split.selectedSummary', { selected: selectedPages.length, total: totalPages }) }}</span>
        <span v-if="selectedPages.length > 0" class="truncate max-w-[200px] text-ink/60">
          ({{ selectedPages.join(', ') }})
        </span>
      </div>
    </div>

    <!-- Mode: Every N -->
    <div v-else class="p-4 border-3 border-ink bg-paper-dark space-y-2">
      <label class="block text-xs font-black uppercase tracking-wider text-ink">
        {{ t('tools.split.nPagesLabel') }}
      </label>
      <BaseInput
        type="number"
        min="1"
        :max="totalPages"
        :model-value="nPages"
        @update:model-value="emit('update:nPages', $event)"
      />
      <p class="text-xs font-bold text-ink/80">
        {{ t('tools.split.chunksSummary', { count: totalChunks }) }}
      </p>
    </div>
  </div>
</template>
