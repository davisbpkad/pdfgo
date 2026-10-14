<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { renderPageToCanvas, unwrapPdfProxy } from '../../../core/pdf.js';
import PreviewViewport from '../../../ui/PreviewViewport.vue';

const props = defineProps({
  pdfDocProxy: { type: Object, default: null },
  text: { type: String, default: 'CONFIDENTIAL' },
  fontSize: { type: Number, default: 48 },
  colorHex: { type: String, default: '#dc2626' },
  opacity: { type: Number, default: 25 },
  position: { type: String, default: 'diagonal' }
});

const previewPage = ref(1);
const totalPages = computed(() => props.pdfDocProxy?.numPages || 1);
const pageDimensionsPt = ref({ width: 595.28, height: 841.89 });
const canvasRef = ref(null);
const isRendering = ref(false);
const currentScale = ref(1.0);

watch(() => [props.pdfDocProxy, previewPage.value], async () => {
  if (props.pdfDocProxy) {
    try {
      const rawDoc = unwrapPdfProxy(props.pdfDocProxy);
      const page = await rawDoc.getPage(previewPage.value);
      const vp = page.getViewport({ scale: 1.0 });
      pageDimensionsPt.value = { width: vp.width, height: vp.height };
    } catch (_) {}
  }
});

async function renderPreview(scale = currentScale.value) {
  if (!props.pdfDocProxy || !canvasRef.value) return;
  currentScale.value = scale;
  isRendering.value = true;

  try {
    const pageNum = Math.max(1, Math.min(totalPages.value, previewPage.value));
    const { canvas: renderedPage } = await renderPageToCanvas(props.pdfDocProxy, pageNum, scale);
    const targetCanvas = canvasRef.value;
    targetCanvas.width = renderedPage.width;
    targetCanvas.height = renderedPage.height;

    const ctx = targetCanvas.getContext('2d');
    ctx.drawImage(renderedPage, 0, 0);

    ctx.save();
    ctx.font = `bold ${props.fontSize * scale}px Atkinson Hyperlegible, sans-serif`;
    ctx.fillStyle = props.colorHex;
    ctx.globalAlpha = props.opacity / 100;

    const textMetrics = ctx.measureText(props.text);
    const textWidth = textMetrics.width;
    const textHeight = props.fontSize * scale;

    if (props.position === 'tiled') {
      const stepX = textWidth + 50 * scale;
      const stepY = textHeight + 60 * scale;
      for (let x = -targetCanvas.width * 0.5; x < targetCanvas.width * 1.5; x += stepX) {
        for (let y = -targetCanvas.height * 0.5; y < targetCanvas.height * 1.5; y += stepY) {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate((30 * Math.PI) / 180);
          ctx.fillText(props.text, 0, 0);
          ctx.restore();
        }
      }
    } else if (props.position === 'diagonal') {
      ctx.translate(targetCanvas.width / 2, targetCanvas.height / 2);
      ctx.rotate((-45 * Math.PI) / 180);
      ctx.fillText(props.text, -textWidth / 2, textHeight / 3);
    } else {
      ctx.fillText(props.text, (targetCanvas.width - textWidth) / 2, (targetCanvas.height + textHeight) / 2);
    }
    ctx.restore();

    renderedPage.width = 0;
    renderedPage.height = 0;
  } catch (e) {
    console.warn('Gagal merender pratinjau watermark:', e);
  } finally {
    isRendering.value = false;
  }
}

watch(() => [
  props.pdfDocProxy,
  props.text,
  props.fontSize,
  props.colorHex,
  props.opacity,
  props.position,
  previewPage.value
], () => {
  renderPreview(currentScale.value);
}, { deep: true });

onMounted(() => {
  renderPreview(1.0);
});
</script>

<template>
  <div class="border-3 border-ink bg-paper p-4 space-y-3">
    <!-- Header with Page Navigation -->
    <div class="flex flex-wrap items-center justify-between gap-2 border-b-2 border-ink pb-2">
      <div class="text-xs font-black uppercase tracking-tight text-ink flex items-center gap-1.5">
        <span>Pratinjau Watermark</span>
      </div>

      <!-- Page Selector -->
      <div class="flex items-center gap-1.5 text-xs font-bold">
        <button
          type="button"
          :disabled="previewPage <= 1"
          class="px-2 py-0.5 border border-ink bg-white hover:bg-paper-dark shadow-hard-sm disabled:opacity-40 cursor-pointer"
          @click="previewPage--"
        >
          ◀
        </button>
        <span class="flex items-center gap-1">
          <span>Hal</span>
          <input
            v-model.number="previewPage"
            type="number"
            min="1"
            :max="totalPages"
            class="w-12 p-0.5 text-center font-mono border border-ink bg-white shadow-hard-sm focus:outline-none"
          />
          <span>dari {{ totalPages }}</span>
        </span>
        <button
          type="button"
          :disabled="previewPage >= totalPages"
          class="px-2 py-0.5 border border-ink bg-white hover:bg-paper-dark shadow-hard-sm disabled:opacity-40 cursor-pointer"
          @click="previewPage++"
        >
          ▶
        </button>
      </div>
    </div>

    <!-- Viewport Container with Zoom & Pan -->
    <PreviewViewport
      :page-width-pt="pageDimensionsPt.width"
      :page-height-pt="pageDimensionsPt.height"
      :is-rendering="isRendering"
      v-slot="{ effectiveScale }"
      @update:effective-scale="renderPreview"
    >
      <div class="inline-block border-2 border-ink bg-white shadow-hard-sm">
        <canvas ref="canvasRef" class="block max-w-full h-auto" />
      </div>
    </PreviewViewport>
  </div>
</template>
