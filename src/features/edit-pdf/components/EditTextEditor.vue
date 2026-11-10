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
    :aria-label="edit.text || t('tools.editPdf.textAria')"
    :style="{
      left: `${edit.x * 100}%`,
      top: `${edit.y * 100}%`,
      width: `${edit.width * 100}%`,
      height: isChanged ? 'auto' : `${edit.height * 100}%`,
      fieldSizing: 'content',
      fontSize: `${Math.max(6, edit.fontSize * scale)}px`,
      minHeight: `${Math.max(12, edit.fontSize * scale * 1.3)}px`,
      lineHeight: 1.25
    }"
    :class="[
      'absolute p-0 px-0.5 m-0 resize-none overflow-hidden whitespace-pre-wrap border border-dashed outline-none caret-black pointer-events-auto focus:bg-white focus:text-black',
      edit.isBold ? 'font-bold' : 'font-normal',
      isChanged
        ? 'border-blue-600 bg-white text-black z-30'
        : 'bg-transparent text-transparent border-transparent hover:border-accent focus:border-ink z-20'
    ]"
    @input="emit('update-text', $event.target.value)"
    @focus="emit('start-edit')"
  />
</template>
