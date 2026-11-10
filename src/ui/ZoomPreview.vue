<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { MIN_ZOOM, MAX_ZOOM, clampZoom } from './logic/viewportZoom.js';

const zoom = ref(1);
const viewport = ref(null);
const width = ref(0);
let observer;
onMounted(() => {
  observer = new ResizeObserver(() => { width.value = viewport.value.clientWidth; });
  observer.observe(viewport.value);
});
onUnmounted(() => observer?.disconnect());
</script>

<template>
  <div class="min-w-0 space-y-2" data-testid="zoom-preview">
    <div class="flex items-center gap-2 text-xs" role="group" aria-label="Zoom preview" @pointerdown.stop @dragstart.prevent.stop>
      <button type="button" class="border border-ink rounded px-2 py-1 disabled:opacity-40" aria-label="Perkecil zoom" :disabled="zoom <= MIN_ZOOM" @click="zoom = clampZoom(zoom - 0.25)">−</button>
      <button type="button" class="border border-ink rounded px-2 py-1" aria-label="Reset zoom" @click="zoom = 1">{{ Math.round(zoom * 100) }}%</button>
      <button type="button" class="border border-ink rounded px-2 py-1 disabled:opacity-40" aria-label="Perbesar zoom" :disabled="zoom >= MAX_ZOOM" @click="zoom = clampZoom(zoom + 0.25)">+</button>
    </div>
    <div ref="viewport" class="overflow-auto max-h-[65vh]" tabindex="0" aria-label="Preview">
      <div :style="{ zoom, width: width ? `${width}px` : '100%' }" data-testid="zoom-content"><slot /></div>
    </div>
  </div>
</template>
