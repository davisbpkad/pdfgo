<script setup>
import { ref, watch } from 'vue';
import { activeToolId, navigateTo } from '../app/router.js';
import { t } from '../app/providers/i18n.js';
import { moduleMap } from '../features/registry.js';

defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close']);

const menuSections = [
  {
    id: 'layout',
    titleKey: 'tools.section.layout',
    defaultTitle: 'Tata Letak Dokumen',
    toolIds: ['merge', 'split', 'organize', 'page-numbers', 'watermark', 'edit-pdf']
  },
  {
    id: 'optimize',
    titleKey: 'tools.section.optimize',
    defaultTitle: 'Optimasi & Teks',
    toolIds: ['compress', 'ocr', 'extract-text', 'form']
  },
  {
    id: 'conversion',
    titleKey: 'tools.section.conversion',
    defaultTitle: 'Konversi Media',
    toolIds: ['image-to-pdf', 'scan-to-pdf', 'html-to-pdf', 'word-to-pdf', 'excel-to-pdf', 'powerpoint-to-pdf',
      'pdf-to-image', 'pdf-to-word', 'pdf-to-excel', 'pdf-to-powerpoint', 'pdf-to-markdown']
  },
  {
    id: 'security',
    titleKey: 'tools.section.security',
    defaultTitle: 'Keamanan Dokumen',
    toolIds: ['sign', 'redact', 'unlock', 'protect']
  }
];
const expanded = ref(Object.fromEntries(menuSections.map(section => [section.id, false])));
watch(activeToolId, id => {
  const section = menuSections.find(section => section.toolIds.includes(id));
  if (section) expanded.value[section.id] = true;
});

function selectTool(id) {
  navigateTo(id);
  emit('close');
}
</script>

<template>
  <div class="h-full shrink-0 flex flex-col">
    <!-- Backdrop for mobile -->
    <div
      v-if="isOpen"
      class="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-40 lg:hidden transition-opacity"
      @click="$emit('close')"
    />

    <!-- Sidebar Container (Bounded to full height, flex-col, overflow-hidden) -->
    <aside
      class="pdfgo-sidebar fixed inset-y-0 left-0 z-50 w-64 bg-paper border-r border-[var(--ui-border)] flex flex-col transition-transform duration-200 lg:static lg:translate-x-0 h-full max-h-full select-none overflow-hidden"
      aria-label="PDF tools"
      :class="isOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <!-- Mobile Close Header -->
      <div class="shrink-0 px-4 py-3 border-b border-[var(--ui-border)] flex items-center justify-between lg:hidden bg-paper">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-[var(--ui-primary)]"></span>
          <span class="font-display font-semibold text-sm text-ink tracking-tight">{{ t('app.sidebarMenu') }}</span>
        </div>
        <button
          class="w-8 h-8 border border-[var(--ui-border)] bg-paper rounded-md flex items-center justify-center text-ink hover:bg-accent cursor-pointer transition-colors"
          @click="$emit('close')"
          :aria-label="t('common.closeMenu')"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <!-- Navigation List (Only this element scrolls, overscroll-contain prevents parent/sibling scroll) -->
      <nav class="flex-1 overflow-y-auto overscroll-contain p-3 space-y-4">
        <div v-for="section in menuSections" :key="section.defaultTitle" class="space-y-1">
          <!-- Section category title -->
          <button
            type="button"
            class="w-full text-left text-xs font-semibold px-3 py-2.5 rounded-lg border flex items-center gap-2 transition-colors"
            :class="section.toolIds.includes(activeToolId) ? 'border-blue-600 bg-accent text-ink' : 'border-transparent text-[var(--ui-muted)] hover:bg-accent'"
            :aria-expanded="expanded[section.id]"
            :aria-controls="`sidebar-${section.id}`"
            @click="expanded[section.id] = !expanded[section.id]"
          >
            <span class="flex-1">{{ t(section.titleKey) || section.defaultTitle }}</span>
            <svg class="w-4 h-4 transition-transform" :class="expanded[section.id] ? '' : '-rotate-90'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
          </button>

          <!-- Menu items in this category -->
          <div class="grid transition-[grid-template-rows,opacity] duration-300 ease-in-out motion-reduce:transition-none"
            :class="expanded[section.id] ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'"
            :inert="!expanded[section.id]" :aria-hidden="!expanded[section.id]">
          <div :id="`sidebar-${section.id}`" class="min-h-0 overflow-hidden">
          <div class="space-y-1 ml-4 pl-2 border-l border-[var(--ui-border)]">
            <template v-for="toolId in section.toolIds" :key="toolId">
              <button
                v-if="moduleMap.get(toolId)"
                :data-tool-id="toolId"
                class="w-full px-3 py-2 text-left font-medium text-xs rounded-md transition-colors duration-150 flex items-center gap-2.5 cursor-pointer group"
                :aria-current="activeToolId === toolId ? 'page' : undefined"
                :class="activeToolId === toolId
                  ? 'bg-[var(--ui-primary)] text-white'
                  : 'text-[var(--ui-muted)] hover:bg-accent hover:text-ink'"
                @click="selectTool(toolId)"
              >
                <!-- Menu Icon -->
                <span
                  aria-hidden="true"
                  class="w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-colors [&_svg]:w-3.5 [&_svg]:h-3.5"
                  :class="activeToolId === toolId
                    ? 'bg-white/15 text-white'
                    : 'bg-accent text-[var(--ui-primary)] group-hover:bg-[var(--ui-primary)]/15'"
                  v-html="moduleMap.get(toolId).icon"
                />
                <span class="truncate flex-1 tracking-tight">{{ t(moduleMap.get(toolId).titleKey) }}</span>
                <!-- Active pill bar -->
                <span
                  v-if="activeToolId === toolId"
                  class="w-1 h-1 bg-white rounded-full shrink-0"
                />
              </button>
            </template>
          </div>
          </div>
          </div>
        </div>
      </nav>

      <!-- Sidebar Footer Card (Brutalism Pro/Security Card) -->
      <div class="p-3 border-t-2 border-ink bg-paper">
        <div class="rounded-lg p-2">
          <div class="flex items-center gap-2 mb-1">
            <span class="w-2.5 h-2.5 rounded-full bg-accent-2 border border-ink animate-pulse"></span>
            <span class="text-[11px] font-semibold text-ink">{{ t('app.sidebarNote') }}</span>
          </div>
        </div>
      </div>
    </aside>
  </div>
</template>
