<script setup>
import { ref, watch, onMounted } from 'vue';
import { unwrapPdfProxy } from '../../../core/pdf.js';
import EditTextLayer from './EditTextLayer.vue';

const props = defineProps({
  pdfDocProxy: { type: Object, default: null },
  currentPage: { type: Number, default: 1 },
  textEdits: { type: Array, default: () => [] },
  scale: { type: Number, default: 1.0 }
});

const emit = defineEmits(['update-text', 'start-edit', 'rendered']);
const canvasRef = ref(null);

onMounted(() => renderPage());

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
</script>

<template>
  <div class="relative inline-block shadow-hard border-2 border-ink select-text">
    <canvas ref="canvasRef" class="block pointer-events-none" />

    <EditTextLayer
      :edits="textEdits"
      :scale="scale"
      @update-text="(id, value) => emit('update-text', id, value)"
      @start-edit="emit('start-edit')"
    />
  </div>
</template>
