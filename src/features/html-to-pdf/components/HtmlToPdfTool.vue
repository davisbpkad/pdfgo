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
      <span class="text-xl">🖨️</span>
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
        📄 {{ t('tools.htmlToPdf.actionBtn') }}
      </BaseButton>
    </div>
  </div>
</template>
