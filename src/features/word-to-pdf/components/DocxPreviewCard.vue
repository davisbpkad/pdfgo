<script setup>
import { t } from '../../../app/providers/i18n.js';
import { printHtmlViaIframe } from '../../html-to-pdf/logic/printHtmlDocument.js';
import BaseButton from '../../../ui/BaseButton.vue';
import BaseCard from '../../../ui/BaseCard.vue';
import ZoomPreview from '../../../ui/ZoomPreview.vue';

const props = defineProps({
  html: { type: String, required: true }
});

defineEmits(['reset']);

function handlePrint() {
  printHtmlViaIframe(props.html, 'word-ke-pdf');
}
</script>

<template>
  <div class="space-y-4">
    <!-- Instruction alert -->
    <div class="p-3.5 border-2 border-ink bg-primary/20 text-xs text-ink font-bold rounded-xs leading-relaxed flex items-center gap-2">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 text-[var(--ui-primary)]" aria-hidden="true"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>
      <span>{{ t('tools.wordToPdf.instructionText') }}</span>
    </div>

    <!-- Preview Container -->
    <BaseCard class="border-2 border-ink bg-paper shadow-hard overflow-hidden">
      <div class="p-3 border-b-2 border-ink bg-paper-dark/40 flex items-center justify-between">
        <span class="text-xs font-bold uppercase text-ink">{{ t('tools.wordToPdf.previewTitle') }}</span>
        <span class="text-[10px] text-ink/70 font-mono">HTML Sandbox</span>
      </div>
      <ZoomPreview>
      <div
        class="p-6 bg-white text-black font-serif text-sm leading-relaxed prose prose-sm max-w-none"
        v-html="html"
      />
      </ZoomPreview>
    </BaseCard>

    <!-- Honest disclaimer card -->
    <div class="p-3 border-2 border-ink bg-paper-dark/60 text-xs text-ink/80 font-medium rounded-xs leading-relaxed flex items-start gap-2">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 mt-0.5" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
      <span>{{ t('tools.wordToPdf.disclaimer') }}</span>
    </div>

    <!-- Actions -->
    <div class="flex items-center justify-between pt-2 border-t-2 border-ink gap-2 flex-wrap">
      <BaseButton variant="secondary" class="text-xs font-bold" @click="$emit('reset')">
        {{ t('tools.wordToPdf.resetBtn') }}
      </BaseButton>
      <BaseButton variant="primary" class="text-xs font-black px-6" @click="handlePrint">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
        {{ t('tools.wordToPdf.actionBtn') }}
      </BaseButton>
    </div>
  </div>
</template>
