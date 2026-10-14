<script setup>
import BaseButton from '../../../ui/BaseButton.vue';

defineProps({
  searchTerm: { type: String, default: '' },
  pageBoxCount: { type: Number, default: 0 },
  totalBoxCount: { type: Number, default: 0 },
  sanitizeMetadata: { type: Boolean, default: true },
  isProcessing: { type: Boolean, default: false },
  canUndo: { type: Boolean, default: false },
  canRedo: { type: Boolean, default: false }
});

defineEmits([
  'update:searchTerm',
  'update:sanitizeMetadata',
  'search',
  'clear-page',
  'undo',
  'redo',
  'inspect-preview',
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

    <!-- History (Undo / Redo) and Clear Row -->
    <div class="flex items-center gap-2">
      <button
        type="button"
        :disabled="!canUndo || isProcessing"
        class="flex-1 py-1.5 px-2 text-xs font-bold border-2 border-ink bg-paper hover:bg-paper-dark shadow-hard-sm disabled:opacity-40 cursor-pointer flex items-center justify-center gap-1"
        title="Urungkan perubahan (Ctrl+Z)"
        @click="$emit('undo')"
      >
        ↩ Urungkan
      </button>
      <button
        type="button"
        :disabled="!canRedo || isProcessing"
        class="flex-1 py-1.5 px-2 text-xs font-bold border-2 border-ink bg-paper hover:bg-paper-dark shadow-hard-sm disabled:opacity-40 cursor-pointer flex items-center justify-center gap-1"
        title="Ulangi perubahan (Ctrl+Shift+Z)"
        @click="$emit('redo')"
      >
        ↪ Ulangi
      </button>
    </div>

    <!-- Inspect Preview Button -->
    <button
      type="button"
      :disabled="totalBoxCount === 0 || isProcessing"
      class="w-full py-2 px-3 text-xs font-bold border-2 border-ink bg-amber-100 hover:bg-amber-200 text-ink shadow-hard-sm disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2"
      @click="$emit('inspect-preview')"
    >
      <span>👁️</span>
      <span>Periksa Hasil Sensor (Resolusi Tinggi)</span>
    </button>

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
