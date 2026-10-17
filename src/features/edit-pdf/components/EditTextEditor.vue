<script setup>
import { t } from '../../../app/providers/i18n.js';
defineProps({
  edit: { type: Object, required: true },
  scale: { type: Number, default: 1 },
  isChanged: { type: Boolean, default: false }
});

const emit = defineEmits(['update-text', 'start-edit']);
</script>

<template>
  <textarea
    :value="edit.text"
    spellcheck="false"
    rows="1"
    ::aria-label="edit.text || t('tools.editPdf.textAria')"
    :style="{
      left: `${edit.x * 100}%`,
      top: `${edit.y * 100}%`,
      width: `${edit.width * 100}%`,
      height: `${edit.height * 100}%`,
      fontSize: `${Math.max(6, edit.fontSize * scale)}px`,
      minHeight: `${Math.max(12, edit.fontSize * scale * 1.3)}px`,
      lineHeight: 1.25
    }"
    :class="[
      'absolute p-0 px-0.5 m-0 resize-none overflow-hidden whitespace-pre-wrap bg-transparent text-black border border-dashed outline-none caret-ink pointer-events-auto',
      edit.isBold ? 'font-bold' : 'font-normal',
      isChanged
        ? 'border-ink bg-accent/25 z-30'
        : 'border-transparent hover:border-accent focus:border-ink focus:bg-white/90 z-20'
    ]"
    @input="emit('update-text', $event.target.value)"
    @focus="emit('start-edit')"
  />
</template>
