<script setup>
import { t } from '../../../app/providers/i18n.js';
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { unwrapPdfProxy } from '../../../core/pdf.js';
import { MIN_BOX_FRACTION, nudgeBox, moveBox, resizeBox } from '../logic/boxInteractions.js';

const props = defineProps({
  pdfDocProxy: { type: Object, default: null },
  currentPage: { type: Number, default: 1 },
  boxes: { type: Array, default: () => [] },
  selectedBoxId: { type: String, default: null },
  scale: { type: Number, default: 1.0 }
});

const emit = defineEmits(['add-box', 'update-box', 'remove-box', 'select-box', 'rendered']);

const canvasRef = ref(null);
const wrapperRef = ref(null);
const drawingRect = ref(null);

let isDrawing = false;
let startPoint = null;
let activeDrag = null; // { mode: 'move'|'resize', box, startX, startY, initBox }

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
    emit('rendered', { width: canvas.width, height: canvas.height });

    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport }).promise;
  } catch (err) {
    console.warn('Gagal merender halaman sensor:', err);
  }
}

function onKeyDown(e) {
  if (!props.selectedBoxId) return;
  const box = props.boxes.find(b => b.id === props.selectedBoxId);
  if (!box) return;

  if (e.key === 'Delete' || e.key === 'Backspace') {
    e.preventDefault();
    emit('remove-box', box.id);
  } else if (e.key === 'Escape') {
    if (activeDrag) {
      emit('update-box', { ...activeDrag.initBox });
      activeDrag = null;
    } else {
      emit('select-box', null);
    }
  } else if (e.key.startsWith('Arrow')) {
    e.preventDefault();
    const dir = e.key.replace('Arrow', '').toLowerCase();
    const updated = nudgeBox(box, dir, e.shiftKey);
    emit('update-box', { ...box, ...updated });
  }
}

function onWrapperPointerDown(e) {
  if (e.target.closest('.redact-box-item')) return;
  emit('select-box', null);
  const rect = wrapperRef.value.getBoundingClientRect();
  isDrawing = true;
  startPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top, rectW: rect.width, rectH: rect.height };
  drawingRect.value = { x: startPoint.x / rect.width, y: startPoint.y / rect.height, width: 0, height: 0 };
  wrapperRef.value.setPointerCapture(e.pointerId);
}

function startBoxDrag(e, box, mode) {
  e.stopPropagation();
  emit('select-box', box.id);
  const rect = wrapperRef.value.getBoundingClientRect();
  activeDrag = {
    mode,
    boxId: box.id,
    startX: e.clientX,
    startY: e.clientY,
    rectW: rect.width,
    rectH: rect.height,
    initBox: { ...box }
  };
  wrapperRef.value.setPointerCapture(e.pointerId);
}

function onPointerMove(e) {
  if (isDrawing && startPoint) {
    const curX = Math.max(0, Math.min(startPoint.rectW, e.clientX - wrapperRef.value.getBoundingClientRect().left));
    const curY = Math.max(0, Math.min(startPoint.rectH, e.clientY - wrapperRef.value.getBoundingClientRect().top));
    const left = Math.min(startPoint.x, curX) / startPoint.rectW;
    const top = Math.min(startPoint.y, curY) / startPoint.rectH;
    const width = Math.abs(curX - startPoint.x) / startPoint.rectW;
    const height = Math.abs(curY - startPoint.y) / startPoint.rectH;
    drawingRect.value = { x: left, y: top, width, height };
  } else if (activeDrag) {
    const dxNorm = (e.clientX - activeDrag.startX) / activeDrag.rectW;
    const dyNorm = (e.clientY - activeDrag.startY) / activeDrag.rectH;
    if (activeDrag.mode === 'move') {
      emit('update-box', moveBox(activeDrag.initBox, dxNorm, dyNorm));
    } else if (activeDrag.mode === 'resize') {
      emit('update-box', resizeBox(activeDrag.initBox, dxNorm, dyNorm));
    }
  }
}

function onPointerUp(e) {
  if (isDrawing) {
    isDrawing = false;
    if (drawingRect.value && drawingRect.value.width >= MIN_BOX_FRACTION && drawingRect.value.height >= MIN_BOX_FRACTION) {
      emit('add-box', { ...drawingRect.value });
    }
    drawingRect.value = null;
    startPoint = null;
  }
  if (activeDrag) {
    activeDrag = null;
  }
  try { wrapperRef.value?.releasePointerCapture(e.pointerId); } catch (_) {}
}
</script>

<template>
  <div
    ref="wrapperRef"
    tabindex="0"
    class="relative inline-block border-3 border-ink bg-white shadow-hard select-none overflow-hidden touch-none cursor-crosshair focus:outline-none"
    @pointerdown="onWrapperPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
  >
    <canvas ref="canvasRef" class="block max-w-full h-auto" />

    <!-- Existing Redaction Boxes (Normalized 0..1 in percentages) -->
    <div
      v-for="b in boxes"
      :key="b.id"
      class="redact-box-item absolute bg-black border cursor-move select-none"
      :class="[
        b.id === selectedBoxId ? 'border-2 border-red-500 z-20 shadow-hard-sm' : 'border-white z-10'
      ]"
      :style="{
        left: `${b.x * 100}%`,
        top: `${b.y * 100}%`,
        width: `${b.width * 100}%`,
        height: `${b.height * 100}%`
      }"
      @pointerdown="startBoxDrag($event, b, 'move')"
    >
      <!-- Resize Handle (touch area >= 24px via pseudo-element) -->
      <div
        v-if="b.id === selectedBoxId"
        class="resize-handle absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-red-500 border-2 border-white cursor-se-resize z-30"
        :title="t('tools.redact.resizeBoxTitle')"
        @pointerdown.stop="startBoxDrag($event, b, 'resize')"
      />
    </div>

    <!-- Active Drawing Rectangle -->
    <div
      v-if="drawingRect"
      class="absolute bg-black/80 border-2 border-dashed border-red-500 pointer-events-none z-30"
      :style="{
        left: `${drawingRect.x * 100}%`,
        top: `${drawingRect.y * 100}%`,
        width: `${drawingRect.width * 100}%`,
        height: `${drawingRect.height * 100}%`
      }"
    />
  </div>
</template>

<style scoped>
.resize-handle::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 28px;
  height: 28px;
}
</style>
