<script setup>
import { theme, toggleTheme } from '../app/providers/theme.js';
import { currentLang, toggleLang, t } from '../app/providers/i18n.js';
import { queueState, toggleQueueDrawer } from '../app/providers/queue.js';
import BaseBadge from './BaseBadge.vue';
import logoUrl from '../assets/favicon.png';

defineEmits(['toggle-sidebar']);
</script>

<template>
  <header class="border-b-3 border-ink bg-paper sticky top-0 z-40 px-4 py-3 flex items-center justify-between">
    <!-- Brand / Logo -->
    <div class="flex items-center gap-3">
      <button
        class="lg:hidden p-2 border-2 border-ink bg-paper shadow-hard-sm hover:bg-accent cursor-pointer"
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
        <img
          :src="logoUrl"
          alt="PDF To Go Logo"
          class="h-8 md:h-9 w-8 md:w-9 object-contain select-none shrink-0"
        />
        <span class="font-display font-black text-xl md:text-2xl tracking-tight text-ink uppercase">
          PDF To Go
        </span>
        <BaseBadge color="accent2" class="hidden sm:inline-flex">
          100% Offline
        </BaseBadge>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-2 md:gap-3">
      <!-- Queue Button -->
      <button
        class="relative border-2 border-ink bg-paper px-3 py-1.5 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-hard-sm hover:bg-accent cursor-pointer"
        @click="toggleQueueDrawer"
        title="Buka antrean berkas"
      >
        <span>{{ t('queue.title') || 'Antrean' }}</span>
        <span
          v-if="queueState.count > 0"
          class="bg-accent px-1.5 py-0.2 border border-ink text-[10px] font-black"
        >
          {{ queueState.count }}
        </span>
      </button>

      <!-- Language Toggle -->
      <button
        class="border-2 border-ink bg-paper px-2.5 py-1.5 font-bold text-xs uppercase tracking-wider shadow-hard-sm hover:bg-accent cursor-pointer"
        @click="toggleLang"
        title="Ganti Bahasa (ID / EN)"
      >
        {{ currentLang.toUpperCase() }}
      </button>

      <!-- Theme Toggle -->
      <button
        class="border-2 border-ink bg-paper p-1.5 font-bold text-xs shadow-hard-sm hover:bg-accent cursor-pointer"
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
