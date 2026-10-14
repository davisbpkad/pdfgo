<script setup>
import BaseInput from '../../../ui/BaseInput.vue';

defineProps({
  format: {
    type: String,
    default: 'png'
  },
  dpiScale: {
    type: Number,
    default: 2.08
  },
  quality: {
    type: Number,
    default: 85
  },
  pageRangeChoice: {
    type: String,
    default: 'all'
  },
  customRange: {
    type: String,
    default: ''
  },
  totalPages: {
    type: Number,
    default: 1
  }
});

const emit = defineEmits([
  'update:format',
  'update:dpiScale',
  'update:quality',
  'update:pageRangeChoice',
  'update:customRange'
]);
</script>

<template>
  <div class="border-3 border-ink bg-paper p-4 space-y-4 shadow-hard-sm">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <!-- Format -->
      <div class="space-y-1.5">
        <label class="block text-xs font-black uppercase tracking-wider text-ink">
          Format Gambar
        </label>
        <select
          :value="format"
          class="w-full px-3 py-2 border-2 border-ink bg-paper text-ink font-bold text-xs focus:outline-none"
          @change="emit('update:format', $event.target.value)"
        >
          <option value="png">PNG (Kualitas Paling Tajam / Lossless)</option>
          <option value="jpeg">JPEG (Ukuran Berkas Lebih Ringan)</option>
        </select>
      </div>

      <!-- DPI Resolution -->
      <div class="space-y-1.5">
        <label class="block text-xs font-black uppercase tracking-wider text-ink">
          Resolusi / Ketajaman
        </label>
        <select
          :value="dpiScale"
          class="w-full px-3 py-2 border-2 border-ink bg-paper text-ink font-bold text-xs focus:outline-none"
          @change="emit('update:dpiScale', Number($event.target.value))"
        >
          <option :value="1.0">Standar Web (~72 DPI)</option>
          <option :value="2.08">Menengah (~150 DPI - Rekomendasi)</option>
          <option :value="4.16">Tinggi / Cetak (~300 DPI)</option>
        </select>
      </div>
    </div>

    <!-- JPEG Quality (if JPEG selected) -->
    <div v-if="format === 'jpeg'" class="space-y-1.5">
      <label class="block text-xs font-black uppercase tracking-wider text-ink">
        Kualitas JPEG ({{ quality }}%)
      </label>
      <input
        type="range"
        min="50"
        max="100"
        :value="quality"
        class="w-full accent-ink cursor-pointer"
        @input="emit('update:quality', Number($event.target.value))"
      />
    </div>

    <!-- Page Range Choice -->
    <div class="space-y-1.5">
      <label class="block text-xs font-black uppercase tracking-wider text-ink">
        Halaman yang Diekstrak
      </label>
      <select
        :value="pageRangeChoice"
        class="w-full px-3 py-2 border-2 border-ink bg-paper text-ink font-bold text-xs focus:outline-none"
        @change="emit('update:pageRangeChoice', $event.target.value)"
      >
        <option value="all">Semua Halaman ({{ totalPages }} halaman)</option>
        <option value="custom">Pilih Rentang Halaman Kustom</option>
      </select>

      <div v-if="pageRangeChoice === 'custom'" class="pt-1">
        <BaseInput
          :model-value="customRange"
          placeholder="Contoh: 1-3, 5"
          @update:model-value="emit('update:customRange', $event)"
        />
      </div>
    </div>
  </div>
</template>
