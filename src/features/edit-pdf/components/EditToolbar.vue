<script setup>
import { t } from '../../../app/providers/i18n.js';
import BaseButton from '../../../ui/BaseButton.vue';

const props = defineProps({
  isDrawMode: { type: Boolean, default: false }
});

const emit = defineEmits(['add-object', 'toggle-draw-mode', 'upload-image']);

function handleImageInput(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => emit('upload-image', reader.result);
  reader.readAsDataURL(file);
  e.target.value = '';
}
</script>

<template>
  <div class="p-3 border-2 border-ink bg-paper shadow-hard flex items-center gap-2 flex-wrap">
    <span class="text-xs font-bold uppercase text-ink mr-1">{{ t('tools.editPdf.addLabel') }}:</span>

    <BaseButton variant="secondary" class="text-xs font-bold px-2.5 py-1.5" @click="$emit('add-object', 'text')">
      ✍️ {{ t('tools.editPdf.btnText') }}
    </BaseButton>

    <BaseButton variant="secondary" class="text-xs font-bold px-2.5 py-1.5" @click="$emit('add-object', 'whiteout')">
      ⬜ {{ t('tools.editPdf.btnWhiteout') }}
    </BaseButton>

    <BaseButton variant="secondary" class="text-xs font-bold px-2.5 py-1.5" @click="$emit('add-object', 'rect')">
      ▭ {{ t('tools.editPdf.btnRect') }}
    </BaseButton>

    <BaseButton variant="secondary" class="text-xs font-bold px-2.5 py-1.5" @click="$emit('add-object', 'ellipse')">
      ⭘ {{ t('tools.editPdf.btnEllipse') }}
    </BaseButton>

    <BaseButton variant="secondary" class="text-xs font-bold px-2.5 py-1.5" @click="$emit('add-object', 'line')">
      ― {{ t('tools.editPdf.btnLine') }}
    </BaseButton>

    <BaseButton
      :variant="isDrawMode ? 'primary' : 'secondary'"
      class="text-xs font-bold px-2.5 py-1.5"
      @click="$emit('toggle-draw-mode')"
    >
      ✏️ {{ t('tools.editPdf.btnDraw') }}
    </BaseButton>

    <label class="px-2.5 py-1.5 border-2 border-ink bg-paper hover:bg-paper-dark shadow-hard-xs text-xs font-bold cursor-pointer transition-colors inline-flex items-center gap-1">
      <span>🖼️ {{ t('tools.editPdf.btnImage') }}</span>
      <input type="file" accept="image/png,image/jpeg" class="sr-only" @change="handleImageInput" />
    </label>
  </div>
</template>
