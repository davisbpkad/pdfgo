<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { renderScale } from '../core/coordinates.js';
import { MIN_ZOOM, MAX_ZOOM, ZOOM_PRESETS, clampZoom, calculateFitWidthZoom } from './logic/viewportZoom.js';

const props = defineProps({
  pageWidthPt: { type: Number, default: 595.28 },
  pageHeightPt: { type: Number, default: 841.89 },
  isRendering: { type: Boolean, default: false },
  initialZoom: { type: Number, default: null }
});

const emit = defineEmits(['update:zoom', 'update:effective-scale']);

const viewportContainerRef = ref(null);
const zoom = ref(1.0);
const isFitWidth = ref(true);
const showPresetDropdown = ref(false);

const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;

const effectiveScale = computed(() => {
  return renderScale(zoom.value, dpr, props.pageWidthPt, props.pageHeightPt).scale;
});

let resizeTimer = null;
let resizeObserver = null;

// Pan state
let isPanning = false;
let panStartX = 0;
let panStartY = 0;
let scrollStartX = 0;
let scrollStartY = 0;
let initialPinchDist = null;
let initialPinchZoom = null;

onMounted(() => {
  if (viewportContainerRef.value) {
    resizeObserver = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (isFitWidth.value) applyFitWidth();
      }, 150);
    });
    resizeObserver.observe(viewportContainerRef.value);
  }
  applyFitWidth();
});

onUnmounted(() => {
  if (resizeObserver) resizeObserver.disconnect();
  clearTimeout(resizeTimer);
});

watch(zoom, (newZoom) => {
  emit('update:zoom', newZoom);
  emit('update:effective-scale', effectiveScale.value);
});

function applyFitWidth() {
  if (!viewportContainerRef.value) return;
  const containerW = viewportContainerRef.value.clientWidth;
  zoom.value = calculateFitWidthZoom(containerW, props.pageWidthPt, 32);
  isFitWidth.value = true;
}

function setZoomPreset(level) {
  isFitWidth.value = false;
  zoom.value = clampZoom(level);
  showPresetDropdown.value = false;
}

function zoomIn() {
  isFitWidth.value = false;
  const current = zoom.value;
  const next = ZOOM_PRESETS.find(p => p > current + 0.05) || Math.min(MAX_ZOOM, current + 0.25);
  zoom.value = clampZoom(next);
}

function zoomOut() {
  isFitWidth.value = false;
  const current = zoom.value;
  const prev = [...ZOOM_PRESETS].reverse().find(p => p < current - 0.05) || Math.max(MIN_ZOOM, current - 0.25);
  zoom.value = clampZoom(prev);
}

function resetPan() {
  if (!viewportContainerRef.value) return;
  const el = viewportContainerRef.value;
  el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
  el.scrollTop = 0;
}

function onWheel(e) {
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    isFitWidth.value = false;
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    zoom.value = clampZoom(Number((zoom.value + delta).toFixed(2)));
  }
}

function onKeyDown(e) {
  if (e.key === '+' || e.key === '=') {
    e.preventDefault();
    zoomIn();
  } else if (e.key === '-' || e.key === '_') {
    e.preventDefault();
    zoomOut();
  } else if (e.key === '0') {
    e.preventDefault();
    setZoomPreset(1.0);
  }
}

function onPointerDown(e) {
  if (e.target.closest('canvas, .redact-box-item, .cursor-move, button, input, select')) return;
  isPanning = true;
  panStartX = e.clientX;
  panStartY = e.clientY;
  scrollStartX = viewportContainerRef.value.scrollLeft;
  scrollStartY = viewportContainerRef.value.scrollTop;
  viewportContainerRef.value.setPointerCapture(e.pointerId);
}

function onPointerMove(e) {
  if (!isPanning || !viewportContainerRef.value) return;
  const dx = e.clientX - panStartX;
  const dy = e.clientY - panStartY;
  viewportContainerRef.value.scrollLeft = scrollStartX - dx;
  viewportContainerRef.value.scrollTop = scrollStartY - dy;
}

function onPointerUp(e) {
  if (isPanning) {
    isPanning = false;
    try { viewportContainerRef.value?.releasePointerCapture(e.pointerId); } catch (_) {}
  }
}

function onTouchStart(e) {
  if (e.touches.length === 2) {
    const t1 = e.touches[0];
    const t2 = e.touches[1];
    initialPinchDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
    initialPinchZoom = zoom.value;
  }
}

function onTouchMove(e) {
  if (e.touches.length === 2 && initialPinchDist) {
    const t1 = e.touches[0];
    const t2 = e.touches[1];
    const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
    const scaleFactor = dist / initialPinchDist;
    isFitWidth.value = false;
    zoom.value = clampZoom(Number((initialPinchZoom * scaleFactor).toFixed(2)));
  }
}

function onTouchEnd() {
  initialPinchDist = null;
  initialPinchZoom = null;
}
</script>

<template>
  <div class="space-y-2 select-none">
    <!-- Viewport Toolbar (Brutalism Style) -->
    <div class="flex flex-wrap items-center justify-between gap-2 p-2 border-2 border-ink bg-paper rounded-sm shadow-hard-sm text-xs font-bold text-ink">
      <!-- Left: Zoom Preset Buttons -->
      <div class="flex items-center gap-1.5">
        <button
          type="button"
          class="px-2.5 py-1 border border-ink bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-sm shadow-hard-sm hover:shadow-hard hover:-translate-y-0.5 active:translate-y-0.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none transition-all duration-150"
          :disabled="zoom <= MIN_ZOOM"
          title="Perkecil Zoom (-)"
          aria-label="Perkecil zoom"
          @click="zoomOut"
        >
          −
        </button>

        <!-- Clickable Percentage Dropdown -->
        <div class="relative">
          <button
            type="button"
            class="px-2.5 py-1 border border-ink bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-sm shadow-hard-sm hover:shadow-hard hover:-translate-y-0.5 active:translate-y-0.5 cursor-pointer min-w-[58px] text-center transition-all duration-150"
            title="Pilih preset zoom"
            aria-label="Pilih persentase zoom"
            @click="showPresetDropdown = !showPresetDropdown"
          >
            {{ Math.round(zoom * 100) }}%
          </button>

          <!-- Preset Menu -->
          <div
            v-if="showPresetDropdown"
            class="absolute top-full left-0 mt-1 z-50 bg-paper border-2 border-ink rounded-sm shadow-hard py-1 w-24 flex flex-col"
          >
            <button
              v-for="p in ZOOM_PRESETS"
              :key="p"
              type="button"
              class="px-3 py-1 text-left text-xs hover:bg-accent font-bold cursor-pointer transition-colors"
              :class="zoom === p ? 'bg-accent text-black' : ''"
              @click="setZoomPreset(p)"
            >
              {{ Math.round(p * 100) }}%
            </button>
          </div>
        </div>

        <button
          type="button"
          class="px-2.5 py-1 border border-ink bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-sm shadow-hard-sm hover:shadow-hard hover:-translate-y-0.5 active:translate-y-0.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none transition-all duration-150"
          :disabled="zoom >= MAX_ZOOM"
          title="Perbesar Zoom (+)"
          aria-label="Perbesar zoom"
          @click="zoomIn"
        >
          +
        </button>

        <button
          type="button"
          class="px-2.5 py-1 border border-ink rounded-sm shadow-hard-sm hover:shadow-hard hover:-translate-y-0.5 active:translate-y-0.5 cursor-pointer transition-all duration-150 ml-1"
          :class="isFitWidth ? 'bg-accent text-black font-black' : 'bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-ink'"
          title="Sesuaikan lebar halaman dengan jendela"
          @click="applyFitWidth"
        >
          Sesuaikan Lebar
        </button>

        <button
          type="button"
          class="px-2.5 py-1 border border-ink rounded-sm shadow-hard-sm hover:shadow-hard hover:-translate-y-0.5 active:translate-y-0.5 cursor-pointer transition-all duration-150"
          :class="zoom === 1.0 && !isFitWidth ? 'bg-accent text-black font-black' : 'bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-ink'"
          title="Skala 100%"
          @click="setZoomPreset(1.0)"
        >
          100%
        </button>
      </div>

      <!-- Right: Extra Status & Reset Pan -->
      <div class="flex items-center gap-2">
        <span v-if="isRendering" class="text-[11px] text-accent-strong animate-pulse font-bold">
          Mempertajam…
        </span>

        <button
          v-if="zoom > 1.0"
          type="button"
          class="px-2 py-1 border border-ink bg-white dark:bg-neutral-800 rounded-sm shadow-hard-sm hover:shadow-hard hover:-translate-y-0.5 active:translate-y-0.5 cursor-pointer text-[11px] transition-all duration-150"
          title="Kembalikan posisi pratinjau ke tengah"
          @click="resetPan"
        >
          ⌖ Tengah
        </button>

        <slot name="header-extra" />
      </div>
    </div>

    <!-- Scroll & Pan Viewport Container -->
    <div
      ref="viewportContainerRef"
      tabindex="0"
      class="border-3 border-ink bg-paper-dark p-4 overflow-auto min-h-[480px] h-[60vh] lg:h-[650px] flex items-start justify-center focus:outline-none cursor-grab active:cursor-grabbing touch-pan-x touch-pan-y"
      @wheel="onWheel"
      @keydown="onKeyDown"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
    >
      <div class="inline-block transition-transform duration-75">
        <slot
          :zoom="zoom"
          :effective-scale="effectiveScale"
          :fit-width="applyFitWidth"
          :reset-pan="resetPan"
          :is-fit-width="isFitWidth"
        />
      </div>
    </div>
  </div>
</template>
