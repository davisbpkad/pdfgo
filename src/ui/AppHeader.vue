<script setup>
import { theme, toggleTheme } from '../app/providers/theme.js';
import { currentLang, toggleLang, t } from '../app/providers/i18n.js';
import { queueState, toggleQueueDrawer } from '../app/providers/queue.js';
import BaseBadge from './BaseBadge.vue';
import logoUrl from '../assets/favicon.png';

defineEmits(['toggle-sidebar']);
</script>

<template>
  <header class="border-b-2 border-ink bg-paper sticky top-0 z-40 px-4 py-2.5 md:py-3 flex items-center justify-between select-none">
    <!-- Brand / Logo -->
    <div class="flex items-center gap-3">
      <!-- Mobile sidebar toggle -->
      <button
        class="lg:hidden w-9 h-9 border-2 border-ink bg-paper flex items-center justify-center rounded-sm shadow-hard-sm hover:shadow-hard hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_0_#000000] cursor-pointer transition-all duration-150"
        @click="$emit('toggle-sidebar')"
        aria-label="Toggle menu"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <div class="flex items-center gap-2.5">
        <!-- Logo framed in Brutalist accent box -->
        <div class="w-9 h-9 md:w-10 md:h-10 border-2 border-ink bg-accent rounded-sm flex items-center justify-center shadow-hard-sm hover:shadow-hard hover:-translate-y-0.5 transition-all duration-150 shrink-0">
          <img
            :src="logoUrl"
            alt="PDF To Go Logo"
            class="h-6 md:h-7 w-6 md:w-7 object-contain select-none shrink-0"
          />
        </div>
        <span class="font-display font-extrabold text-xl md:text-2xl tracking-tight text-ink uppercase">
          PDF To Go
        </span>
        <!-- Brutalism accent badge -->
        <span class="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 border border-ink bg-accent text-ink text-xs font-bold uppercase rounded-sm shadow-[1.5px_1.5px_0_0_#000000]">
          <span class="w-2 h-2 rounded-full bg-accent-2 border border-ink animate-pulse"></span>
          100% Offline
        </span>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-2 md:gap-3">
      <!-- Queue Button with Brutalism badge -->
      <button
        class="relative border-2 border-ink bg-paper px-3 py-1.5 md:py-2 font-bold text-xs uppercase tracking-wider flex items-center gap-2 rounded-sm shadow-hard-sm hover:shadow-hard hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_0_#000000] cursor-pointer transition-all duration-150"
        @click="toggleQueueDrawer"
        title="Buka antrean berkas"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        <span class="hidden sm:inline">{{ t('queue.title') || 'Antrean' }}</span>
        <!-- Number badge -->
        <div
          v-if="queueState.count > 0"
          class="absolute -top-1.5 -end-1.5 min-w-[20px] px-1 h-5 flex items-center justify-center rounded-sm text-[10px] font-extrabold bg-danger text-ink border border-ink shadow-[1.5px_1.5px_0_0_#000000] pointer-events-none"
        >
          {{ queueState.count }}
        </div>
      </button>

      <!-- Language Toggle -->
      <button
        class="border-2 border-ink bg-paper px-2.5 md:px-3 py-1.5 md:py-2 font-bold text-xs uppercase tracking-wider rounded-sm shadow-hard-sm hover:shadow-hard hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_0_#000000] cursor-pointer transition-all duration-150 flex items-center gap-1.5"
        @click="toggleLang"
        title="Ganti Bahasa (ID / EN)"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <span>{{ currentLang.toUpperCase() }}</span>
      </button>

      <!-- Theme Toggle -->
      <button
        class="w-9 h-9 md:w-10 md:h-10 border-2 border-ink bg-paper flex items-center justify-center rounded-sm shadow-hard-sm hover:shadow-hard hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_0_#000000] cursor-pointer transition-all duration-150"
        @click="toggleTheme"
        title="Ganti Mode Terang / Gelap"
        aria-label="Toggle theme"
      >
        <svg v-if="theme === 'dark'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
        <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      </button>
    </div>
  </header>
</template>
