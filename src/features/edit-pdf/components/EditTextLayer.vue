<script setup>
import EditTextEditor from './EditTextEditor.vue';
import { isChanged } from '../logic/textEditInteractions.js';

defineProps({
  edits: { type: Array, default: () => [] },
  scale: { type: Number, default: 1 }
});

const emit = defineEmits(['update-text', 'start-edit']);
</script>

<template>
  <div class="absolute inset-0 pointer-events-none">
    <EditTextEditor
      v-for="edit in edits"
      :key="edit.id"
      :edit="edit"
      :scale="scale"
      :is-changed="isChanged(edit)"
      @update-text="(value) => emit('update-text', edit.id, value)"
      @start-edit="emit('start-edit')"
    />
  </div>
</template>
