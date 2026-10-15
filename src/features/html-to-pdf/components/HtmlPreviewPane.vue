<script setup>
import { computed } from 'vue';
import { t } from '../../../app/providers/i18n.js';
import { buildPrintableHtml } from '../logic/printHtmlDocument.js';
import BaseCard from '../../../ui/BaseCard.vue';

const props = defineProps({
  html: { type: String, default: '' }
});

const previewDoc = computed(() => {
  return buildPrintableHtml(props.html || `<p class="text-gray-400 italic">${t('tools.htmlToPdf.emptyPreview')}</p>`);
});
</script>

<template>
  <BaseCard class="p-4 border-2 border-ink bg-paper shadow-hard space-y-3 flex flex-col">
    <div class="flex items-center justify-between border-b-2 border-ink pb-2">
      <span class="text-xs font-bold text-ink uppercase">{{ t('tools.htmlToPdf.previewTitle') }}</span>
      <span class="text-[11px] font-bold text-ink/70 bg-paper-dark px-2 py-0.5 border border-ink">A4 Print Layout</span>
    </div>

    <!-- Sandboxed iframe preview -->
    <div class="w-full h-72 bg-white border-2 border-ink rounded-xs overflow-hidden relative">
      <iframe
        :srcdoc="previewDoc"
        sandbox="allow-same-origin"
        class="w-full h-full border-0 select-text"
      />
    </div>

    <!-- Security & offline notice -->
    <div class="p-2.5 border-2 border-ink bg-paper-dark/60 text-[11px] text-ink/80 font-medium rounded-xs">
      🛡️ {{ t('tools.htmlToPdf.offlineNotice') }}
    </div>
  </BaseCard>
</template>
