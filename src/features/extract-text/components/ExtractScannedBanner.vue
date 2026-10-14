<script setup>
import BaseButton from '../../../ui/BaseButton.vue';

defineProps({
  isScanned: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['open-ocr']);
</script>

<template>
  <div
    v-if="isScanned"
    class="border-3 border-ink bg-accent/30 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-hard-sm"
  >
    <div class="space-y-0.5">
      <div class="flex items-center gap-2 font-display font-black text-sm text-ink uppercase">
        <span>⚠️</span>
        <span>Dokumen Terdeteksi Sebagai Hasil Scan / Gambar</span>
      </div>
      <p class="text-xs font-medium text-ink/80">
        Teks yang diekstrak sangat sedikit. Gunakan alat Pengenalan Teks (OCR) untuk membaca teks dari gambar.
      </p>
    </div>

    <BaseButton
      variant="secondary"
      class="text-xs py-1.5 px-3 whitespace-nowrap"
      @click="emit('open-ocr')"
    >
      Buka OCR Scanner ➔
    </BaseButton>
  </div>
</template>
