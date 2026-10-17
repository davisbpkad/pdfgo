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
        >💾 {{ t('tools.ocr.downloadSearchablePdf') }}</BaseButton>
        <BaseButton
          variant="secondary"
          class="text-xs py-1.5 px-3"
          @click="$emit('download-txt')"
        >📄 {{ t('tools.ocr.downloadTxt') }}</BaseButton>
        <BaseButton
          variant="secondary"
          class="text-xs py-1.5 px-3"
          @click="$emit('copy-text')"
        >📋 {{ t('tools.ocr.copyText') }}</BaseButton>
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
