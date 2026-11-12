<script setup>
import { t } from '../../../app/providers/i18n.js';

const props = defineProps({
  mode: { type: String, default: 'table' },
  pageRange: { type: String, default: '' },
  isProcessing: { type: Boolean, default: false }
});

const emit = defineEmits(['update:mode', 'update:pageRange', 'convert']);
</script>

<template>
  <div class="border-2 border-ink bg-paper p-5 shadow-hard rounded-sm space-y-4">
    <div class="space-y-1">
      <h3 class="font-display font-black text-base uppercase text-ink">
        {{ t('pdfToExcel.modeTitle') }}
      </h3>
      <p class="text-xs text-ink/70">
        {{ t('pdfToExcel.desc') }}
      </p>
    </div>

    <!-- Mode Selectors -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <button
        type="button"
        class="border-2 border-ink p-3 rounded-sm text-left transition-all cursor-pointer shadow-hard-sm flex flex-col justify-between"
        :class="mode === 'table' ? 'bg-accent border-ink font-bold' : 'bg-paper-dark/40 hover:bg-paper-dark'"
        @click="emit('update:mode', 'table')"
      >
        <span class="text-xs uppercase font-extrabold text-ink">{{ t('pdfToExcel.modeTable') }}</span>
        <span class="text-[11px] text-ink/75 mt-1">{{ t('pdfToExcel.modeTableDesc') }}</span>
      </button>

      <button
        type="button"
        class="border-2 border-ink p-3 rounded-sm text-left transition-all cursor-pointer shadow-hard-sm flex flex-col justify-between"
        :class="mode === 'raw-text' ? 'bg-accent border-ink font-bold' : 'bg-paper-dark/40 hover:bg-paper-dark'"
        @click="emit('update:mode', 'raw-text')"
      >
        <span class="text-xs uppercase font-extrabold text-ink">{{ t('pdfToExcel.modeRaw') }}</span>
        <span class="text-[11px] text-ink/75 mt-1">{{ t('pdfToExcel.modeRawDesc') }}</span>
      </button>
    </div>

    <!-- Page Range Option -->
    <div class="space-y-1">
      <label class="block text-xs font-bold uppercase text-ink">
        {{ t('pdfToExcel.pageRangeLabel') }}
      </label>
      <input
        type="text"
        :value="pageRange"
        :placeholder="t('pdfToExcel.pageRangePlaceholder')"
        class="w-full border-2 border-ink bg-white px-3 py-2 text-xs font-mono rounded-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-accent"
        @input="emit('update:pageRange', $event.target.value)"
      />
    </div>

    <!-- Honest Disclaimer Note -->
    <div class="border-2 border-ink bg-yellow-100 p-3 rounded-sm text-xs text-ink flex gap-2 items-start">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 mt-0.5" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      <span>{{ t('pdfToExcel.notice') }}</span>
    </div>

    <!-- Action Button -->
    <button
      type="button"
      :disabled="isProcessing"
      class="w-full py-3 px-4 border-2 border-ink bg-accent font-display font-black text-sm uppercase rounded-sm shadow-hard hover:bg-accent/90 active:translate-x-0.5 active:translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      @click="emit('convert')"
    >
      {{ isProcessing ? t('pdfToExcel.converting') : t('pdfToExcel.convertBtn') }}
    </button>
  </div>
</template>
