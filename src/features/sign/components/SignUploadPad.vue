<script setup>
import { ref } from 'vue';
import { t } from '../../../app/providers/i18n.js';
import { removeWhiteBackground } from '../logic/removeWhiteBackground.js';

const emit = defineEmits(['use-signature']);

const fileInputRef = ref(null);
const removeBg = ref(true);
const previewUrl = ref(null);

function triggerFileInput() {
  fileInputRef.value?.click();
}

function onFileSelected(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (ev) => {
    const rawData = ev.target.result;
    processImage(rawData);
  };
  reader.readAsDataURL(file);
}

function processImage(dataUrl) {
  const img = new Image();
  img.onload = () => {
    if (removeBg.value) {
      previewUrl.value = removeWhiteBackground(img);
    } else {
      previewUrl.value = dataUrl;
    }
  };
  img.src = dataUrl;
}

function onRemoveBgToggle() {
  if (previewUrl.value) {
    processImage(previewUrl.value);
  }
}

function apply() {
  if (!previewUrl.value) return;
  emit('use-signature', previewUrl.value);
}
</script>

<template>
  <div class="space-y-3">
    <input
      ref="fileInputRef"
      type="file"
      accept="image/png,image/jpeg"
      class="hidden"
      @change="onFileSelected"
    />

    <button
      type="button"
      class="w-full p-4 border-2 border-dashed border-ink bg-paper hover:bg-paper-dark transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer shadow-hard-sm"
      @click="triggerFileInput"
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-ink">
        <rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
      </svg>
      <span class="text-xs font-bold text-ink">{{ t('tools.sign.uploadPrompt') }}</span>
    </button>

    <label class="flex items-center gap-2 text-xs font-bold text-ink cursor-pointer select-none">
      <input
        v-model="removeBg"
        type="checkbox"
        class="w-4 h-4 border-2 border-ink rounded accent-accent cursor-pointer"
        @change="onRemoveBgToggle"
      />
      <span>{{ t('tools.sign.removeBg') }}</span>
    </label>

    <div
      v-if="previewUrl"
      class="border-3 border-ink bg-paper shadow-hard-sm p-2 flex items-center justify-center min-h-[100px] max-h-[160px] overflow-hidden"
    >
      <img :src="previewUrl" :alt="t('tools.sign.previewAlt')" class="max-h-24 max-w-full object-contain" />
    </div>

    <button
      type="button"
      :disabled="!previewUrl"
      class="w-full py-2 px-4 border-2 border-ink font-bold text-xs uppercase tracking-wider shadow-hard-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      :class="previewUrl ? 'bg-accent hover:shadow-hard text-ink' : 'bg-paper-dark text-ink/60'"
      @click="apply"
    >
      {{ t('tools.sign.useSignature') }}
    </button>
  </div>
</template>