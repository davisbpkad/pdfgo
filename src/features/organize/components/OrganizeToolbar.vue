<script setup>
import BaseButton from '../../../ui/BaseButton.vue';
import { t } from '../../../app/providers/i18n.js';

defineProps({
  canUndo: {
    type: Boolean,
    default: false
  },
  canRedo: {
    type: Boolean,
    default: false
  },
  selectedCount: {
    type: Number,
    default: 0
  },
  totalCount: {
    type: Number,
    default: 0
  },
  isSaving: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits([
  'undo',
  'redo',
  'rotate-all',
  'select-all',
  'delete-selected',
  'reset-file',
  'save'
]);
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-3 p-3 border-3 border-ink bg-paper shadow-hard-sm">
    <!-- Left actions: Undo, Redo, Rotate All, Selection -->
    <div class="flex flex-wrap items-center gap-2">
      <BaseButton
        variant="secondary"
        class="py-1 px-3 text-xs"
        :disabled="!canUndo"
        @click="emit('undo')"
      >
        ↶ {{ t('tools.organize.undo') }}
      </BaseButton>

      <BaseButton
        variant="secondary"
        class="py-1 px-3 text-xs"
        :disabled="!canRedo"
        @click="emit('redo')"
      >
        ↷ {{ t('tools.organize.redo') }}
      </BaseButton>

      <BaseButton
        variant="secondary"
        class="py-1 px-3 text-xs"
        @click="emit('rotate-all')"
      >
        ↻ {{ t('tools.organize.rotateAll') }}
      </BaseButton>

      <BaseButton
        variant="secondary"
        class="py-1 px-3 text-xs"
        @click="emit('select-all')"
      >
        {{ selectedCount === totalCount && totalCount > 0 ? t('tools.organize.deselectAll') : t('tools.organize.selectAll') }}
      </BaseButton>

      <BaseButton
        v-if="selectedCount > 0"
        variant="danger"
        class="py-1 px-3 text-xs"
        @click="emit('delete-selected')"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        {{ t('tools.organize.deleteSelected') }} ({{ selectedCount }})
      </BaseButton>
    </div>

    <!-- Right actions: Change file & Save -->
    <div class="flex items-center gap-2">
      <BaseButton
        variant="secondary"
        class="py-1 px-3 text-xs"
        @click="emit('reset-file')"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
        {{ t('tools.organize.changeFile') }}
      </BaseButton>

      <BaseButton
        variant="primary"
        class="py-1 px-4 text-xs font-bold"
        :disabled="isSaving || totalCount === 0"
        :loading="isSaving"
        @click="emit('save')"
      >
        {{ t('tools.organize.saveOrganized', { count: totalCount }) }}
      </BaseButton>
    </div>
  </div>
</template>
