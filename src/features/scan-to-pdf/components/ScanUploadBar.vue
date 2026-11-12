<script setup>
import { ref } from 'vue';
import { t } from '../../../app/providers/i18n.js';
import BaseButton from '../../../ui/BaseButton.vue';
import BaseCard from '../../../ui/BaseCard.vue';

const emit = defineEmits(['files']);

const cameraInput = ref(null);
const fileInput = ref(null);

function handleFileChange(e) {
  const files = Array.from(e.target.files || []);
  if (files.length > 0) {
    emit('files', files);
  }
  e.target.value = '';
}

function openCamera() {
  cameraInput.value?.click();
}

function openPicker() {
  fileInput.value?.click();
}
</script>

<template>
  <BaseCard class="p-6 border-2 border-ink bg-paper shadow-hard space-y-4 text-center">
    <!-- Hidden native inputs -->
    <input
      ref="cameraInput"
      type="file"
      accept="image/*"
      capture="environment"
      multiple
      class="hidden"
      @change="handleFileChange"
    />
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      multiple
      class="hidden"
      @change="handleFileChange"
    />

    <div class="space-y-1">
      <h3 class="font-display font-black text-lg text-ink uppercase">{{ t('tools.scanToPdf.uploadTitle') }}</h3>
      <p class="text-xs text-ink/70 font-medium">{{ t('tools.scanToPdf.uploadSubtitle') }}</p>
    </div>

    <div class="flex items-center justify-center gap-3 flex-wrap pt-2">
      <BaseButton variant="primary" class="px-5 py-3 font-bold text-xs" @click="openCamera">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
        {{ t('tools.scanToPdf.cameraBtn') }}
      </BaseButton>
      <BaseButton variant="secondary" class="px-5 py-3 font-bold text-xs" @click="openPicker">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
        {{ t('tools.scanToPdf.fileBtn') }}
      </BaseButton>
    </div>
  </BaseCard>
</template>
