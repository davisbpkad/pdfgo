<script setup>
import { ref, watch, onMounted } from 'vue';

const props = defineProps({
  pdfDocProxy: { type: Object, default: null },
  currentPage: { type: Number, default: 1 },
  boxes: { type: Array, default: () => [] },
  scale: { type: Number, default: 0.8 }
});

const emit = defineEmits(['add-box', 'remove-box', 'rendered']);

const canvasRef = ref(null);
const wrapperRef = ref(null);
const currentDrawingRect = ref(null);
let isDrawing = false;
let startPoint = null;

onMounted(() => renderPage());
watch(() => [props.pdfDocProxy, props.currentPage], () => renderPage());

async function renderPage() {
  if (!props.pdfDocProxy || !canvasRef.value) return;
  try {
    const page = await props.pdfDocProxy.getPage(props.currentPage);
    const viewport = page.getViewport({ scale: props.scale });
    const canvas = canvasRef.value;
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    emit('rendered', { width: canvas.width, height: canvas.height });

    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport }).promise;
  } catch (err) {
    console.warn('Gagal merender halaman sensor:', err);
  }
}

function onPointerDown(e) {
  if (e.target.closest('.redact-box-item')) return;
  const rect = wrapperRef.value.getBoundingClientRect();
  isDrawing = true;
  startPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  currentDrawingRect.value = { x: startPoint.x, y: startPoint.y, width: 0, height: 0 };
  wrapperRef.value.setPointerCapture(e.pointerId);
}

function onPointerMove(e) {
  if (!isDrawing || !startPoint) return;
  const rect = wrapperRef.value.getBoundingClientRect();
  const curX = e.clientX - rect.left;
  const curY = e.clientY - rect.top;

  const left = Math.min(startPoint.x, curX);
  const top = Math.min(startPoint.y, curY);
  const width = Math.abs(curX - startPoint.x);
  const height = Math.abs(curY - startPoint.y);

  currentDrawingRect.value = { x: left, y: top, width, height };
}

function onPointerUp(e) {
  if (!isDrawing) return;
  isDrawing = false;

  if (currentDrawingRect.value) {
    const { width, height } = currentDrawingRect.value;
    if (width > 8 && height > 8) {
      emit('add-box', { ...currentDrawingRect.value });
    }
    currentDrawingRect.value = null;
  }
  startPoint = null;
  try { wrapperRef.value?.releasePointerCapture(e.pointerId); } catch (_) {}
}
</script>

<template>
  <div
    ref="wrapperRef"
    class="relative inline-block border-3 border-ink bg-white shadow-hard select-none overflow-hidden touch-none cursor-crosshair"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
  >
    <canvas ref="canvasRef" class="block max-w-full h-auto" />

    <!-- Existing Redaction Boxes on this page -->
    <div
      v-for="b in boxes"
      :key="b.id"
      class="redact-box-item absolute bg-black border border-white cursor-pointer flex items-center justify-center group"
      :style="{
        left: `${b.x}px`,
        top: `${b.y}px`,
        width: `${b.width}px`,
        height: `${b.height}px`
      }"
      title="Klik untuk menghapus kotak sensor ini"
      @click.stop="$emit('remove-box', b.id)"
    >
      <span class="text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity select-none">
        ✕
      </span>
    </div>

    <!-- Active Drawing Rectangle -->
    <div
      v-if="currentDrawingRect"
      class="absolute bg-black/80 border-2 border-dashed border-red-500 pointer-events-none"
      :style="{
        left: `${currentDrawingRect.x}px`,
        top: `${currentDrawingRect.y}px`,
        width: `${currentDrawingRect.width}px`,
        height: `${currentDrawingRect.height}px`
      }"
    />
  </div>
</template>
