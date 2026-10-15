<script setup>
import { t } from '../../../app/providers/i18n.js';
import BaseButton from '../../../ui/BaseButton.vue';
import BaseCard from '../../../ui/BaseCard.vue';

const props = defineProps({
  objects: { type: Array, default: () => [] },
  selectedObject: { type: Object, default: null },
  canUndo: { type: Boolean, default: false },
  canRedo: { type: Boolean, default: false }
});

const emit = defineEmits(['select', 'update', 'remove', 'undo', 'redo']);

function updateField(field, value) {
  if (!props.selectedObject) return;
  emit('update', { ...props.selectedObject, [field]: value });
}
</script>

<template>
  <BaseCard class="p-4 space-y-4 border-2 border-ink bg-paper shadow-hard">
    <div class="flex items-center justify-between border-b-2 border-ink pb-2">
      <h3 class="text-xs font-bold uppercase text-ink">{{ t('tools.editPdf.panelTitle') }} ({{ objects.length }})</h3>
      <div class="flex items-center gap-1">
        <BaseButton variant="secondary" :disabled="!canUndo" class="text-[10px] px-2 py-1" @click="$emit('undo')">↶</BaseButton>
        <BaseButton variant="secondary" :disabled="!canRedo" class="text-[10px] px-2 py-1" @click="$emit('redo')">↷</BaseButton>
      </div>
    </div>

    <!-- Selected object properties -->
    <div v-if="selectedObject" class="space-y-3 bg-paper-dark/30 p-3 border border-ink text-xs">
      <div class="flex items-center justify-between">
        <span class="font-bold uppercase text-ink">{{ selectedObject.type }}</span>
        <button type="button" class="text-xs text-red-600 font-bold hover:underline" @click="$emit('remove', selectedObject.id)">
          🗑️ {{ t('tools.editPdf.removeBtn') }}
        </button>
      </div>

      <!-- Text Edit -->
      <div v-if="selectedObject.type === 'text'" class="space-y-1">
        <label class="block font-medium text-ink/80">{{ t('tools.editPdf.textLabel') }}</label>
        <input
          :value="selectedObject.text"
          type="text"
          class="w-full px-2 py-1 border border-ink bg-white font-bold text-xs"
          @input="updateField('text', $event.target.value)"
        />
      </div>

      <!-- Position & Size Inputs (Percentages) -->
      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-[10px] text-ink/70">Posisi X (%)</label>
          <input
            :value="Math.round(selectedObject.x * 100)"
            type="number" min="0" max="100"
            class="w-full px-1.5 py-1 border border-ink bg-white text-xs"
            @change="updateField('x', Number($event.target.value) / 100)"
          />
        </div>
        <div>
          <label class="block text-[10px] text-ink/70">Posisi Y (%)</label>
          <input
            :value="Math.round(selectedObject.y * 100)"
            type="number" min="0" max="100"
            class="w-full px-1.5 py-1 border border-ink bg-white text-xs"
            @change="updateField('y', Number($event.target.value) / 100)"
          />
        </div>
        <div>
          <label class="block text-[10px] text-ink/70">Lebar (%)</label>
          <input
            :value="Math.round(selectedObject.width * 100)"
            type="number" min="1" max="100"
            class="w-full px-1.5 py-1 border border-ink bg-white text-xs"
            @change="updateField('width', Number($event.target.value) / 100)"
          />
        </div>
        <div>
          <label class="block text-[10px] text-ink/70">Tinggi (%)</label>
          <input
            :value="Math.round(selectedObject.height * 100)"
            type="number" min="1" max="100"
            class="w-full px-1.5 py-1 border border-ink bg-white text-xs"
            @change="updateField('height', Number($event.target.value) / 100)"
          />
        </div>
      </div>
    </div>

    <!-- Empty state when no object selected -->
    <div v-else class="text-xs text-ink/70 py-2 text-center italic">
      {{ t('tools.editPdf.noSelection') }}
    </div>

    <!-- Honest disclaimer card -->
    <div class="p-2.5 border border-ink bg-paper-dark/60 text-[11px] text-ink/80 font-medium rounded-xs leading-relaxed">
      ℹ️ {{ t('tools.editPdf.disclaimer') }}
    </div>
  </BaseCard>
</template>
