<script setup>
import { computed } from 'vue';
import { activeToolId, navigateTo } from '../app/router.js';
import { t } from '../app/providers/i18n.js';
import { allModules, moduleMap } from '../modules/index.js';

defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close']);

const menuSections = [
  {
    titleKey: 'tools.section.layout',
    defaultTitle: 'Tata Letak Dokumen',
    toolIds: ['merge', 'split', 'organize', 'page-numbers', 'watermark']
  },
  {
    titleKey: 'tools.section.optimize',
    defaultTitle: 'Optimasi & Teks',
    toolIds: ['compress', 'ocr', 'extract-text', 'form']
  },
  {
    titleKey: 'tools.section.conversion',
    defaultTitle: 'Konversi Media',
    toolIds: ['image-to-pdf', 'pdf-to-image']
  },
  {
    titleKey: 'tools.section.security',
    defaultTitle: 'Keamanan Dokumen',
    toolIds: ['sign', 'redact']
  }
];
menuSections.find(s => s.titleKey === 'tools.section.security')?.toolIds.push('unlock');
menuSections.find(s => s.titleKey === 'tools.section.security')?.toolIds.push('protect');
menuSections.find(s => s.titleKey === 'tools.section.conversion')?.toolIds.push('pdf-to-markdown');
menuSections.find(s => s.titleKey === 'tools.section.conversion')?.toolIds.push('scan-to-pdf');
menuSections.find(s => s.titleKey === 'tools.section.conversion')?.toolIds.push('html-to-pdf');
menuSections.find(s => s.titleKey === 'tools.section.conversion')?.toolIds.push('pdf-to-word');
menuSections.find(s => s.titleKey === 'tools.section.conversion')?.toolIds.push('pdf-to-powerpoint');
menuSections.find(s => s.titleKey === 'tools.section.conversion')?.toolIds.push('excel-to-pdf');
menuSections.find(s => s.titleKey === 'tools.section.conversion')?.toolIds.push('word-to-pdf');
menuSections.find(s => s.titleKey === 'tools.section.layout')?.toolIds.push('edit-pdf');

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
      class="fixed inset-y-0 left-0 z-50 w-72 bg-paper border-r-2 border-ink flex flex-col transition-transform duration-200 lg:static lg:translate-x-0 h-full max-h-full select-none shadow-hard lg:shadow-none overflow-hidden"
      :class="isOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <!-- Mobile Close Header -->
      <div class="shrink-0 p-4 border-b-2 border-ink flex items-center justify-between lg:hidden bg-paper-dark">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-accent border border-ink"></span>
          <span class="font-display font-extrabold text-base text-ink uppercase tracking-tight">Menu Alat</span>
        </div>
        <button
          class="w-8 h-8 border-2 border-ink bg-paper rounded-sm flex items-center justify-center font-black text-lg leading-none shadow-hard-sm hover:bg-accent active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
          @click="$emit('close')"
          aria-label="Tutup menu"
        >
          &times;
        </button>
      </div>

      <!-- Navigation List (Only this element scrolls, overscroll-contain prevents parent/sibling scroll) -->
      <nav class="flex-1 overflow-y-auto overscroll-contain p-3 space-y-4">
        <div v-for="section in menuSections" :key="section.defaultTitle" class="space-y-1">
          <!-- Section category title -->
          <div class="text-[10px] font-extrabold uppercase tracking-widest text-ink/50 px-2.5 pt-1 pb-0.5 flex items-center gap-1.5">
            <span>{{ t(section.titleKey) || section.defaultTitle }}</span>
            <div class="flex-1 border-t border-ink/20"></div>
          </div>

          <!-- Menu items in this category -->
          <div class="space-y-1">
            <template v-for="toolId in section.toolIds" :key="toolId">
              <button
                v-if="moduleMap.get(toolId)"
                class="w-full px-2.5 py-2 text-left font-semibold text-xs md:text-sm rounded-sm border-2 transition-all duration-150 flex items-center gap-2.5 cursor-pointer group"
                :class="activeToolId === toolId
                  ? 'bg-accent text-black border-ink shadow-hard translate-x-1 font-bold'
                  : 'border-transparent text-ink/80 hover:border-ink hover:bg-neutral-100 dark:hover:bg-neutral-700/60 hover:text-ink hover:shadow-hard-sm hover:-translate-y-0.5 hover:translate-x-0.5'"
                @click="selectTool(toolId)"
              >
                <!-- Menu Icon in Brutalist Accent Box -->
                <span
                  class="w-7 h-7 md:w-8 md:h-8 rounded-sm border flex items-center justify-center shrink-0 transition-all duration-150"
                  :class="activeToolId === toolId
                    ? 'bg-ink text-accent border-ink shadow-[1px_1px_0_0_#000000]'
                    : 'bg-paper-dark dark:bg-neutral-700 border-ink/30 text-ink/70 group-hover:bg-white group-hover:text-black group-hover:border-ink group-hover:shadow-[1.5px_1.5px_0_0_#000000] group-hover:-translate-y-0.5'"
                  v-html="moduleMap.get(toolId).icon"
                />
                <span class="truncate flex-1 tracking-tight">{{ t(moduleMap.get(toolId).titleKey) }}</span>
                <!-- Active pill bar -->
                <span
                  v-if="activeToolId === toolId"
                  class="w-1.5 h-3.5 bg-ink rounded-xs shrink-0"
                />
              </button>
            </template>
          </div>
        </div>
      </nav>

      <!-- Sidebar Footer Card (Brutalism Pro/Security Card) -->
      <div class="p-3 border-t-2 border-ink bg-paper">
        <div class="border-2 border-ink bg-paper-dark dark:bg-neutral-700/50 rounded-sm p-3 shadow-hard-sm hover:shadow-hard hover:-translate-y-0.5 transition-all duration-150">
          <div class="flex items-center gap-2 mb-1">
            <span class="w-2.5 h-2.5 rounded-full bg-accent-2 border border-ink animate-pulse"></span>
            <span class="text-[11px] font-extrabold uppercase tracking-wider text-ink">Zero-Network</span>
          </div>
          <p class="text-[10px] text-ink/70 leading-snug">
            100% Lokal di peramban Anda. Bebas pelacak & tanpa server.
          </p>
        </div>
      </div>
    </aside>
  </div>
</template>
