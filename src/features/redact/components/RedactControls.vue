<script setup>
import BaseButton from '../../../ui/BaseButton.vue';

defineProps({
  searchTerm: { type: String, default: '' },
  pageBoxCount: { type: Number, default: 0 },
  totalBoxCount: { type: Number, default: 0 },
  sanitizeMetadata: { type: Boolean, default: true },
  isProcessing: { type: Boolean, default: false }
});

defineEmits([
  'update:searchTerm',
  'update:sanitizeMetadata',
  'search',
  'clear-page',
  'apply'
]);
</script>

<template>
  <div class="space-y-4">
    <!-- Keyword Auto-Redact Search -->
    <div class="space-y-1.5">
      <label class="text-xs font-bold text-ink uppercase tracking-wider block">
        Cari & Tandai Otomatis:
      </label>
      <div class="flex gap-2">
        <input
          :value="searchTerm"
          type="text"
          placeholder="Ketik kata kunci sensor..."
          class="flex-1 text-xs font-medium p-2 border-2 border-ink bg-paper shadow-hard-sm focus:outline-none"
          @input="$emit('update:searchTerm', $event.target.value)"
          @keyup.enter="$emit('search')"
        />
        <button
          type="button"
          class="px-3 py-2 text-xs font-bold border-2 border-ink bg-paper hover:bg-paper-dark shadow-hard-sm cursor-pointer whitespace-nowrap"
          @click="$emit('search')"
        >
          🔍 Tandai
        </button>
      </div>
    </div>

    <!-- Page Boxes Info Box -->
    <div class="border-2 border-ink bg-paper p-3 shadow-hard-sm space-y-2">
      <div class="flex items-center justify-between">
        <span class="text-xs font-bold text-ink">
          Kotak Sensor: {{ pageBoxCount }} di halaman ini
        </span>
        <button
          type="button"
          :disabled="pageBoxCount === 0"
          class="text-[11px] font-bold px-2 py-1 border border-ink bg-red-100 hover:bg-red-200 text-red-800 disabled:opacity-40 cursor-pointer"
          @click="$emit('clear-page')"
        >
          Hapus Halaman Ini
        </button>
      </div>
      <p class="text-[11px] text-ink/70 leading-relaxed font-medium">
        💡 Seret kursor pada dokumen untuk membuat kotak sensor manual. Klik tanda silang (✕) pada kotak untuk menghapusnya.
      </p>
    </div>

    <!-- Metadata Sanitization Option -->
    <label class="flex items-center gap-2 text-xs font-bold text-ink cursor-pointer select-none">
      <input
        type="checkbox"
        :checked="sanitizeMetadata"
        class="w-4 h-4 border-2 border-ink rounded accent-accent cursor-pointer"
        @change="$emit('update:sanitizeMetadata', $event.target.checked)"
      />
      <span>Bersihkan Metadata Dokumen (Judul, Penulis, Pembuat)</span>
    </label>

    <!-- Save / Apply Button -->
    <BaseButton
      variant="danger"
      class="w-full py-2.5 text-xs tracking-wider"
      :disabled="totalBoxCount === 0 || isProcessing"
      @click="$emit('apply')"
    >
      {{ isProcessing ? 'Memproses Sensor...' : `🛡️ Terapkan Sensor (${totalBoxCount} Kotak)` }}
    </BaseButton>
  </div>
</template>
