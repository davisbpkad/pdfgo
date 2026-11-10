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
    class="border border-dashed border-[var(--ui-muted)] bg-paper rounded-xl p-8 md:p-12 text-center cursor-pointer transition-colors duration-150 select-none group"
    :class="isDragOver ? 'bg-accent border-solid' : 'hover:bg-accent/30'"
    role="button"
    tabindex="0"
    :aria-label="t('dropzone.title')"
    @keydown.enter.prevent="triggerBrowse"
    @keydown.space.prevent="triggerBrowse"
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
      @click.stop
      @change="handleInputChange"
    />

    <div class="flex flex-col items-center justify-center gap-2.5">
      <div class="w-14 h-14 rounded-xl bg-accent text-[var(--ui-primary)] flex items-center justify-center">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      </div>
      <div class="font-bold text-base md:text-lg text-ink">
        <slot>{{ t('dropzone.title') || 'Tarik file PDF ke sini atau klik untuk memilih' }}</slot>
      </div>
      <div class="inline-flex items-center gap-1.5 px-2.5 py-1 text-[var(--ui-muted)] text-[11px] rounded-full">
        <span class="w-1.5 h-1.5 rounded-full bg-accent-2 border border-ink"></span>
        {{ t('dropzone.subtitle') || '100% Offline • File tidak pernah meninggalkan browser Anda' }}
      </div>
    </div>
  </div>
</template>
