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
    class="border-2 border-dashed border-ink bg-paper rounded-sm p-6 md:p-8 text-center cursor-pointer transition-all duration-150 shadow-hard-sm hover:shadow-hard hover:-translate-y-0.5 select-none group"
    :class="isDragOver ? 'bg-accent/20 border-solid scale-[0.99] shadow-hard' : 'hover:bg-neutral-50 dark:hover:bg-neutral-700/40'"
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

    <div class="flex flex-col items-center justify-center gap-2.5">
      <div class="w-14 h-14 rounded-sm border-2 border-ink bg-accent text-black flex items-center justify-center shadow-hard-sm group-hover:scale-105 group-hover:-translate-y-0.5 transition-all duration-150">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      </div>
      <div class="font-bold text-base md:text-lg text-ink">
        <slot>{{ t('dropzone.title') || 'Tarik file PDF ke sini atau klik untuk memilih' }}</slot>
      </div>
      <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 border border-ink bg-paper-dark text-ink text-[11px] font-bold uppercase rounded-sm shadow-[1.5px_1.5px_0_0_#000000]">
        <span class="w-1.5 h-1.5 rounded-full bg-accent-2 border border-ink"></span>
        {{ t('dropzone.subtitle') || '100% Offline • File tidak pernah meninggalkan browser Anda' }}
      </div>
    </div>
  </div>
</template>
