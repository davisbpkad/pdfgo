<script setup>
import BaseButton from '../../../ui/BaseButton.vue';

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
        ↶ Urungkan
      </BaseButton>

      <BaseButton
        variant="secondary"
        class="py-1 px-3 text-xs"
        :disabled="!canRedo"
        @click="emit('redo')"
      >
        ↷ Ulangi
      </BaseButton>

      <BaseButton
        variant="secondary"
        class="py-1 px-3 text-xs"
        @click="emit('rotate-all')"
      >
        ↻ Putar Semua
      </BaseButton>

      <BaseButton
        variant="secondary"
        class="py-1 px-3 text-xs"
        @click="emit('select-all')"
      >
        {{ selectedCount === totalCount && totalCount > 0 ? 'Batal Pilih' : 'Pilih Semua' }}
      </BaseButton>

      <BaseButton
        v-if="selectedCount > 0"
        variant="danger"
        class="py-1 px-3 text-xs"
        @click="emit('delete-selected')"
      >
        🗑 Hapus ({{ selectedCount }})
      </BaseButton>
    </div>

    <!-- Right actions: Change file & Save -->
    <div class="flex items-center gap-2">
      <BaseButton
        variant="secondary"
        class="py-1 px-3 text-xs"
        @click="emit('reset-file')"
      >
        📁 Ganti File
      </BaseButton>

      <BaseButton
        variant="primary"
        class="py-1 px-4 text-xs font-bold"
        :disabled="isSaving || totalCount === 0"
        :loading="isSaving"
        @click="emit('save')"
      >
        Simpan Dokumen ({{ totalCount }})
      </BaseButton>
    </div>
  </div>
</template>
