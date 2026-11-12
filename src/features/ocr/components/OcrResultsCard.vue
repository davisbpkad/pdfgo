<script setup>
import { t } from '../../../app/providers/i18n.js';
import BaseButton from '../../../ui/BaseButton.vue';

defineProps({
  results: { type: Object, required: true },
  hasSearchablePdf: { type: Boolean, default: false }
});

defineEmits(['download-pdf', 'download-txt', 'copy-text']);
</script>

<template>
  <div class="border-2 border-ink bg-paper p-4 shadow-hard-sm space-y-3">
    <div class="flex items-center justify-between flex-wrap gap-2 border-b-2 border-ink pb-3">
      <div class="space-y-0.5">
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-full bg-emerald-500 border border-ink" />
          <span class="text-xs font-black uppercase tracking-wider text-ink">{{ t('tools.ocr.resultsTitle') }}</span>
        </div>
        <p class="text-xs text-ink/70 font-medium">{{ results.totalWords }} {{ t('common.words') }} • {{ results.totalChars }} {{ t('common.characters') }} • {{ t('tools.ocr.avgAccuracy') }} {{ results.avgConfidence }}%</p>
      </div>

      <div class="flex items-center gap-2 flex-wrap">
        <BaseButton
          v-if="hasSearchablePdf"
          variant="primary"
          class="text-xs py-1.5 px-3"
          @click="$emit('download-pdf')"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          {{ t('tools.ocr.downloadSearchablePdf') }}
        </BaseButton>
        <BaseButton
          variant="secondary"
          class="text-xs py-1.5 px-3"
          @click="$emit('download-txt')"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          {{ t('tools.ocr.downloadTxt') }}
        </BaseButton>
        <BaseButton
          variant="secondary"
          class="text-xs py-1.5 px-3"
          @click="$emit('copy-text')"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          {{ t('tools.ocr.copyText') }}
        </BaseButton>
      </div>
    </div>

    <textarea
      readonly
      rows="12"
      spellcheck="false"
      class="w-full p-3 border-2 border-ink bg-paper-dark text-ink font-mono text-xs leading-relaxed focus:outline-none shadow-hard-sm"
      :value="results.fullText || 'Tidak ada teks yang dapat dikenali.'"
    />
  </div>
</template>
