<script setup>
import { ref } from 'vue';
import { t } from '../../../app/providers/i18n.js';
import { showToast } from '../../../app/providers/toast.js';
import { printHtmlViaIframe } from '../logic/printHtmlDocument.js';
import BaseButton from '../../../ui/BaseButton.vue';
import BaseCard from '../../../ui/BaseCard.vue';
import HtmlEditorPane from './HtmlEditorPane.vue';
import HtmlPreviewPane from './HtmlPreviewPane.vue';

const htmlCode = ref('');

function handlePrint() {
  const content = htmlCode.value.trim();
  if (!content) {
    showToast(t('tools.htmlToPdf.emptyWarning'), 'warning');
    return;
  }
  printHtmlViaIframe(content);
  showToast(t('tools.htmlToPdf.printInstruction'), 'info');
}
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-1">
      <h1 class="font-display font-black text-2xl md:text-3xl text-ink uppercase tracking-tight">{{ t('tools.htmlToPdf.title') }}</h1>
      <p class="text-sm text-ink/80 max-w-2xl font-medium">{{ t('tools.htmlToPdf.desc') }}</p>
    </div>

    <!-- Instruction helper card -->
    <BaseCard class="p-4 border-2 border-ink bg-accent/20 shadow-hard flex items-start gap-3">
      <span class="w-8 h-8 rounded-lg bg-accent text-[var(--ui-primary)] flex items-center justify-center shrink-0" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
      </span>
      <div class="text-xs text-ink space-y-0.5">
        <p class="font-bold">{{ t('tools.htmlToPdf.instructionHeader') }}</p>
        <p class="text-ink/80">{{ t('tools.htmlToPdf.instructionText') }}</p>
      </div>
    </BaseCard>

    <!-- Side-by-side or stacked editor and preview -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <HtmlEditorPane v-model="htmlCode" />
      <HtmlPreviewPane :html="htmlCode" />
    </div>

    <!-- Bottom Action Bar -->
    <div class="flex items-center justify-end pt-2">
      <BaseButton
        variant="primary"
        :disabled="!htmlCode.trim()"
        class="px-8 py-3 font-black text-xs shadow-hard"
        @click="handlePrint"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
        {{ t('tools.htmlToPdf.actionBtn') }}
      </BaseButton>
    </div>
  </div>
</template>
