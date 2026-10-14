<script setup>
import { activeToolId, navigateTo } from '../app/router.js';
import { t } from '../app/providers/i18n.js';
import { allModules } from '../modules/index.js';

defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close']);

function selectTool(id) {
  navigateTo(id);
  emit('close');
}
</script>

<template>
  <div>
    <!-- Backdrop for mobile -->
    <div
      v-if="isOpen"
      class="fixed inset-0 bg-black/50 z-40 lg:hidden"
      @click="$emit('close')"
    />

    <!-- Sidebar Container -->
    <aside
      class="fixed inset-y-0 left-0 z-50 w-72 bg-paper border-r-3 border-ink flex flex-col transition-transform duration-200 lg:static lg:translate-x-0"
      :class="isOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <!-- Mobile Close Header -->
      <div class="p-4 border-b-3 border-ink flex items-center justify-between lg:hidden">
        <span class="font-display font-black text-lg text-ink uppercase">Pilih Alat</span>
        <button
          class="border-2 border-ink p-1 font-black leading-none hover:bg-accent cursor-pointer"
          @click="$emit('close')"
          aria-label="Tutup menu"
        >
          &times;
        </button>
      </div>

      <!-- Navigation List -->
      <nav class="flex-1 overflow-y-auto p-3 space-y-1">
        <button
          v-for="tool in allModules"
          :key="tool.id"
          class="w-full px-3 py-2.5 text-left font-bold text-sm border-2 border-transparent transition-all flex items-center gap-3 cursor-pointer"
          :class="activeToolId === tool.id
            ? 'bg-accent text-ink border-ink shadow-hard-sm'
            : 'text-ink/80 hover:bg-black/5 dark:hover:bg-white/5 hover:border-ink/20'"
          @click="selectTool(tool.id)"
        >
          <span class="w-6 h-6 flex items-center justify-center shrink-0" v-html="tool.icon" />
          <span class="truncate">{{ t(tool.titleKey) }}</span>
        </button>
      </nav>

      <!-- Sidebar Footer Note -->
      <div class="p-3 border-t-3 border-ink text-[11px] font-bold text-ink/60 text-center">
        Zero-Network • Local Only
      </div>
    </aside>
  </div>
</template>
