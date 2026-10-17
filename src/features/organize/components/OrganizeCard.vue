<script setup>
import { t } from '../../../app/providers/i18n.js';

defineProps({
  page: {
    type: Object,
    required: true
  },
  index: {
    type: Number,
    required: true
  }
});

const emit = defineEmits(['rotate', 'delete', 'toggle-select', 'drag-start', 'drop-page']);

function onDragStart(e, idx) {
  e.dataTransfer.effectAllowed = 'move';
  emit('drag-start', idx);
}

function onDrop(e, idx) {
  e.preventDefault();
  emit('drop-page', idx);
}
</script>

<template>
  <div
    class="relative group border-3 border-ink bg-paper p-2 flex flex-col items-center justify-between transition-all select-none"
    :class="page.isSelected ? 'ring-3 ring-accent shadow-hard' : 'shadow-hard-sm hover:shadow-hard'"
    draggable="true"
    @dragstart="onDragStart($event, index)"
    @dragover.prevent
    @drop="onDrop($event, index)"
  >
    <!-- Badge Page Number -->
    <div class="w-full flex items-center justify-between mb-2">
      <span class="bg-ink text-paper font-display font-black text-xs px-2 py-0.5">
        {{ index + 1 }}
      </span>

      <!-- Select Checkbox -->
      <input
        type="checkbox"
        :checked="page.isSelected"
        class="w-4 h-4 accent-ink cursor-pointer border-2 border-ink"
        @change="emit('toggle-select', index)"
      />
    </div>

    <!-- Thumbnail Container -->
    <div class="w-full h-40 flex items-center justify-center overflow-hidden bg-paper-dark border-2 border-ink/20">
      <img
        v-if="page.thumbUrl"
        :src="page.thumbUrl"
        :alt="t('tools.organize.pageCardLabel', { num: index + 1 })"
        class="max-h-full max-w-full object-contain transition-transform duration-200"
        :style="{ transform: `rotate(${page.rotation}deg)` }"
      />
      <span v-else class="text-xs font-bold text-ink/40">{{ t('common.loadingThumb') }}</span>
    </div>

    <!-- Actions Footer -->
    <div class="w-full flex items-center justify-between mt-2 pt-2 border-t-2 border-ink/10 gap-1">
      <button
        type="button"
        class="p-1.5 border-2 border-ink bg-paper hover:bg-accent text-xs font-bold cursor-pointer transition-colors"
        :title="t('tools.organize.rotatePage')"
        @click="emit('rotate', index)"
      >
        ↻ 90°
      </button>

      <button
        type="button"
        class="p-1.5 border-2 border-ink bg-paper hover:bg-danger hover:text-white text-xs font-bold cursor-pointer transition-colors"
        :title="t('tools.organize.deletePage')"
        @click="emit('delete', index)"
      >
        🗑
      </button>
    </div>
  </div>
</template>
