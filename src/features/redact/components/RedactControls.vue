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
  <div class="space-y-4 select-none">
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
          class="flex-1 text-xs font-medium p-2.5 border-2 border-ink bg-paper text-ink rounded-sm shadow-hard-sm focus:outline-none focus:shadow-hard focus:-translate-y-0.5 transition-all duration-150"
          @input="$emit('update:searchTerm', $event.target.value)"
          @keyup.enter="$emit('search')"
        />
        <button
          type="button"
          class="px-3.5 py-2.5 text-xs font-bold border-2 border-ink bg-accent hover:bg-accent-strong text-black rounded-sm shadow-hard-sm hover:shadow-hard hover:-translate-y-0.5 active:translate-y-0.5 cursor-pointer whitespace-nowrap transition-all duration-150"
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
        class="flex-1 py-2 px-2 text-xs font-bold border-2 border-ink bg-paper hover:bg-neutral-100 dark:hover:bg-neutral-700 text-ink rounded-sm shadow-hard-sm hover:shadow-hard hover:-translate-y-0.5 active:translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none cursor-pointer flex items-center justify-center gap-1 transition-all duration-150"
        title="Urungkan perubahan (Ctrl+Z)"
        @click="$emit('undo')"
      >
        ↩ Urungkan
      </button>
      <button
        type="button"
        :disabled="!canRedo || isProcessing"
        class="flex-1 py-2 px-2 text-xs font-bold border-2 border-ink bg-paper hover:bg-neutral-100 dark:hover:bg-neutral-700 text-ink rounded-sm shadow-hard-sm hover:shadow-hard hover:-translate-y-0.5 active:translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none cursor-pointer flex items-center justify-center gap-1 transition-all duration-150"
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
      class="w-full py-2.5 px-3 text-xs font-bold border-2 border-ink bg-warning text-black rounded-sm shadow-hard-sm hover:shadow-hard hover:-translate-y-0.5 active:translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none cursor-pointer flex items-center justify-center gap-2 transition-all duration-150"
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
        class="w-4 h-4 border-2 border-ink rounded-xs accent-accent cursor-pointer"
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
