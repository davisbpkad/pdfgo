<script setup>
import { t } from '../../../app/providers/i18n.js';
import { ref } from 'vue';
import { saveTesseractModel } from '../../../core/assets.js';
import { showToast } from '../../../app/providers/toast.js';

const props = defineProps({
  availableLangs: { type: Array, default: () => [] },
  isFullVariant: { type: Boolean, default: false }
});

const emit = defineEmits(['model-imported']);

const fileInputRef = ref(null);

function triggerFileInput() {
  fileInputRef.value?.click();
}

async function onFileSelected(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  const fileName = file.name.toLowerCase();
  let langCode = 'eng';
  if (fileName.includes('ind')) {
    langCode = 'ind';
  } else if (fileName.includes('eng')) {
    langCode = 'eng';
  }

  try {
    const arrayBuf = await file.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuf);
    await saveTesseractModel(langCode, uint8);
    showToast(t('tools.ocr.modelImported', { lang: langCode.toUpperCase() }), 'success');
    emit('model-imported', langCode);
  } catch (err) {
    showToast(t('tools.ocr.modelImportFailed') + (err.message || ''), 'error');
  }
}
</script>

<template>
  <div class="border-2 border-ink bg-paper p-3 shadow-hard-sm flex items-center justify-between flex-wrap gap-3">
    <div class="flex items-center gap-3">
      <div
        class="w-3.5 h-3.5 rounded-full border-2 border-ink"
        :class="availableLangs.length > 0 ? 'bg-emerald-500' : 'bg-amber-500'"
      />
      <div>
        <div class="text-xs font-black uppercase tracking-wider text-ink">
          <template v-if="availableLangs.length > 0">
            Model OCR Siap: {{ availableLangs.join(', ').toUpperCase() }}
          </template>
          <template v-else>{{ t('tools.ocr.modelStatusMissing') }}</template>
        </div>
        <div class="text-[11px] text-ink/70 font-medium">
          {{ isFullVariant ? 'Varian Full (Model terpasang secara lokal bawaan)' : 'Varian Lite (Impor berkas .traineddata tanpa internet)' }}
        </div>
      </div>
    </div>

    <div>
      <input
        ref="fileInputRef"
        type="file"
        accept=".traineddata,.gz"
        class="hidden"
        @change="onFileSelected"
      />
      <button
        type="button"
        class="px-3 py-1.5 text-xs font-bold border-2 border-ink bg-paper hover:bg-paper-dark shadow-hard-sm cursor-pointer flex items-center gap-1.5"
        @click="triggerFileInput"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Impor Model (.traineddata)
      </button>
    </div>
  </div>
</template>
