<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { unwrapPdfProxy } from '../../../core/pdf.js';
import { nudgeObject } from '../logic/objectInteractions.js';
import { usePointerSession } from '../logic/usePointerSession.js';
import EditOverlayItem from './EditOverlayItem.vue';
import EditTextLayer from './EditTextLayer.vue';

const props = defineProps({
  pdfDocProxy: { type: Object, default: null },
  currentPage: { type: Number, default: 1 },
  objects: { type: Array, default: () => [] },
  textEdits: { type: Array, default: () => [] },
  selectedObjectId: { type: String, default: null },
  scale: { type: Number, default: 1.0 },
  isDrawMode: { type: Boolean, default: false },
  isTextMode: { type: Boolean, default: false }
});

const emit = defineEmits(['add-object', 'update-object', 'remove-object', 'select-object', 'update-text', 'start-edit', 'rendered']);
const canvasRef = ref(null);
const wrapperRef = ref(null);
const session = usePointerSession(wrapperRef, {
  onUpdate: (obj) => emit('update-object', obj),
  onDraw: (points) => emit('add-object', { type: 'draw', points })
});

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
  if (props.isTextMode) return; // typing/backspace belongs to the text editors
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
  if (props.isTextMode) return; // let the inline text editors own the pointer
  if (props.isDrawMode) {
    session.beginDraw(e);
    return;
  }
  if (!e.target.closest('.edit-obj-item')) emit('select-object', null);
}

function startDrag(e, obj, mode) {
  if (props.isDrawMode) return;
  emit('select-object', obj.id);
  session.beginTransform(e, obj, mode);
}

function onPointerMove(e) {
  session.move(e);
}

function onPointerUp() {
  session.end();
}
</script>

<template>
  <div
    ref="wrapperRef"
    class="relative inline-block shadow-hard border-2 border-ink"
    :class="isTextMode ? 'select-text' : 'select-none'"
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

    <div v-if="isTextMode && !isDrawMode" class="absolute inset-0 pointer-events-none">
      <EditTextLayer
        :edits="textEdits"
        :scale="scale"
        @update-text="(id, value) => emit('update-text', id, value)"
        @start-edit="emit('start-edit')"
      />
    </div>
  </div>
</template>
