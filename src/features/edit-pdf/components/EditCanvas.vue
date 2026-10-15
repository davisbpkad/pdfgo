<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { unwrapPdfProxy } from '../../../core/pdf.js';
import { nudgeObject, moveObject, resizeObject } from '../logic/objectInteractions.js';
import EditOverlayItem from './EditOverlayItem.vue';

const props = defineProps({
  pdfDocProxy: { type: Object, default: null },
  currentPage: { type: Number, default: 1 },
  objects: { type: Array, default: () => [] },
  selectedObjectId: { type: String, default: null },
  scale: { type: Number, default: 1.0 },
  isDrawMode: { type: Boolean, default: false }
});

const emit = defineEmits(['add-object', 'update-object', 'remove-object', 'select-object', 'rendered']);
const canvasRef = ref(null);
const wrapperRef = ref(null);
let activeDrag = null;

onMounted(() => {
  renderPage();
  window.addEventListener('keydown', onKeyDown);
});
onUnmounted(() => window.removeEventListener('keydown', onKeyDown));

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
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
  } catch (err) {
    console.warn('Gagal merender halaman edit:', err);
  }
}

function onKeyDown(e) {
  if (!props.selectedObjectId) return;
  const obj = props.objects.find((o) => o.id === props.selectedObjectId);
  if (!obj) return;
  if (e.key === 'Delete' || e.key === 'Backspace') {
    e.preventDefault();
    emit('remove-object', obj.id);
  } else if (e.key.startsWith('Arrow')) {
    e.preventDefault();
    const dir = e.key.replace('Arrow', '').toLowerCase();
    emit('update-object', nudgeObject(obj, dir, e.shiftKey));
  }
}

function onPointerDown(e) {
  const rect = wrapperRef.value.getBoundingClientRect();
  if (props.isDrawMode) {
    activeDrag = { mode: 'draw', points: [{ x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height }] };
    wrapperRef.value.setPointerCapture(e.pointerId);
    return;
  }
  if (!e.target.closest('.edit-obj-item')) emit('select-object', null);
}

function startDrag(e, obj, mode) {
  if (props.isDrawMode) return;
  emit('select-object', obj.id);
  const rect = wrapperRef.value.getBoundingClientRect();
  activeDrag = { mode, objId: obj.id, startX: e.clientX, startY: e.clientY, rectW: rect.width, rectH: rect.height, initObj: { ...obj } };
  wrapperRef.value.setPointerCapture(e.pointerId);
}

function onPointerMove(e) {
  if (!activeDrag) return;
  const rect = wrapperRef.value.getBoundingClientRect();
  if (activeDrag.mode === 'draw') {
    activeDrag.points.push({ x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height });
  } else if (activeDrag.mode === 'move') {
    const dx = (e.clientX - activeDrag.startX) / activeDrag.rectW;
    const dy = (e.clientY - activeDrag.startY) / activeDrag.rectH;
    emit('update-object', moveObject(activeDrag.initObj, dx, dy));
  } else if (activeDrag.mode === 'resize') {
    const dw = (e.clientX - activeDrag.startX) / activeDrag.rectW;
    const dh = (e.clientY - activeDrag.startY) / activeDrag.rectH;
    emit('update-object', resizeObject(activeDrag.initObj, dw, dh));
  }
}

function onPointerUp() {
  if (activeDrag?.mode === 'draw' && activeDrag.points.length > 1) {
    emit('add-object', { type: 'draw', points: [...activeDrag.points] });
  }
  activeDrag = null;
}
</script>

<template>
  <div
    ref="wrapperRef"
    class="relative inline-block select-none shadow-hard border-2 border-ink"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
  >
    <canvas ref="canvasRef" class="block pointer-events-none" />

    <EditOverlayItem
      v-for="obj in objects"
      :key="obj.id"
      :obj="obj"
      :is-selected="selectedObjectId === obj.id"
      @start-drag="startDrag"
    />
  </div>
</template>
