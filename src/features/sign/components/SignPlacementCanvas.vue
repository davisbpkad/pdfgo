<script setup>
import { ref, watch, onMounted } from 'vue';

const props = defineProps({
  pdfDocProxy: { type: Object, default: null },
  currentPage: { type: Number, default: 1 },
  signatureUrl: { type: String, default: null },
  placement: {
    type: Object,
    default: () => ({ x: 50, y: 50, width: 140, height: 70 })
  }
});

const emit = defineEmits(['update:placement', 'rendered']);

const canvasRef = ref(null);
const canvasDimensions = ref({ width: 0, height: 0 });

let isDragging = false;
let isResizing = false;
let startX = 0;
let startY = 0;
let initLeft = 0;
let initTop = 0;
let initW = 0;
let initH = 0;

onMounted(() => renderPage());
watch(() => [props.pdfDocProxy, props.currentPage], () => renderPage());

async function renderPage() {
  if (!props.pdfDocProxy || !canvasRef.value) return;
  try {
    const page = await props.pdfDocProxy.getPage(props.currentPage);
    const viewport = page.getViewport({ scale: 0.8 });
    const canvas = canvasRef.value;
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    canvasDimensions.value = { width: canvas.width, height: canvas.height };
    emit('rendered', canvasDimensions.value);

    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport }).promise;
  } catch (err) {
    console.warn('Gagal merender halaman:', err);
  }
}

function onDragStart(e) {
  isDragging = true;
  startX = e.clientX;
  startY = e.clientY;
  initLeft = props.placement.x;
  initTop = props.placement.y;
  e.currentTarget.setPointerCapture(e.pointerId);
}

function onDragMove(e) {
  if (!isDragging) return;
  const maxW = canvasDimensions.value.width || 600;
  const maxH = canvasDimensions.value.height || 800;
  const nextX = Math.max(0, Math.min(initLeft + (e.clientX - startX), maxW - props.placement.width));
  const nextY = Math.max(0, Math.min(initTop + (e.clientY - startY), maxH - props.placement.height));
  emit('update:placement', { ...props.placement, x: nextX, y: nextY });
}

function onDragEnd(e) {
  isDragging = false;
  try { e.currentTarget?.releasePointerCapture(e.pointerId); } catch (_) {}
}

function onResizeStart(e) {
  isResizing = true;
  startX = e.clientX;
  startY = e.clientY;
  initW = props.placement.width;
  initH = props.placement.height;
  e.currentTarget.setPointerCapture(e.pointerId);
}

function onResizeMove(e) {
  if (!isResizing) return;
  const maxW = (canvasDimensions.value.width || 600) - props.placement.x;
  const maxH = (canvasDimensions.value.height || 800) - props.placement.y;
  const nextW = Math.max(40, Math.min(initW + (e.clientX - startX), maxW));
  const nextH = Math.max(20, Math.min(initH + (e.clientY - startY), maxH));
  emit('update:placement', { ...props.placement, width: nextW, height: nextH });
}

function onResizeEnd(e) {
  isResizing = false;
  try { e.currentTarget?.releasePointerCapture(e.pointerId); } catch (_) {}
}
</script>

<template>
  <div class="relative inline-block border-3 border-ink bg-white shadow-hard select-none overflow-hidden touch-none">
    <canvas ref="canvasRef" class="block max-w-full h-auto" />

    <div
      v-if="signatureUrl"
      class="absolute cursor-move border-2 border-accent bg-paper/20 shadow-hard-sm"
      :style="{
        left: `${placement.x}px`,
        top: `${placement.y}px`,
        width: `${placement.width}px`,
        height: `${placement.height}px`
      }"
      @pointerdown="onDragStart"
      @pointermove="onDragMove"
      @pointerup="onDragEnd"
    >
      <img :src="signatureUrl" alt="Paraf" class="w-full h-full object-contain pointer-events-none select-none" />
      <div
        class="absolute -right-2 -bottom-2 w-4 h-4 bg-ink border-2 border-paper cursor-nwse-resize shadow-hard-sm"
        @pointerdown.stop="onResizeStart"
        @pointermove.stop="onResizeMove"
        @pointerup.stop="onResizeEnd"
      />
    </div>
  </div>
</template>
