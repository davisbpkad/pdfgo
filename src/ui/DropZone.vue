<script setup>
import { ref } from 'vue';
import { t } from '../app/providers/i18n.js';

defineProps({
  accept: {
    type: String,
    default: '.pdf'
  },
  multiple: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['files']);

const isDragOver = ref(false);
const fileInput = ref(null);

function triggerBrowse() {
  fileInput.value?.click();
}

function handleInputChange(e) {
  if (e.target.files && e.target.files.length > 0) {
    emit('files', Array.from(e.target.files));
    e.target.value = '';
  }
}

function handleDrop(e) {
  isDragOver.value = false;
  if (e.dataTransfer?.files?.length) {
    emit('files', Array.from(e.dataTransfer.files));
  }
}
</script>

<template>
  <div
    class="border-3 border-dashed border-ink bg-paper p-6 md:p-8 text-center cursor-pointer transition-transform select-none"
    :class="isDragOver ? 'bg-accent/20 scale-[0.99] border-solid' : 'hover:bg-black/5 dark:hover:bg-white/5'"
    @click="triggerBrowse"
    @dragover.prevent="isDragOver = true"
    @dragleave.prevent="isDragOver = false"
    @drop.prevent="handleDrop"
  >
    <input
      ref="fileInput"
      type="file"
      :accept="accept"
      :multiple="multiple"
      class="hidden"
      @change="handleInputChange"
    />

    <div class="flex flex-col items-center justify-center gap-2">
      <div class="w-12 h-12 rounded-none border-2 border-ink bg-accent flex items-center justify-center shadow-hard-sm">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      </div>
      <div class="font-bold text-base md:text-lg text-ink">
        <slot>{{ t('dropzone.title') || 'Tarik file PDF ke sini atau klik untuk memilih' }}</slot>
      </div>
      <div class="text-xs text-ink/70">
        {{ t('dropzone.subtitle') || '100% Offline • File tidak pernah meninggalkan browser Anda' }}
      </div>
    </div>
  </div>
</template>
