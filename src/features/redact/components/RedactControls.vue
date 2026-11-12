<script setup>
import BaseButton from '../../../ui/BaseButton.vue';
import { t } from '../../../app/providers/i18n.js';

defineProps({
  searchTerm: { type: String, default: '' },
  pageBoxCount: { type: Number, default: 0 },
  totalBoxCount: { type: Number, default: 0 },
  sanitizeMetadata: { type: Boolean, default: true },
  isProcessing: { type: Boolean, default: false },
  canUndo: { type: Boolean, default: false },
  canRedo: { type: Boolean, default: false }
});

defineEmits([
  'update:searchTerm',
  'update:sanitizeMetadata',
  'search',
  'clear-page',
  'undo',
  'redo',
  'inspect-preview',
  'apply'
]);
</script>

<template>
  <div class="space-y-4 select-none">
    <!-- Keyword Auto-Redact Search -->
    <div class="space-y-1.5">
      <label class="text-xs font-bold text-ink uppercase tracking-wider block">
        {{ t('tools.redact.searchLabel') }}
      </label>
      <div class="flex flex-wrap gap-2">
        <input
          :value="searchTerm"
          type="text"
          :placeholder="t('tools.redact.searchPlaceholder')"
          class="min-w-0 flex-1 text-xs font-medium p-2.5 border-2 border-ink bg-paper text-ink rounded-sm shadow-hard-sm focus:outline-none focus:shadow-hard focus:-translate-y-0.5 transition-all duration-150"
          @input="$emit('update:searchTerm', $event.target.value)"
          @keyup.enter="$emit('search')"
        />
        <button
          type="button"
          class="px-3.5 py-2.5 text-xs font-bold border-2 border-ink bg-accent hover:bg-accent-strong text-black rounded-sm shadow-hard-sm hover:shadow-hard hover:-translate-y-0.5 active:translate-y-0.5 cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5 transition-all duration-150"
          @click="$emit('search')"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          {{ t('tools.redact.searchBtn') }}
        </button>
      </div>
    </div>

    <!-- History (Undo / Redo) and Clear Row -->
    <div class="flex items-center gap-2">
      <button
        type="button"
        :disabled="!canUndo || isProcessing"
        class="flex-1 py-2 px-2 text-xs font-bold border-2 border-ink bg-paper hover:bg-neutral-100 dark:hover:bg-neutral-700 text-ink rounded-sm shadow-hard-sm hover:shadow-hard hover:-translate-y-0.5 active:translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none cursor-pointer flex items-center justify-center gap-1 transition-all duration-150"
        :title="t('tools.redact.undoTitle')"
        @click="$emit('undo')"
      >
        ↩ {{ t('tools.redact.undo') }}
      </button>
      <button
        type="button"
        :disabled="!canRedo || isProcessing"
        class="flex-1 py-2 px-2 text-xs font-bold border-2 border-ink bg-paper hover:bg-neutral-100 dark:hover:bg-neutral-700 text-ink rounded-sm shadow-hard-sm hover:shadow-hard hover:-translate-y-0.5 active:translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none cursor-pointer flex items-center justify-center gap-1 transition-all duration-150"
        :title="t('tools.redact.redoTitle')"
        @click="$emit('redo')"
      >
        ↪ {{ t('tools.redact.redo') }}
      </button>
    </div>

    <!-- Inspect Preview Button -->
    <button
      type="button"
      :disabled="totalBoxCount === 0 || isProcessing"
      class="w-full py-2.5 px-3 text-xs font-bold border-2 border-ink bg-warning text-black rounded-sm shadow-hard-sm hover:shadow-hard hover:-translate-y-0.5 active:translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none cursor-pointer flex items-center justify-center gap-2 transition-all duration-150"
      @click="$emit('inspect-preview')"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
      <span>{{ t('tools.redact.inspectPreview') }}</span>
    </button>

    <!-- Metadata Sanitization Option -->
    <label class="flex items-center gap-2 text-xs font-bold text-ink cursor-pointer select-none">
      <input
        type="checkbox"
        :checked="sanitizeMetadata"
        class="w-4 h-4 border-2 border-ink rounded-xs accent-accent cursor-pointer"
        @change="$emit('update:sanitizeMetadata', $event.target.checked)"
      />
      <span>{{ t('tools.redact.sanitizeMetadata') }}</span>
    </label>

    <!-- Save / Apply Button -->
    <BaseButton
      variant="danger"
      class="w-full py-2.5 text-xs tracking-wider"
      :disabled="totalBoxCount === 0 || isProcessing"
      @click="$emit('apply')"
    >
      <svg v-if="!isProcessing" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      {{ isProcessing ? 'Memproses Sensor...' : t('tools.redact.actionApply') }}
    </BaseButton>
  </div>
</template>
