<script setup>
import BaseInput from '../../../ui/BaseInput.vue';
import PageNumbersPositionMatrix from './PageNumbersPositionMatrix.vue';

defineProps({
  format: {
    type: String,
    default: 'Halaman {n} dari {total}'
  },
  position: {
    type: String,
    default: 'bottom-center'
  },
  startNumber: {
    type: Number,
    default: 1
  },
  margin: {
    type: Number,
    default: 25
  },
  fontSize: {
    type: Number,
    default: 10
  },
  colorHex: {
    type: String,
    default: '#475569'
  },
  skipFirstPage: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits([
  'update:format',
  'update:position',
  'update:startNumber',
  'update:margin',
  'update:fontSize',
  'update:colorHex',
  'update:skipFirstPage'
]);

const presets = [
  'Halaman {n} dari {total}',
  '{n} / {total}',
  '- {n} -',
  '{n}'
];
</script>

<template>
  <div class="border-3 border-ink bg-paper p-4 space-y-4 shadow-hard-sm">
    <!-- Format & Presets -->
    <div class="space-y-1.5">
      <label class="block text-xs font-black uppercase tracking-wider text-ink">
        Format Penomoran
      </label>
      <BaseInput
        :model-value="format"
        placeholder="Gunakan {n} dan {total}"
        @update:model-value="emit('update:format', $event)"
      />
      <div class="flex flex-wrap gap-1.5 pt-1">
        <button
          v-for="preset in presets"
          :key="preset"
          type="button"
          class="text-2xs font-bold px-2 py-0.5 border border-ink bg-paper-dark hover:bg-accent transition-colors cursor-pointer"
          @click="emit('update:format', preset)"
        >
          {{ preset }}
        </button>
      </div>
    </div>

    <!-- Position Matrix -->
    <div class="space-y-1.5">
      <label class="block text-xs font-black uppercase tracking-wider text-ink">
        Posisi Penomoran
      </label>
      <PageNumbersPositionMatrix
        :model-value="position"
        @update:model-value="emit('update:position', $event)"
      />
    </div>

    <!-- Settings: Start Number, Margin, Color -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div class="space-y-1">
        <label class="block text-2xs font-black uppercase text-ink">
          Mulai Dari
        </label>
        <BaseInput
          type="number"
          min="1"
          :model-value="startNumber"
          @update:model-value="emit('update:startNumber', Number($event) || 1)"
        />
      </div>

      <div class="space-y-1">
        <label class="block text-2xs font-black uppercase text-ink">
          Margin ({{ margin }}pt)
        </label>
        <input
          type="range"
          min="10"
          max="60"
          :value="margin"
          class="w-full accent-ink cursor-pointer"
          @input="emit('update:margin', Number($event.target.value))"
        />
      </div>

      <div class="space-y-1">
        <label class="block text-2xs font-black uppercase text-ink">
          Warna
        </label>
        <input
          type="color"
          :value="colorHex"
          class="w-full h-8 border-2 border-ink cursor-pointer bg-paper p-0.5"
          @input="emit('update:colorHex', $event.target.value)"
        />
      </div>
    </div>

    <!-- Skip First Page -->
    <div class="pt-1">
      <label class="inline-flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          :checked="skipFirstPage"
          class="w-4 h-4 accent-ink cursor-pointer border-2 border-ink"
          @change="emit('update:skipFirstPage', $event.target.checked)"
        />
        <span class="text-xs font-bold text-ink">Lewati halaman pertama (misal: halaman sampul/cover)</span>
      </label>
    </div>
  </div>
</template>
