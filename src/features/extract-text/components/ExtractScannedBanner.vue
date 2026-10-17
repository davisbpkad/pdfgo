<script setup>
import { t } from '../../../app/providers/i18n.js';
import BaseButton from '../../../ui/BaseButton.vue';

defineProps({
  isScanned: {
    type: Boolean,
    default: false
  },
  isExtracting: {
    type: Boolean,
    default: false
  },
  selectedLang: {
    type: String,
    default: 'ind'
  },
  availableLangs: {
    type: Array,
    default: () => ['ind']
  }
});

const emit = defineEmits(['open-ocr', 'start-ocr', 'update:selectedLang']);
</script>

<template>
  <div
    v-if="isScanned"
    class="border-3 border-ink bg-accent/20 p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-hard-sm"
  >
    <div class="space-y-1.5 flex-1">
      <div class="flex items-center gap-2 font-display font-black text-sm text-ink uppercase tracking-tight">
        <span class="text-base">⚠️</span>
        <span>{{ t('tools.extractText.scannedTitle') }}</span>
      </div>
      <p class="text-xs font-medium text-ink/80 leading-relaxed max-w-xl">
        {{ t('tools.extractText.scannedBody') }}
      </p>

      <!-- Language selector pill bar -->
      <div class="flex items-center gap-2 pt-1">
        <span class="text-[11px] font-bold text-ink uppercase">{{ t('tools.extractText.ocrLangLabel') }}</span>
        <div class="inline-flex border-2 border-ink bg-paper divide-x-2 divide-ink shadow-[1px_1px_0_0_#000000]">
          <button
            type="button"
            class="px-2.5 py-0.5 text-xs font-bold transition-colors cursor-pointer"
            :class="selectedLang === 'ind' ? 'bg-accent text-black' : 'bg-paper text-ink hover:bg-paper-dark'"
            @click="emit('update:selectedLang', 'ind')"
          >
            {{ t('tools.extractText.langInd') }}
          </button>
          <button
            type="button"
            class="px-2.5 py-0.5 text-xs font-bold transition-colors cursor-pointer"
            :class="selectedLang === 'eng' ? 'bg-accent text-black' : 'bg-paper text-ink hover:bg-paper-dark'"
            @click="emit('update:selectedLang', 'eng')"
          >
            {{ t('tools.extractText.langEng') }}
          </button>
          <button
            v-if="availableLangs.includes('ind') && availableLangs.includes('eng')"
            type="button"
            class="px-2.5 py-0.5 text-xs font-bold transition-colors cursor-pointer"
            :class="selectedLang === 'ind+eng' ? 'bg-accent text-black' : 'bg-paper text-ink hover:bg-paper-dark'"
            @click="emit('update:selectedLang', 'ind+eng')"
          >
            {{ t('tools.extractText.langBoth') }}
          </button>
        </div>
      </div>
    </div>

    <div class="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0 w-full md:w-auto">
      <BaseButton
        variant="primary"
        class="text-xs py-2 px-4 whitespace-nowrap w-full sm:w-auto shadow-hard-sm"
        :disabled="isExtracting"
        @click="emit('start-ocr')"
      >
        ⚡ {{ t('tools.extractText.startOcr') }}
      </BaseButton>

      <BaseButton
        variant="secondary"
        class="text-xs py-2 px-3 whitespace-nowrap w-full sm:w-auto"
        @click="emit('open-ocr')"
      >
        {{ t('tools.extractText.openOcr') }} ➔
      </BaseButton>
    </div>
  </div>
</template>
