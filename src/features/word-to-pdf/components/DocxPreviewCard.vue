<script setup>
import { t } from '../../../app/providers/i18n.js';
import { printHtmlViaIframe } from '../../html-to-pdf/logic/printHtmlDocument.js';
import BaseButton from '../../../ui/BaseButton.vue';
import BaseCard from '../../../ui/BaseCard.vue';

const props = defineProps({
  html: { type: String, required: true }
});

defineEmits(['reset']);

function handlePrint() {
  printHtmlViaIframe(props.html);
}
</script>

<template>
  <div class="space-y-4">
    <!-- Instruction alert -->
    <div class="p-3.5 border-2 border-ink bg-primary/20 text-xs text-ink font-bold rounded-xs leading-relaxed flex items-center gap-2">
      <span class="text-base shrink-0">💡</span>
      <span>{{ t('tools.wordToPdf.instructionText') }}</span>
    </div>

    <!-- Preview Container -->
    <BaseCard class="border-2 border-ink bg-paper shadow-hard overflow-hidden">
      <div class="p-3 border-b-2 border-ink bg-paper-dark/40 flex items-center justify-between">
        <span class="text-xs font-bold uppercase text-ink">{{ t('tools.wordToPdf.previewTitle') }}</span>
        <span class="text-[10px] text-ink/70 font-mono">HTML Sandbox</span>
      </div>
      <div
        class="p-6 max-h-[420px] overflow-y-auto bg-white text-black font-serif text-sm leading-relaxed prose prose-sm max-w-none"
        v-html="html"
      />
    </BaseCard>

    <!-- Honest disclaimer card -->
    <div class="p-3 border-2 border-ink bg-paper-dark/60 text-xs text-ink/80 font-medium rounded-xs leading-relaxed">
      ℹ️ {{ t('tools.wordToPdf.disclaimer') }}
    </div>

    <!-- Actions -->
    <div class="flex items-center justify-between pt-2 border-t-2 border-ink gap-2 flex-wrap">
      <BaseButton variant="secondary" class="text-xs font-bold" @click="$emit('reset')">
        {{ t('tools.wordToPdf.resetBtn') }}
      </BaseButton>
      <BaseButton variant="primary" class="text-xs font-black px-6" @click="handlePrint">
        🖨️ {{ t('tools.wordToPdf.actionBtn') }}
      </BaseButton>
    </div>
  </div>
</template>
