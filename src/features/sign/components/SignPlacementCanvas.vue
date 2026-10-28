<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { unwrapPdfProxy } from '../../../core/pdf.js';
import { t } from '../../../app/providers/i18n.js';

const props = defineProps({
  pdfDocProxy: { type: Object, default: null },
  currentPage: { type: Number, default: 1 },
  signatureUrl: { type: String, default: null },
  scale: { type: Number, default: 1.0 },
  placement: {
    type: Object,
    default: () => ({ x: 0.1, y: 0.1, width: 0.25, height: 0.12 })
  }
});

const emit = defineEmits(['update:placement', 'rendered']);

const canvasRef = ref(null);
const wrapperRef = ref(null);
const canvasDimensions = ref({ width: 0, height: 0 });

let isDragging = false;
let isResizing = false;
let startX = 0;
let startY = 0;
let initPlacement = null;

const r6 = n => Math.round(n * 1e6) / 1e6;

onMounted(() => {
  renderPage();
  window.addEventListener('keydown', onKeyDown);
});
onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown);
});

watch(() => [props.pdfDocProxy, props.currentPage, props.scale], () => renderPage());

async function renderPage() {
  if (!props.pdfDocProxy || !canvasRef.value) return;
  try {
    const rawDoc = unwrapPdfProxy(props.pdfDocProxy);
    const page = await rawDoc.getPage(props.currentPage);
    const viewport = page.getViewport({ scale: props.scale });
    const canvas = canvasRef.value;
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    canvasDimensions.value = { width: canvas.width, height: canvas.height };
    emit('rendered', canvasDimensions.value);

    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport }).promise;
  } catch (err) {
    console.warn('Gagal merender halaman tanda tangan:', err);
  }
}

function onKeyDown(e) {
  if (!props.signatureUrl) return;

  if (e.key === 'Escape') {
    if (initPlacement) {
      emit('update:placement', { ...initPlacement });
      isDragging = false;
      isResizing = false;
      initPlacement = null;
    }
    return;
  }

  if (e.key.startsWith('Arrow')) {
    e.preventDefault();
    const step = e.shiftKey ? 0.02 : 0.002;
    let { x, y, width, height } = props.placement;

    if (e.key === 'ArrowLeft') x = Math.max(0, x - step);
    if (e.key === 'ArrowRight') x = Math.min(1 - width, x + step);
    if (e.key === 'ArrowUp') y = Math.max(0, y - step);
    if (e.key === 'ArrowDown') y = Math.min(1 - height, y + step);

    emit('update:placement', {
      ...props.placement,
      x: r6(x),
      y: r6(y)
    });
  }
}

function onDragStart(e) {
  isDragging = true;
  startX = e.clientX;
  startY = e.clientY;
  initPlacement = { ...props.placement };
  wrapperRef.value?.setPointerCapture(e.pointerId);
}

function onResizeStart(e) {
  e.stopPropagation();
  isResizing = true;
  startX = e.clientX;
  startY = e.clientY;
  initPlacement = { ...props.placement };
  wrapperRef.value?.setPointerCapture(e.pointerId);
}

function onPointerMove(e) {
  if (!wrapperRef.value || (!isDragging && !isResizing)) return;
  const rect = wrapperRef.value.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return;

  if (isDragging && initPlacement) {
    const dxNorm = (e.clientX - startX) / rect.width;
    const dyNorm = (e.clientY - startY) / rect.height;
    const nextX = Math.max(0, Math.min(1 - initPlacement.width, initPlacement.x + dxNorm));
    const nextY = Math.max(0, Math.min(1 - initPlacement.height, initPlacement.y + dyNorm));
    emit('update:placement', { ...props.placement, x: r6(nextX), y: r6(nextY) });
  } else if (isResizing && initPlacement) {
    const dwNorm = (e.clientX - startX) / rect.width;
    const dhNorm = (e.clientY - startY) / rect.height;
    const nextW = Math.max(0.04, Math.min(1 - initPlacement.x, initPlacement.width + dwNorm));
    const nextH = Math.max(0.02, Math.min(1 - initPlacement.y, initPlacement.height + dhNorm));
    emit('update:placement', { ...props.placement, width: r6(nextW), height: r6(nextH) });
  }
}

function onPointerUp(e) {
  if (isDragging || isResizing) {
    isDragging = false;
    isResizing = false;
    initPlacement = null;
    try { wrapperRef.value?.releasePointerCapture(e.pointerId); } catch (_) {}
  }
}
</script>

<template>
  <div
    ref="wrapperRef"
    tabindex="0"
    class="relative inline-block border-3 border-ink bg-white shadow-hard select-none overflow-hidden touch-none focus:outline-none"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
  >
    <canvas ref="canvasRef" class="block max-w-full h-auto" />

    <!-- Signature Placement Overlay (Positioned in Percentages) -->
    <div
      v-if="signatureUrl"
      class="absolute cursor-move border-2 border-accent bg-paper/20 shadow-hard-sm"
      :style="{
        left: `${placement.x * 100}%`,
        top: `${placement.y * 100}%`,
        width: `${placement.width * 100}%`,
        height: `${placement.height * 100}%`
      }"
      @pointerdown="onDragStart"
    >
      <img :src="signatureUrl" :alt="t('tools.sign.signatureAlt')" class="w-full h-full object-contain pointer-events-none select-none" />

      <!-- Resize Handle with >= 24px touch target -->
      <div
        class="sign-resize-handle absolute -right-2 -bottom-2 w-4 h-4 bg-ink border-2 border-paper cursor-nwse-resize shadow-hard-sm z-20"
        :title="t('tools.sign.resizeHandle')"
        @pointerdown.stop="onResizeStart"
      />
    </div>
  </div>
</template>

<style scoped>
.sign-resize-handle::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 28px;
  height: 28px;
}
</style>
