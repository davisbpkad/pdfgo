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
        🗑 {{ t('tools.organize.deleteSelected') }} ({{ selectedCount }})
      </BaseButton>
    </div>

    <!-- Right actions: Change file & Save -->
    <div class="flex items-center gap-2">
      <BaseButton
        variant="secondary"
        class="py-1 px-3 text-xs"
        @click="emit('reset-file')"
      >
        📁 {{ t('tools.organize.changeFile') }}
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
