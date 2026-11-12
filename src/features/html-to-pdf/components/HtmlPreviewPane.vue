<script setup>
import { computed } from 'vue';
import { t } from '../../../app/providers/i18n.js';
import { buildPrintableHtml } from '../logic/printHtmlDocument.js';
import BaseCard from '../../../ui/BaseCard.vue';
import ZoomPreview from '../../../ui/ZoomPreview.vue';

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
    <ZoomPreview>
    <div class="w-full min-w-[400px] h-72 bg-white border-2 border-ink rounded-xs overflow-hidden relative">
      <iframe
        :srcdoc="previewDoc"
        sandbox="allow-same-origin"
        class="w-full h-full border-0 select-text"
      />
    </div>
    </ZoomPreview>

    <!-- Security & offline notice -->
    <div class="p-2.5 border-2 border-ink bg-paper-dark/60 text-[11px] text-ink/80 font-medium rounded-xs flex items-center gap-2">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 text-[var(--ui-primary)]" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      <span>{{ t('tools.htmlToPdf.offlineNotice') }}</span>
    </div>
  </BaseCard>
</template>
