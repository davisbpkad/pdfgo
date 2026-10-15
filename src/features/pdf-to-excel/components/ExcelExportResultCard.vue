<script setup>
import { t } from '../../../app/providers/i18n.js';

const props = defineProps({
  sheetCount: { type: Number, default: 0 },
  rowCount: { type: Number, default: 0 },
  fileName: { type: String, default: '' }
});

const emit = defineEmits(['download', 'reset']);
</script>

<template>
  <div class="border-2 border-ink bg-paper p-5 shadow-hard rounded-sm space-y-4">
    <div class="flex items-center gap-3">
      <span class="text-2xl">📊</span>
      <div>
        <h3 class="font-display font-black text-base uppercase text-ink">
          {{ t('pdfToExcel.successTitle') }}
        </h3>
        <p class="text-xs text-ink/70 font-mono">
          {{ fileName }} &bull; {{ sheetCount }} {{ t('pdfToExcel.sheetsCount') }} &bull; {{ rowCount }} {{ t('pdfToExcel.rowsCount') }}
        </p>
      </div>
    </div>

    <div class="flex flex-col sm:flex-row gap-3 pt-2">
      <button
        type="button"
        class="flex-1 py-3 px-4 border-2 border-ink bg-accent font-display font-black text-sm uppercase rounded-sm shadow-hard hover:bg-accent/90 active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all"
        @click="emit('download')"
      >
        {{ t('pdfToExcel.downloadBtn') }}
      </button>

      <button
        type="button"
        class="py-3 px-4 border-2 border-ink bg-paper-dark font-display font-black text-sm uppercase rounded-sm shadow-hard hover:bg-paper-dark/80 active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all"
        @click="emit('reset')"
      >
        {{ t('pdfToExcel.anotherFile') }}
      </button>
    </div>
  </div>
</template>
