<script setup>
import { ref } from 'vue';
import { t } from '../../../app/providers/i18n.js';
import BaseCard from '../../../ui/BaseCard.vue';

const props = defineProps({
  modelValue: { type: String, default: '' }
});

const emit = defineEmits(['update:modelValue']);
const fileInput = ref(null);

function handleFileSelect(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (evt) => {
    emit('update:modelValue', String(evt.target?.result || ''));
  };
  reader.readAsText(file);
  e.target.value = '';
}

// Demo document; the markup lives in the translation so it follows the interface language.
function loadSample() {
  emit('update:modelValue', t('tools.htmlToPdf.sampleDoc'));
}
</script>

<template>
  <BaseCard class="p-4 border-2 border-ink bg-paper shadow-hard space-y-3 flex flex-col">
    <div class="flex items-center justify-between border-b-2 border-ink pb-2 flex-wrap gap-2">
      <span class="text-xs font-bold text-ink uppercase">{{ t('tools.htmlToPdf.editorTitle') }}</span>
      <div class="flex items-center gap-1.5">
        <input ref="fileInput" type="file" accept=".html,.htm" class="hidden" @change="handleFileSelect" />
        <button type="button" class="px-2.5 py-1 text-xs font-bold border-2 border-ink bg-paper hover:bg-paper-dark cursor-pointer inline-flex items-center gap-1.5" @click="fileInput?.click()">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          {{ t('tools.htmlToPdf.importBtn') }}
        </button>
        <button type="button" class="px-2.5 py-1 text-xs font-bold border-2 border-ink bg-paper hover:bg-paper-dark cursor-pointer inline-flex items-center gap-1.5" @click="loadSample">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>
          {{ t('tools.htmlToPdf.sampleBtn') }}
        </button>
        <button type="button" class="px-2.5 py-1 text-xs font-bold border-2 border-ink bg-paper hover:bg-paper-dark cursor-pointer" @click="$emit('update:modelValue', '')">
          ✕
        </button>
      </div>
    </div>

    <textarea
      :value="modelValue"
      :placeholder="t('tools.htmlToPdf.placeholder')"
      class="w-full h-72 p-3 font-mono text-xs text-ink bg-paper-dark/30 border-2 border-ink rounded-xs focus:outline-none resize-y selection:bg-accent"
      @input="$emit('update:modelValue', $event.target.value)"
    />
  </BaseCard>
</template>
